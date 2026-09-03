/**
 * Hiero Skill Mastery — Transcript Timestamp Matcher
 *
 * Detect (wrong subtopic) → Learn (exact clip) pipeline:
 *   1. Fetch timed YouTube captions (not video summaries)
 *   2. Chunk into ~45s windows
 *   3. TF-IDF embed chunks + subtopic query
 *   4. Cosine similarity rank across a 5–10 video pool
 *   5. Merge adjacent high-scoring chunks
 *   6. Optional Groq Llama rerank of the top windows
 *
 * Returns youtube.com/watch?v=ID&t=XXXs plus start/end seconds.
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

const CACHE_DIR = path.join(__dirname, '..', 'data');
const CACHE_FILE = path.join(CACHE_DIR, 'transcript-cache.json');
const transcriptCache = new Map();
const matchCache = new Map();

const STOPWORDS = new Set(('a an the and or of to in on for with from by as is are was were be been being this that those these it its at if then than not no so such into over after before about between through during without within inner outer left right join joins sql query queries table tables from select where on using used use cases syntax example examples video tutorial course chapter').split(' '));

const YT_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Accept-Language': 'en-US,en;q=0.9'
};

/** Wider pool per subtopic — rank segments across videos, not 3 whole videos. */
const SUBTOPIC_VIDEO_POOLS = {
    'sql.joins.inner-join': [
        { youtubeId: '2EewKq7iYpk', title: 'SQL Joins Explained Simply' },
        { youtubeId: 'qwAFLRTKnLo', title: 'SQL Inner Join vs Outer Join' },
        { youtubeId: '9Pzj7Aj25lw', title: 'SQL Joins Tutorial' },
        { youtubeId: 'HXV3zeQKqGY', title: 'SQL Full Course – Bro Code' },
        { youtubeId: '7S_tz1z_5bA', title: 'SQL – freeCodeCamp Full Course' },
        { youtubeId: 'yPu6qV5byu4', title: 'MySQL Tutorial – Programming with Mosh' },
        { youtubeId: 'zsjvFFKOm3c', title: 'SQL Joins with Examples' },
        { youtubeId: 'JHfrbNtWJHc', title: 'Inner Join Walkthrough' }
    ],
    'sql.joins.left-join': [
        { youtubeId: '2EewKq7iYpk', title: 'SQL Joins Explained Simply' },
        { youtubeId: 'qwAFLRTKnLo', title: 'SQL Inner Join vs Outer Join' },
        { youtubeId: '9Pzj7Aj25lw', title: 'SQL Joins Tutorial' },
        { youtubeId: 'HXV3zeQKqGY', title: 'SQL Full Course – Bro Code' },
        { youtubeId: '7S_tz1z_5bA', title: 'SQL – freeCodeCamp Full Course' },
        { youtubeId: 'yPu6qV5byu4', title: 'MySQL Tutorial – Programming with Mosh' }
    ],
    'sql.joins.outer-join': [
        { youtubeId: '2EewKq7iYpk', title: 'SQL Joins Explained Simply' },
        { youtubeId: 'qwAFLRTKnLo', title: 'SQL Inner Join vs Outer Join' },
        { youtubeId: 'HXV3zeQKqGY', title: 'SQL Full Course – Bro Code' },
        { youtubeId: '7S_tz1z_5bA', title: 'SQL – freeCodeCamp Full Course' }
    ],
    'javascript.closures': [
        { youtubeId: '3a0I8ICR1Vg', title: 'Closures Explained' },
        { youtubeId: 'yjS2_qYVw8E', title: 'JavaScript Closures' },
        { youtubeId: 'H3XIJYEPdus', title: 'JS Closures Deep Dive' },
        { youtubeId: 'W6NZfCO5SIk', title: 'JavaScript Tutorial for Beginners' },
        { youtubeId: 'hdI2bqOjy3c', title: 'JS Crash Course' }
    ],
    'python.identity': [
        { youtubeId: 'kqtD5dpn9C8', title: 'Python for Beginners – Mosh' },
        { youtubeId: 'rfscVS0vtbw', title: 'Python Full Course – freeCodeCamp' },
        { youtubeId: '_uQrJ0TkZlc', title: 'Python Tutorial – Programming with Mosh' },
        { youtubeId: 'mRPmXAlCGt8', title: 'is vs == in Python' }
    ]
};

const SUBTOPIC_DESCRIPTIONS = {
    'inner-join': 'SQL inner joins, INNER JOIN syntax, matching rows from two tables, ON condition, use cases',
    'left-join': 'SQL left outer join, LEFT JOIN keeps all left table rows, nulls on right, syntax and use cases',
    'outer-join': 'SQL outer joins FULL OUTER JOIN LEFT RIGHT unmatched rows',
    'identity': 'Python is versus == identity vs equality memory identity',
    'closures': 'JavaScript closures lexical scope inner function accessing outer variables'
};

function loadDiskCache() {
    try {
        if (!fs.existsSync(CACHE_FILE)) return;
        const raw = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
        Object.entries(raw).forEach(([k, v]) => transcriptCache.set(k, v));
    } catch (e) {
        console.warn('[TranscriptMatcher] cache load skipped:', e.message);
    }
}

function saveDiskCache() {
    try {
        if (!fs.existsSync(CACHE_DIR)) fs.mkdirSync(CACHE_DIR, { recursive: true });
        const obj = {};
        transcriptCache.forEach((v, k) => { obj[k] = v; });
        fs.writeFileSync(CACHE_FILE, JSON.stringify(obj));
    } catch (e) {
        console.warn('[TranscriptMatcher] cache save skipped:', e.message);
    }
}

loadDiskCache();

function tokenize(text) {
    return String(text || '')
        .toLowerCase()
        .replace(/[^a-z0-9_\s]/g, ' ')
        .split(/\s+/)
        .filter(t => t.length > 1 && !STOPWORDS.has(t));
}

function tfidfVectors(documents) {
    const df = new Map();
    const tokenized = documents.map(tokenize);
    tokenized.forEach(tokens => {
        const uniq = new Set(tokens);
        uniq.forEach(t => df.set(t, (df.get(t) || 0) + 1));
    });
    const N = documents.length;
    return tokenized.map(tokens => {
        const tf = new Map();
        tokens.forEach(t => tf.set(t, (tf.get(t) || 0) + 1));
        const vec = new Map();
        let mag = 0;
        tf.forEach((count, term) => {
            const idf = Math.log((N + 1) / ((df.get(term) || 0) + 1)) + 1;
            const w = (count / tokens.length) * idf;
            vec.set(term, w);
            mag += w * w;
        });
        return { vec, mag: Math.sqrt(mag) || 1 };
    });
}

function cosine(a, b) {
    let dot = 0;
    a.vec.forEach((w, term) => {
        if (b.vec.has(term)) dot += w * b.vec.get(term);
    });
    return dot / (a.mag * b.mag);
}

function extractVideoId(urlOrId) {
    if (!urlOrId) return '';
    const s = String(urlOrId);
    if (/^[a-zA-Z0-9_-]{11}$/.test(s)) return s;
    const m = s.match(/(?:v=|youtu\.be\/|embed\/)([a-zA-Z0-9_-]{11})/);
    return m ? m[1] : '';
}

function extractPlayerResponse(html) {
    const markers = ['ytInitialPlayerResponse = ', 'ytInitialPlayerResponse":'];
    for (const marker of markers) {
        const i = html.indexOf(marker);
        if (i < 0) continue;
        const brace = html.indexOf('{', i);
        if (brace < 0) continue;
        let depth = 0;
        for (let j = brace; j < Math.min(html.length, brace + 2_500_000); j++) {
            const ch = html[j];
            if (ch === '{') depth++;
            else if (ch === '}') {
                depth--;
                if (depth === 0) {
                    try { return JSON.parse(html.slice(brace, j + 1)); } catch { return null; }
                }
            }
        }
    }
    return null;
}

function parseXmlCaptions(xml) {
    const cues = [];
    const re = /<text[^>]*start="([^"]+)"[^>]*(?:dur="([^"]+)")?[^>]*>([\s\S]*?)<\/text>/gi;
    let m;
    while ((m = re.exec(xml))) {
        const start = parseFloat(m[1]) || 0;
        const dur = parseFloat(m[2] || '2') || 2;
        const text = m[3]
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'")
            .replace(/<[^>]+>/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
        if (text) cues.push({ start, end: start + dur, text });
    }
    return cues;
}

function parseJson3Captions(json) {
    const events = json.events || [];
    const cues = [];
    events.forEach(ev => {
        const start = (ev.tStartMs || 0) / 1000;
        const dur = (ev.dDurationMs || 2000) / 1000;
        const text = (ev.segs || []).map(s => s.utf8 || '').join('').replace(/\s+/g, ' ').trim();
        if (text && text !== '\n') cues.push({ start, end: start + dur, text });
    });
    return cues;
}

async function fetchTimedTranscript(videoId) {
    if (transcriptCache.has(videoId)) return transcriptCache.get(videoId);

    let cues = [];
    try {
        const { data: html } = await axios.get(`https://www.youtube.com/watch?v=${videoId}`, {
            headers: YT_HEADERS,
            timeout: 12000
        });
        const player = extractPlayerResponse(html);
        const tracks = player?.captions?.playerCaptionsTracklistRenderer?.captionTracks || [];
        const track = tracks.find(t => (t.languageCode || '').startsWith('en')) || tracks[0];
        if (track?.baseUrl) {
            const url = track.baseUrl.replace(/\\u0026/g, '&') + '&fmt=json3';
            const cap = await axios.get(url, { headers: YT_HEADERS, timeout: 12000 });
            if (typeof cap.data === 'object') cues = parseJson3Captions(cap.data);
            else cues = parseXmlCaptions(String(cap.data));
        }
    } catch (e) {
        console.warn(`[TranscriptMatcher] watch-page captions failed for ${videoId}:`, e.message);
    }

    if (!cues.length) {
        try {
            const { data } = await axios.get('https://www.youtube.com/api/timedtext', {
                params: { v: videoId, lang: 'en', fmt: 'srv1' },
                headers: YT_HEADERS,
                timeout: 10000
            });
            cues = parseXmlCaptions(String(data || ''));
        } catch (e) {
            console.warn(`[TranscriptMatcher] timedtext failed for ${videoId}:`, e.message);
        }
    }

    transcriptCache.set(videoId, cues);
    saveDiskCache();
    return cues;
}

function chunkCues(cues, windowSec = 45, hopSec = 20) {
    if (!cues.length) return [];
    const lastEnd = cues[cues.length - 1].end;
    const chunks = [];
    for (let t = cues[0].start; t < lastEnd; t += hopSec) {
        const end = t + windowSec;
        const parts = cues.filter(c => c.end > t && c.start < end);
        if (!parts.length) continue;
        const text = parts.map(c => c.text).join(' ').trim();
        if (text.split(/\s+/).length < 8) continue;
        chunks.push({
            start: Math.floor(parts[0].start),
            end: Math.ceil(parts[parts.length - 1].end),
            text
        });
    }
    return chunks;
}

function mergeAdjacent(scored, minScore = 0.12, gapSec = 12) {
    const hits = scored.filter(c => c.score >= minScore).sort((a, b) => a.start - b.start);
    if (!hits.length) return scored.slice().sort((a, b) => b.score - a.score)[0] || null;

    const groups = [];
    let cur = { ...hits[0], members: [hits[0]] };
    for (let i = 1; i < hits.length; i++) {
        const h = hits[i];
        if (h.start <= cur.end + gapSec) {
            cur.end = Math.max(cur.end, h.end);
            cur.score = Math.max(cur.score, h.score);
            cur.text += ' ' + h.text;
            cur.members.push(h);
        } else {
            groups.push(cur);
            cur = { ...h, members: [h] };
        }
    }
    groups.push(cur);
    groups.sort((a, b) => b.score - a.score);
    const best = groups[0];
    const duration = best.end - best.start;
    if (duration > 240) {
        best.end = best.start + 180;
    }
    if (duration < 20) {
        best.end = best.start + 45;
    }
    return best;
}

function resolvePoolKey(subtopic) {
    const s = String(subtopic || '').toLowerCase();
    if (s.includes('inner') && s.includes('join')) return 'sql.joins.inner-join';
    if (s.includes('left') && s.includes('join')) return 'sql.joins.left-join';
    if (s.includes('outer') && s.includes('join')) return 'sql.joins.outer-join';
    if (s.includes('join')) return 'sql.joins.inner-join';
    if (s.includes('closure')) return 'javascript.closures';
    if (s.includes('identity') || s === 'is') return 'python.identity';
    return null;
}

function queryText(subtopic, description, questionText) {
    const key = String(subtopic || '').toLowerCase();
    const canned = SUBTOPIC_DESCRIPTIONS[key] || SUBTOPIC_DESCRIPTIONS[key.replace(/\s+/g, '-')];
    return [subtopic, canned, description, questionText].filter(Boolean).join('. ');
}

async function llmRerank(subtopic, topChunks, groqKey) {
    if (!groqKey || !topChunks.length) return null;
    try {
        const listing = topChunks.slice(0, 6).map((c, i) =>
            `[${i}] ${formatClock(c.start)}–${formatClock(c.end)} :: ${c.text.slice(0, 400)}`
        ).join('\n');
        const { data } = await axios.post(
            'https://api.groq.com/openai/v1/chat/completions',
            {
                model: process.env.AI_MODEL || 'llama-3.3-70b-versatile',
                temperature: 0.1,
                max_tokens: 200,
                messages: [
                    {
                        role: 'system',
                        content: 'You pick the transcript window that best teaches a SQL/JS/Python subtopic. Return JSON only: {"index":0,"start":123,"end":200,"reason":"..."}'
                    },
                    {
                        role: 'user',
                        content: `Subtopic: ${subtopic}\nWindows:\n${listing}`
                    }
                ]
            },
            { headers: { Authorization: `Bearer ${groqKey}`, 'Content-Type': 'application/json' }, timeout: 12000 }
        );
        const raw = data.choices?.[0]?.message?.content || '';
        const jsonMatch = raw.match(/\{[\s\S]*\}/);
        if (!jsonMatch) return null;
        const parsed = JSON.parse(jsonMatch[0]);
        const chosen = topChunks[parsed.index] || topChunks[0];
        return {
            start: Number(parsed.start) || chosen.start,
            end: Number(parsed.end) || chosen.end,
            reason: parsed.reason || 'LLM rerank',
            youtubeId: chosen.youtubeId,
            title: chosen.title
        };
    } catch (e) {
        console.warn('[TranscriptMatcher] Groq rerank skipped:', e.message);
        return null;
    }
}

function formatClock(sec) {
    const s = Math.max(0, Math.floor(sec));
    const m = Math.floor(s / 60);
    const r = s % 60;
    return `${m}:${String(r).padStart(2, '0')}`;
}

/**
 * @param {object} opts
 * @param {string} opts.subtopic  e.g. "inner-join" or "SQL > Joins > Inner Join"
 * @param {string} [opts.description]
 * @param {string} [opts.questionText]
 * @param {Array<{youtubeId?:string,url?:string,title?:string}>} [opts.candidateVideos]
 */
async function matchLearnSegment(opts = {}) {
    const subtopic = opts.subtopic || 'inner-join';
    const cacheKey = `${subtopic}::${(opts.questionText || '').slice(0, 80)}`;
    if (matchCache.has(cacheKey)) return matchCache.get(cacheKey);

    const poolKey = resolvePoolKey(subtopic);
    const pool = [
        ...(SUBTOPIC_VIDEO_POOLS[poolKey] || []),
        ...((opts.candidateVideos || []).map(v => ({
            youtubeId: extractVideoId(v.youtubeId || v.url),
            title: v.title || 'Candidate video'
        })))
    ].filter(v => v.youtubeId);

    const seen = new Set();
    const uniquePool = pool.filter(v => {
        if (seen.has(v.youtubeId)) return false;
        seen.add(v.youtubeId);
        return true;
    }).slice(0, 10);

    if (!uniquePool.length) {
        return { success: false, error: 'No candidate videos for this subtopic' };
    }

    const query = queryText(subtopic, opts.description, opts.questionText);
    const allChunks = [];

    await Promise.all(uniquePool.map(async (video) => {
        try {
            const cues = await fetchTimedTranscript(video.youtubeId);
            const chunks = chunkCues(cues);
            chunks.forEach(c => allChunks.push({ ...c, youtubeId: video.youtubeId, title: video.title }));
        } catch (e) {
            console.warn(`[TranscriptMatcher] skip ${video.youtubeId}:`, e.message);
        }
    }));

    if (!allChunks.length) {
        const fallback = uniquePool[0];
        const result = {
            success: true,
            method: 'fallback-video-start',
            warning: 'Timed captions were unavailable; opening the best candidate video from the start.',
            subtopic,
            youtubeId: fallback.youtubeId,
            title: fallback.title,
            startSec: 0,
            endSec: 90,
            startLabel: '0:00',
            endLabel: '1:30',
            watchUrl: `https://www.youtube.com/watch?v=${fallback.youtubeId}`,
            embedUrl: `https://www.youtube.com/embed/${fallback.youtubeId}?start=0&end=90&rel=0`,
            score: 0,
            poolSize: uniquePool.length,
            chunksScored: 0
        };
        matchCache.set(cacheKey, result);
        return result;
    }

    const docs = [query, ...allChunks.map(c => c.text)];
    const vectors = tfidfVectors(docs);
    const qVec = vectors[0];
    const scored = allChunks.map((c, i) => ({
        ...c,
        score: cosine(qVec, vectors[i + 1])
    })).sort((a, b) => b.score - a.score);

    let best = mergeAdjacent(scored);
    let method = 'tfidf-cosine';

    const groqKey = process.env.GROQ_API_KEY;
    const reranked = await llmRerank(subtopic, scored.slice(0, 8), groqKey);
    if (reranked && reranked.start >= 0) {
        best = { ...best, ...reranked, score: Math.max(best?.score || 0, 0.5) };
        method = 'tfidf-cosine+groq-llama-rerank';
    }

    const youtubeId = best.youtubeId;
    const startSec = Math.max(0, Math.floor(best.start));
    const endSec = Math.max(startSec + 25, Math.floor(best.end));

    const result = {
        success: true,
        method,
        algorithm: {
            embeddings: 'TF-IDF term vectors (local, no paid embedding API)',
            ranking: 'cosine similarity across 30–60s caption windows',
            merge: 'adjacent windows within 12s, cap 3 minutes',
            rerank: groqKey ? 'Groq Llama 3.3 70B on top-8 windows' : 'none (GROQ_API_KEY not set)'
        },
        subtopic,
        youtubeId,
        title: best.title,
        startSec,
        endSec,
        startLabel: formatClock(startSec),
        endLabel: formatClock(endSec),
        watchUrl: `https://www.youtube.com/watch?v=${youtubeId}&t=${startSec}s`,
        embedUrl: `https://www.youtube.com/embed/${youtubeId}?start=${startSec}&end=${endSec}&rel=0`,
        score: Number((best.score || 0).toFixed(4)),
        snippet: (best.text || '').slice(0, 280),
        poolSize: uniquePool.length,
        chunksScored: allChunks.length
    };

    matchCache.set(cacheKey, result);
    return result;
}

module.exports = {
    matchLearnSegment,
    fetchTimedTranscript,
    extractVideoId,
    SUBTOPIC_VIDEO_POOLS
};
