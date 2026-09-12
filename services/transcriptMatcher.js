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
    const events = (json && json.events) || [];
    const cues = [];
    events.forEach(ev => {
        const start = (ev.tStartMs || 0) / 1000;
        const dur = (ev.dDurationMs || 2000) / 1000;
        const text = (ev.segs || []).map(s => s.utf8 || '').join('').replace(/\s+/g, ' ').trim();
        if (text && text !== '\n') cues.push({ start, end: start + dur, text });
    });
    return cues;
}

function captionFmtUrl(baseUrl, fmt, tlang) {
    const raw = String(baseUrl || '').replace(/\\u0026/g, '&');
    try {
        const u = new URL(raw);
        u.searchParams.delete('fmt');
        u.searchParams.set('fmt', fmt);
        if (tlang && tlang !== 'en') u.searchParams.set('tlang', tlang);
        return u.toString();
    } catch {
        const extra = tlang && tlang !== 'en' ? `&tlang=${tlang}` : '';
        return `${raw}${raw.includes('?') ? '&' : '?'}fmt=${fmt}${extra}`;
    }
}

function pickCaptionTrack(tracks, pref) {
    const list = Array.isArray(tracks) ? tracks : [];
    const code = String(pref || 'en').toLowerCase().slice(0, 2);
    const native = list.find(t => String(t.languageCode || '').toLowerCase().startsWith(code) && t.kind !== 'asr')
        || list.find(t => String(t.languageCode || '').toLowerCase().startsWith(code));
    if (native) return { track: native, tlang: null };
    const en = list.find(t => String(t.languageCode || '').toLowerCase().startsWith('en'));
    if (en && code !== 'en') return { track: en, tlang: code };
    if (list[0] && code !== 'en') return { track: list[0], tlang: code };
    return { track: list[0] || null, tlang: null };
}

function tracksFromPlayer(payload) {
    return payload?.captions?.playerCaptionsTracklistRenderer?.captionTracks || [];
}

async function downloadCaptionCues(baseUrl, headers, tlang) {
    if (!baseUrl) return [];
    try {
        const cap = await axios.get(captionFmtUrl(baseUrl, 'json3', tlang), {
            headers,
            timeout: 8000,
            responseType: 'text',
            transformResponse: [d => d]
        });
        const body = String(cap.data || '').trim();
        if (!body) return [];
        try {
            const cues = parseJson3Captions(JSON.parse(body));
            if (cues.length) return cues;
        } catch {
            return parseXmlCaptions(body);
        }
    } catch (e) {
        console.warn('[TranscriptMatcher] caption json3 failed:', e.message);
    }
    return [];
}

async function playerViaInnertube(videoId, client, headers, apiKey) {
    const url = apiKey
        ? `https://www.youtube.com/youtubei/v1/player?key=${encodeURIComponent(apiKey)}&prettyPrint=false`
        : 'https://www.youtube.com/youtubei/v1/player?prettyPrint=false';
    const { data } = await axios.post(
        url,
        {
            context: { client },
            videoId,
            contentCheckOk: true,
            racyCheckOk: true
        },
        { headers: { ...headers, 'Content-Type': 'application/json' }, timeout: 7000 }
    );
    return data;
}

const fetchInFlight = new Map();

async function cuesViaAndroid(videoId, pref, apiKey) {
    const headers = {
        'User-Agent': 'com.google.android.youtube/20.10.38 (Linux; U; Android 14) gzip',
        'X-YouTube-Client-Name': '3',
        'X-YouTube-Client-Version': '20.10.38'
    };
    const data = await playerViaInnertube(
        videoId,
        {
            clientName: 'ANDROID',
            clientVersion: '20.10.38',
            androidSdkVersion: 34,
            hl: pref,
            gl: pref === 'en' ? 'US' : 'IN',
            osName: 'Android',
            osVersion: '14'
        },
        headers,
        apiKey
    );
    const picked = pickCaptionTrack(tracksFromPlayer(data), pref);
    if (!picked.track?.baseUrl) return [];
    const cues = await downloadCaptionCues(picked.track.baseUrl, headers, picked.tlang);
    if (cues.length) console.log(`[TranscriptMatcher] ${videoId} via ANDROID: ${cues.length} cues`);
    return cues;
}

function captionLang(langPref) {
    const s = String(langPref || 'en').toLowerCase().trim();
    const map = {
        english: 'en', en: 'en',
        hindi: 'hi', hi: 'hi',
        telugu: 'te', te: 'te',
        tamil: 'ta', ta: 'ta',
        kannada: 'kn', kn: 'kn', ka: 'kn',
        malayalam: 'ml', ml: 'ml', ma: 'ml'
    };
    if (map[s]) return map[s];
    if (s.length === 2) return s;
    return s.slice(0, 2) || 'en';
}

async function fetchTimedTranscript(videoId, langPref = 'en') {
    if (!videoId) return [];
    const pref = captionLang(langPref);
    const cacheKey = `${videoId}::${pref}::v2`;
    const cached = transcriptCache.get(cacheKey)
        || transcriptCache.get(`${videoId}::${pref}`)
        || (pref === 'en' ? transcriptCache.get(videoId) : null);
    if (Array.isArray(cached) && cached.length) return cached;
    if (fetchInFlight.has(cacheKey)) return fetchInFlight.get(cacheKey);

    const work = (async () => {
        let cues = [];
        try {
            cues = await cuesViaAndroid(videoId, pref);
        } catch (e) {
            console.warn(`[TranscriptMatcher] ANDROID captions failed for ${videoId}:`, e.message);
        }
        if (!cues.length && pref !== 'en') {
            try {
                cues = await cuesViaAndroid(videoId, 'en');
            } catch (e) {
                console.warn(`[TranscriptMatcher] ANDROID en fallback failed for ${videoId}:`, e.message);
            }
        }
        if (cues.length) {
            transcriptCache.set(cacheKey, cues);
            if (pref === 'en') transcriptCache.set(videoId, cues);
            if (cues.length < 2500) saveDiskCache();
        } else {
            console.warn(`[TranscriptMatcher] no captions for ${videoId} (${pref})`);
        }
        return cues;
    })();

    fetchInFlight.set(cacheKey, work);
    try {
        return await work;
    } finally {
        fetchInFlight.delete(cacheKey);
    }
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
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const r = s % 60;
    if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`;
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
    const cacheKey = `${subtopic}::${opts.skillName || ''}::${opts.codingLang || ''}::${opts.lang || ''}::${(opts.questionText || '').slice(0, 80)}`;
    if (matchCache.has(cacheKey)) return matchCache.get(cacheKey);

    const poolKey = resolvePoolKey(subtopic);
    const searched = (opts.candidateVideos || []).map(v => ({
        youtubeId: extractVideoId(v.youtubeId || v.url || v.videoId),
        title: v.title || 'Candidate video'
    })).filter(v => v.youtubeId);
    const useHardcodedPool = !opts.codingLang && !searched.length;
    const pool = [
        ...searched,
        ...(useHardcodedPool ? (SUBTOPIC_VIDEO_POOLS[poolKey] || []) : [])
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

async function generateStepSubtopics(skillName, stepName) {
    const skill = skillName || 'this skill';
    const step = stepName || skill;
    const fallback = [
        `What is ${skill}`,
        `${step} setup`,
        `Core ideas in ${step}`,
        `Beginner ${skill} example`
    ];
    const groqKey = process.env.GROQ_API_KEY;
    if (!groqKey) return fallback;
    try {
        const { data } = await axios.post(
            'https://api.groq.com/openai/v1/chat/completions',
            {
                model: process.env.AI_MODEL || 'llama-3.3-70b-versatile',
                temperature: 0.2,
                max_tokens: 220,
                messages: [
                    {
                        role: 'system',
                        content: 'Return JSON only: {"subtopics":["...","...","...","..."]}. Exactly 4 short beginner subtopic labels for one roadmap step. No timestamps.'
                    },
                    {
                        role: 'user',
                        content: `Skill: ${skill}\nRoadmap step: ${step}\nThese labels will be matched to timestamped captions inside one tutorial video.`
                    }
                ]
            },
            { headers: { Authorization: `Bearer ${groqKey}`, 'Content-Type': 'application/json' }, timeout: 10000 }
        );
        const raw = data.choices?.[0]?.message?.content || '';
        const jsonMatch = raw.match(/\{[\s\S]*\}/);
        const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
        const list = (parsed?.subtopics || []).map(s => String(s).trim()).filter(Boolean).slice(0, 4);
        return list.length >= 3 ? list : fallback;
    } catch (e) {
        console.warn('[TranscriptMatcher] subtopic generation skipped:', e.message);
        return fallback;
    }
}

function resolveOverlaps(chapters) {
    const sorted = chapters.slice().sort((a, b) => a.startSec - b.startSec);
    for (let i = 1; i < sorted.length; i++) {
        const prev = sorted[i - 1];
        const cur = sorted[i];
        if (cur.startSec < prev.endSec) {
            if (cur.startSec - prev.startSec >= 25) prev.endSec = cur.startSec;
            cur.startSec = Math.max(cur.startSec, prev.endSec);
            if (cur.endSec - cur.startSec < 25) cur.endSec = cur.startSec + 40;
        }
        prev.endLabel = formatClock(prev.endSec);
        cur.startLabel = formatClock(cur.startSec);
        cur.endLabel = formatClock(cur.endSec);
    }
    return sorted.map((c, i) => ({
        ...c,
        order: i + 1,
        startLabel: formatClock(c.startSec),
        endLabel: formatClock(c.endSec)
    }));
}

async function chapterizeVideo(opts = {}) {
    const youtubeId = extractVideoId(opts.youtubeId || opts.videoId || opts.url);
    if (!youtubeId) return { success: false, error: 'videoId required' };

    const skillName = opts.skillName || 'this skill';
    const stepName = opts.stepName || skillName;
    const lang = opts.lang || 'en';
    const durationSec = Math.max(90, Number(opts.durationSec) || 1800);
    const subtopics = Array.isArray(opts.subtopics) && opts.subtopics.length
        ? opts.subtopics.slice(0, 4)
        : await generateStepSubtopics(skillName, stepName);

    const cues = await fetchTimedTranscript(youtubeId, lang);
    if (!cues.length) {
        const slice = Math.floor(durationSec / subtopics.length);
        const chapters = subtopics.map((subTopic, i) => {
            const startSec = i * slice;
            const endSec = Math.min(durationSec, (i + 1) * slice);
            return {
                subTopic,
                startSec,
                endSec,
                startLabel: formatClock(startSec),
                endLabel: formatClock(endSec),
                snippet: '',
                score: 0,
                watchUrl: `https://www.youtube.com/watch?v=${youtubeId}&t=${startSec}s`,
                embedUrl: `https://www.youtube.com/embed/${youtubeId}?start=${startSec}&end=${endSec}&rel=0`
            };
        });
        return {
            success: true,
            method: 'even-split-no-captions',
            warning: 'Timed captions were unavailable, so this step was split evenly across the video.',
            youtubeId,
            title: opts.title || stepName,
            chapters: resolveOverlaps(chapters)
        };
    }

    const chunks = chunkCues(cues, 50, 22);
    const chapters = [];
    for (const subTopic of subtopics) {
        const query = `${skillName}. ${stepName}. ${subTopic}. beginner tutorial explanation`;
        const docs = [query, ...chunks.map(c => c.text)];
        const vectors = tfidfVectors(docs);
        const scored = chunks.map((c, i) => ({ ...c, score: cosine(vectors[0], vectors[i + 1]) }));
        const best = mergeAdjacent(scored, 0.06, 18);
        if (!best) continue;
        const startSec = Math.max(0, Math.floor(best.start));
        const endSec = Math.max(startSec + 30, Math.min(Math.floor(best.end), startSec + 240));
        chapters.push({
            subTopic,
            startSec,
            endSec,
            startLabel: formatClock(startSec),
            endLabel: formatClock(endSec),
            snippet: String(best.text || '').slice(0, 180),
            score: Number((best.score || 0).toFixed(4)),
            watchUrl: `https://www.youtube.com/watch?v=${youtubeId}&t=${startSec}s`,
            embedUrl: `https://www.youtube.com/embed/${youtubeId}?start=${startSec}&end=${endSec}&rel=0`
        });
    }

    return {
        success: true,
        method: 'tfidf-cosine-chapters',
        youtubeId,
        title: opts.title || stepName,
        chapters: resolveOverlaps(chapters)
    };
}

const TOPIC_ALIASES = {
    joints: ['join', 'joins', 'inner join', 'left join'],
    joint: ['join', 'joins'],
    join: ['joins', 'inner join'],
    joins: ['join', 'inner join', 'left join'],
    nosql: ['no sql', 'mongodb', 'mongo', 'document database'],
    'no-sql': ['nosql', 'mongodb'],
    mongodb: ['mongo', 'nosql'],
    indexes: ['index', 'indexing', 'unique index'],
    indexs: ['index', 'indexes'],
    index: ['indexes', 'indexing'],
    trees: ['tree', 'binary tree', 'bst'],
    tree: ['trees', 'binary tree'],
    loops: ['loop', 'for loop', 'while'],
    loop: ['loops', 'for loop']
};

const TOPIC_STOP = new Set('want learn teach explain show find where which what how does can please tell video tutorial part step module topic skill course help understand looking searching search about this that the a an and for with from you me my'.split(' '));

function normalizeUserQuery(message) {
    return String(message || '')
        .replace(/\s+/g, ' ')
        .trim()
        .replace(/\bno[\s-]*sql\b/gi, 'nosql')
        .replace(/\bjoints?\b/gi, 'joins')
        .replace(/\bindexs\b/gi, 'indexes');
}

function extractSearchTopic(message, skill) {
    const raw = normalizeUserQuery(message);
    const tokens = looseTokens(raw).filter((t) => !TOPIC_STOP.has(t) && t.length > 1);
    const skillTokens = new Set(looseTokens(skill || '').filter((t) => t.length > 2));
    const focused = tokens.filter((t) => !skillTokens.has(t));
    const topic = (focused.length ? focused : tokens).slice(0, 6).join(' ');
    return topic || raw.slice(0, 80);
}

function expandTopicTokens(tokens) {
    const out = [];
    for (const t of tokens || []) {
        out.push(t);
        const aliases = TOPIC_ALIASES[t];
        if (aliases) {
            aliases.forEach((a) => out.push(...String(a).split(/\s+/)));
        }
        if (t.endsWith('s') && t.length > 3) out.push(t.slice(0, -1));
        else if (t.length > 2) out.push(`${t}s`);
    }
    return [...new Set(out.filter((t) => t.length > 1))];
}

function textHasTopic(text, tokens) {
    const lower = String(text || '').toLowerCase();
    return (tokens || []).filter((tok) => {
        if (tok.length < 2) return false;
        if (lower.includes(tok)) return true;
        if (tok.startsWith('join') && /\bjoins?\b/.test(lower)) return true;
        if (tok === 'nosql' && /(no\s*sql|mongodb|mongo)/i.test(lower)) return true;
        return false;
    });
}

function looseTokens(text) {
    return String(text || '')
        .toLowerCase()
        .split(/[^\p{L}\p{N}_]+/u)
        .filter((t) => t.length > 1);
}

function matchNumberedStep(query, modules) {
    const list = Array.isArray(modules) ? modules : [];
    if (!list.length) return null;
    const q = String(query || '');
    const hit = q.match(/\b(?:part|step|module|chapter)\s*([1-9])\b/i)
        || q.match(/\b([1-9])(?:st|nd|rd|th)?\s*(?:part|step|module|chapter)\b/i);
    if (!hit) return null;
    const n = Number(hit[1]);
    return list.find((m) => Number(m.order) === n) || list[n - 1] || null;
}

function moduleLocateResult(youtubeId, topic, module, method) {
    const startSec = Math.max(0, Math.floor(Number(module.startSec) || 0));
    const endSec = Math.max(startSec + 25, Math.floor(Number(module.endSec) || startSec + 60));
    return {
        success: true,
        method,
        topic,
        matchedWord: topic,
        youtubeId,
        startSec,
        endSec,
        startLabel: module.startLabel || formatClock(startSec),
        endLabel: module.endLabel || formatClock(endSec),
        snippet: String(module.summary || module.title || '').replace(/\s+/g, ' ').trim().slice(0, 180),
        score: 1,
        step: {
            order: module.order,
            title: module.title,
            startSec: module.startSec,
            startLabel: module.startLabel,
            endLabel: module.endLabel
        }
    };
}

function mapTimeToModule(startSec, modules) {
    const list = Array.isArray(modules) ? modules : [];
    if (!list.length) return null;
    const exact = list.find((m) => startSec >= Number(m.startSec || 0) && startSec < Number(m.endSec || 0));
    if (exact) return exact;
    return list.reduce((best, m) => {
        const d = Math.abs(Number(m.startSec || 0) - startSec);
        return !best || d < best._d ? { ...m, _d: d } : best;
    }, null);
}

function snippetAround(cues, startSec, topicTokens) {
    const window = (cues || []).filter((c) => c.start >= startSec - 15 && c.start <= startSec + 35);
    const hit = window.find((c) => textHasTopic(c.text, topicTokens).length) || window[0];
    return hit ? String(hit.text || '').replace(/\s+/g, ' ').trim().slice(0, 180) : '';
}

async function locateTopicInVideo(opts = {}) {
    const youtubeId = extractVideoId(opts.youtubeId || opts.videoId || opts.url);
    const query = normalizeUserQuery(opts.query || opts.message || '');
    if (!youtubeId || !query) {
        return { success: false, message: 'videoId and query required' };
    }

    const topic = extractSearchTopic(query, opts.skill || opts.topic);
    const topicTokens = expandTopicTokens([...new Set([...looseTokens(topic), ...looseTokens(query)])].filter((t) => !TOPIC_STOP.has(t) && t.length > 1));
    const lang = opts.lang || 'en';
    const modules = Array.isArray(opts.modules) ? opts.modules : [];
    const numbered = matchNumberedStep(query, modules);
    if (numbered) {
        return moduleLocateResult(youtubeId, `part ${numbered.order}`, numbered, 'step-number');
    }
    const cues = await fetchTimedTranscript(youtubeId, lang);

    if (!cues.length) {
        const titleHit = modules.find((m) => textHasTopic(`${m.title || ''} ${m.summary || ''}`, topicTokens).length);
        if (!titleHit) {
            return { success: false, topic, youtubeId, message: 'No captions available for this video.' };
        }
        const startSec = Math.max(0, Math.floor(Number(titleHit.startSec) || 0));
        return {
            success: true,
            method: 'module-title',
            topic,
            matchedWord: topicTokens.find((tok) => `${titleHit.title} ${titleHit.summary}`.toLowerCase().includes(tok)) || topic,
            youtubeId,
            startSec,
            endSec: Math.max(startSec + 25, Math.floor(Number(titleHit.endSec) || startSec + 60)),
            startLabel: formatClock(startSec),
            endLabel: titleHit.endLabel || formatClock(Number(titleHit.endSec) || startSec + 60),
            snippet: String(titleHit.summary || titleHit.title || '').slice(0, 180),
            score: 0.4,
            step: {
                order: titleHit.order,
                title: titleHit.title,
                startSec: titleHit.startSec,
                startLabel: titleHit.startLabel,
                endLabel: titleHit.endLabel
            }
        };
    }

    const chunks = chunkCues(cues, 40, 18);
    if (!chunks.length) {
        return { success: false, topic, youtubeId, message: 'Transcript was too short to search.' };
    }

    const searchQuery = topicTokens.join(' ') || topic;
    const docs = [searchQuery, ...chunks.map((c) => c.text)];
    const vectors = tfidfVectors(docs);
    const qVec = vectors[0];
    const scored = chunks.map((c, i) => {
        let score = cosine(qVec, vectors[i + 1]);
        const hits = textHasTopic(c.text, topicTokens);
        if (hits.length) score += 0.45 + hits.length * 0.15;
        return { ...c, score, hits };
    }).sort((a, b) => b.score - a.score);

    const best = scored[0];
    if (!best || best.score < 0.08) {
        return { success: false, topic, youtubeId, message: 'That topic was not found in this video transcript.' };
    }

    const startSec = Math.max(0, Math.floor(best.start));
    const endSec = Math.max(startSec + 25, Math.floor(best.end));
    const module = mapTimeToModule(startSec, modules);
    const snippet = snippetAround(cues, startSec, topicTokens.length ? topicTokens : looseTokens(topic)) || String(best.text || '').replace(/\s+/g, ' ').trim().slice(0, 180);
    const matchedWord = (best.hits && best.hits[0])
        || topicTokens.find((t) => snippet.toLowerCase().includes(t))
        || topic;

    return {
        success: true,
        method: 'transcript-tfidf',
        topic,
        matchedWord,
        youtubeId,
        startSec,
        endSec,
        startLabel: formatClock(startSec),
        endLabel: formatClock(endSec),
        snippet,
        score: Number(best.score.toFixed(4)),
        step: module ? {
            order: module.order,
            title: module.title,
            startSec: module.startSec,
            startLabel: module.startLabel,
            endLabel: module.endLabel
        } : null
    };
}

module.exports = {
    matchLearnSegment,
    chapterizeVideo,
    generateStepSubtopics,
    locateTopicInVideo,
    fetchTimedTranscript,
    extractVideoId,
    formatClock,
    SUBTOPIC_VIDEO_POOLS
};
