/**
 * Split a timestamped tutorial transcript into 3–5 beginner modules via Groq.
 * Short videos: one LLM call. Long videos: ~10-minute chunks, then a merge pass.
 */

const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { fetchTimedTranscript, extractVideoId, formatClock } = require('./transcriptMatcher');

const CACHE_DIR = path.join(__dirname, '..', 'data');
const CACHE_FILE = path.join(CACHE_DIR, 'video-modules-cache.json');
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = process.env.GROQ_MODULE_MODEL || 'qwen/qwen3.8-27b';
const MAX_CHUNK_CALLS = 1;
const SHORT_VIDEO_SEC = 24 * 60 * 60;
const TARGET_LINES_PER_PROMPT = 50;

const memoryCache = new Map();
const inFlight = new Map();
let groqChain = Promise.resolve();
let diskCache = null;

function loadDiskCache() {
    if (diskCache) return diskCache;
    diskCache = {};
    try {
        if (fs.existsSync(CACHE_FILE)) {
            diskCache = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8')) || {};
        }
    } catch (e) {
        console.warn('[TranscriptModules] cache load skipped:', e.message);
        diskCache = {};
    }
    return diskCache;
}

function saveDiskCache() {
    try {
        if (!fs.existsSync(CACHE_DIR)) fs.mkdirSync(CACHE_DIR, { recursive: true });
        fs.writeFileSync(CACHE_FILE, JSON.stringify(diskCache, null, 0));
    } catch (e) {
        console.warn('[TranscriptModules] cache save skipped:', e.message);
    }
}

const LANG_META = {
    en: { name: 'English', native: 'English' },
    hi: { name: 'Hindi', native: 'हिन्दी' },
    te: { name: 'Telugu', native: 'తెలుగు' },
    ta: { name: 'Tamil', native: 'தமிழ்' },
    kn: { name: 'Kannada', native: 'ಕನ್ನಡ' },
    ml: { name: 'Malayalam', native: 'മലയാളം' }
};

function normalizeLang(lang) {
    const s = String(lang || 'en').toLowerCase().trim();
    const map = {
        english: 'en', en: 'en',
        hindi: 'hi', hi: 'hi',
        telugu: 'te', te: 'te',
        tamil: 'ta', ta: 'ta',
        kannada: 'kn', kn: 'kn', ka: 'kn',
        malayalam: 'ml', ml: 'ml', ma: 'ml'
    };
    return map[s] || (LANG_META[s.slice(0, 2)] ? s.slice(0, 2) : 'en');
}

function langMeta(lang) {
    return LANG_META[normalizeLang(lang)] || LANG_META.en;
}

function cacheKey(youtubeId, lang, topic) {
    return `${youtubeId}::${normalizeLang(lang)}::${String(topic || '').toLowerCase().trim()}`;
}

function isStaleLanguageCache(cached) {
    const lang = normalizeLang(cached?.lang);
    if (lang === 'en' || !cached?.modules?.length) return false;
    if (cached.method !== 'local-fallback') return false;
    return cached.modules.some((m) => /· Part \d/i.test(String(m?.title || '')));
}

function parseJsonObject(raw) {
    const text = String(raw || '').replace(/```json/gi, '```').replace(/```/g, '').trim();
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return null;
    try {
        return JSON.parse(match[0]);
    } catch {
        return null;
    }
}

function downsampleLines(lines, maxLines = TARGET_LINES_PER_PROMPT) {
    if (!Array.isArray(lines) || lines.length <= maxLines) return lines || [];
    const step = (lines.length - 1) / (maxLines - 1);
    const out = [];
    const seen = new Set();
    for (let i = 0; i < maxLines; i++) {
        const idx = Math.round(i * step);
        if (seen.has(idx)) continue;
        seen.add(idx);
        out.push(lines[idx]);
    }
    return out;
}

function formatTranscriptBlock(lines) {
    return (lines || []).map((l) => {
        const t = formatClock(l.startSec != null ? l.startSec : l.start);
        const text = String(l.text || '').replace(/\s+/g, ' ').trim().slice(0, 120);
        return `[${t}] ${text}`;
    }).filter((row) => row.length > 8).join('\n');
}

function groupCues(cues, windowSec = 20) {
    const lines = [];
    let cur = null;
    for (const c of cues || []) {
        const start = Number(c.start) || 0;
        if (!cur || start - cur.startSec >= windowSec || (cur.text || '').length > 240) {
            if (cur) lines.push(cur);
            cur = { startSec: Math.floor(start), endSec: Math.ceil(c.end || start + 2), text: c.text };
        } else {
            cur.endSec = Math.ceil(c.end || cur.endSec);
            cur.text = `${cur.text} ${c.text}`.replace(/\s+/g, ' ').trim();
        }
    }
    if (cur) lines.push(cur);
    return lines;
}

function snapToLines(sec, lines, durationSec) {
    const target = Math.max(0, Math.min(Number(sec) || 0, durationSec));
    if (!lines.length) return Math.floor(target);
    let best = lines[0].startSec;
    let bestDiff = Math.abs(best - target);
    for (const l of lines) {
        const d = Math.abs(l.startSec - target);
        if (d < bestDiff) {
            best = l.startSec;
            bestDiff = d;
        }
    }
    return Math.floor(best);
}

function parseClockToSec(value) {
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    const s = String(value || '').trim();
    if (!s) return NaN;
    if (/^\d+(\.\d+)?$/.test(s)) return Number(s);
    const parts = s.replace(/[\[\]]/g, '').split(':').map((p) => Number(p));
    if (!parts.length || parts.some((n) => !Number.isFinite(n))) return NaN;
    return parts.reduce((acc, n) => acc * 60 + n, 0);
}

function validateModules(rawModules, durationSec, lines) {
    const duration = Math.max(30, Number(durationSec) || 0);
    const cleaned = (Array.isArray(rawModules) ? rawModules : [])
        .map((m) => ({
            title: String(m?.title || m?.name || '').replace(/\s+/g, ' ').trim().slice(0, 80),
            summary: String(m?.summary || m?.description || '').replace(/\s+/g, ' ').trim().slice(0, 160),
            startSec: snapToLines(parseClockToSec(m?.startSec ?? m?.start_sec ?? m?.start), lines, duration),
            endSec: snapToLines(parseClockToSec(m?.endSec ?? m?.end_sec ?? m?.end), lines, duration)
        }))
        .filter((m) => m.title)
        .sort((a, b) => a.startSec - b.startSec);

    const unique = [];
    for (const m of cleaned) {
        const prev = unique[unique.length - 1];
        if (prev && Math.abs(m.startSec - prev.startSec) < 20) continue;
        unique.push(m);
    }

    const sliced = unique.slice(0, 5);
    if (!sliced.length) return [];

    sliced[0].startSec = 0;
    for (let i = 0; i < sliced.length; i++) {
        const nextStart = i < sliced.length - 1 ? sliced[i + 1].startSec : duration;
        let end = Math.max(sliced[i].startSec + 25, sliced[i].endSec || 0);
        end = Math.min(duration, Math.max(end, nextStart));
        if (i < sliced.length - 1) end = nextStart;
        else end = duration;
        sliced[i].endSec = Math.floor(end);
        if (sliced[i].endSec <= sliced[i].startSec) {
            sliced[i].endSec = Math.min(duration, sliced[i].startSec + 45);
        }
        sliced[i].startLabel = formatClock(sliced[i].startSec);
        sliced[i].endLabel = formatClock(sliced[i].endSec);
        sliced[i].order = i + 1;
    }
    return sliced.filter((m) => m.endSec > m.startSec).slice(0, 5);
}

function localModulesFromLines(lines, durationSec, topic, lang = 'en') {
    const duration = Math.max(60, Number(durationSec) || 0);
    const count = duration > 4 * 3600 ? 5 : duration > 90 * 60 ? 4 : 3;
    const slice = duration / count;
    const code = normalizeLang(lang);
    const partWord = { en: 'Part', hi: 'भाग', te: 'భాగం', ta: 'பகுதி', kn: 'ಭಾಗ', ml: 'ഭാഗം' }[code] || 'Part';
    const modules = [];
    for (let i = 0; i < count; i++) {
        const startSec = Math.floor(i * slice);
        const endSec = i === count - 1 ? Math.floor(duration) : Math.floor((i + 1) * slice);
        const sample = (lines || []).find((l) => l.startSec >= startSec && String(l.text || '').length > 20);
        const snippet = String(sample?.text || '').replace(/\s+/g, ' ').trim().slice(0, 90);
        modules.push({
            title: `${topic} · ${partWord} ${i + 1}`,
            summary: snippet || `${topic} · ${partWord} ${i + 1}`,
            startSec,
            endSec
        });
    }
    return modules;
}

function enqueueGroq(fn) {
    const run = groqChain.then(fn, fn);
    groqChain = run.then(() => undefined, () => undefined);
    return run;
}

async function groqJson(messages, maxTokens = 900, model = GROQ_MODEL) {
    const key = process.env.GROQ_API_KEY;
    if (!key) throw new Error('GROQ_API_KEY is not set');
    const payload = {
        model,
        temperature: 0.2,
        max_tokens: maxTokens,
        messages,
        response_format: { type: 'json_object' }
    };

    let lastErr;
    for (let attempt = 0; attempt < 2; attempt++) {
        try {
            const { data } = await axios.post(GROQ_URL, payload, {
                headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
                timeout: 45000
            });
            const msg = data.choices?.[0]?.message || {};
            const raw = msg.content || msg.reasoning || '';
            const parsed = parseJsonObject(raw);
            if (!parsed) {
                console.warn('[TranscriptModules] Groq JSON parse miss:', String(raw).slice(0, 400) || JSON.stringify(msg).slice(0, 400));
            }
            return parsed;
        } catch (err) {
            lastErr = err;
            const status = err.response?.status;
            if (status === 400 && payload.response_format) {
                delete payload.response_format;
                continue;
            }
            if (status === 429) {
                const headerWait = Number(err.response?.headers?.['retry-after']);
                const waitMs = Number.isFinite(headerWait) && headerWait > 0
                    ? Math.min(headerWait * 1000, 25000)
                    : Math.min(12000, 5000 * (attempt + 1));
                console.warn(`[TranscriptModules] Groq 429, retry in ${waitMs}ms`);
                await new Promise((r) => setTimeout(r, waitMs));
                continue;
            }
            throw err;
        }
    }
    throw lastErr;
}

function segmentPrompt(topic, transcriptText, extra = '', lang = 'en') {
    const meta = langMeta(lang);
    const langRule = normalizeLang(lang) === 'en'
        ? 'Write every module title and summary in English.'
        : `Write every module title and summary in ${meta.name} (${meta.native}) using that script. Keep technical terms like Spring Boot, Java, API, SQL in English if needed. Do not write titles or summaries in English sentences.`;
    return `Here is a timestamped transcript for a tutorial on '${topic}'.
Divide it into 3-5 clear, self-contained modules. Each module should be a distinct concept a beginner could learn on its own.
Use ONLY timestamps that appear in the transcript. startSec/endSec must be integers in seconds.
Modules must be in time order, non-overlapping, and cover the video from start to end.
${langRule}
${extra}

Transcript:
${transcriptText}

Return ONLY JSON in this exact format:
{
  "modules": [
    {
      "title": "module title in ${meta.name}",
      "startSec": 0,
      "endSec": 145,
      "summary": "one-line description in ${meta.name}"
    }
  ]
}`;
}

async function proposeModulesFromText(topic, transcriptText, extra = '', lang = 'en') {
    let block = transcriptText;
    let lastErr;
    for (const maxChars of [12000, 8000, 5000]) {
        if (block.length > maxChars) {
            block = block.slice(0, maxChars);
            const lastNl = block.lastIndexOf('\n');
            if (lastNl > 1000) block = block.slice(0, lastNl);
        }
        try {
            const parsed = await groqJson([
                {
                    role: 'system',
                    content: `You segment tutorial transcripts into beginner learning modules. Return strict JSON only. Output titles and summaries in ${langMeta(lang).name}.`
                },
                { role: 'user', content: segmentPrompt(topic, block, extra, lang) }
            ], 900);
            const list = parsed?.modules || parsed?.chapters || parsed?.sections || [];
            return Array.isArray(list) ? list : [];
        } catch (e) {
            lastErr = e;
            if (e.response?.status !== 413) throw e;
        }
    }
    throw lastErr;
}

function splitLinesByWindow(lines, durationSec) {
    const duration = Math.max(60, durationSec);
    let chunkSec = 10 * 60;
    let n = Math.ceil(duration / chunkSec) || 1;
    if (n > MAX_CHUNK_CALLS) {
        chunkSec = Math.ceil(duration / MAX_CHUNK_CALLS);
        n = Math.ceil(duration / chunkSec);
    }
    const chunks = [];
    for (let i = 0; i < n; i++) {
        const from = i * chunkSec;
        const to = Math.min(duration, (i + 1) * chunkSec);
        const part = lines.filter((l) => l.startSec >= from && l.startSec < to);
        if (part.length) chunks.push({ from, to, lines: downsampleLines(part, 80) });
    }
    return chunks;
}

async function mergeChunkModules(topic, proposed, durationSec) {
    const compact = proposed.map((m) => ({
        title: m.title,
        startSec: m.startSec,
        endSec: m.endSec,
        summary: m.summary
    }));
    const parsed = await groqJson([
        {
            role: 'system',
            content: 'You clean up tutorial module boundaries. Merge fragments that are the same concept. Return strict JSON only.'
        },
        {
            role: 'user',
            content: `These are candidate modules for a beginner tutorial on '${topic}'. Video duration is ${Math.floor(durationSec)} seconds.
Merge and rename across chunk boundaries so modules are not cut mid-concept.
Return 3-5 final modules covering 0 to ${Math.floor(durationSec)}.

Candidates:
${JSON.stringify(compact)}

Return ONLY JSON: {"modules":[{"title":"","startSec":0,"endSec":0,"summary":""}]}`
        }
    ], 1200);
    return Array.isArray(parsed?.modules) ? parsed.modules : proposed;
}

async function persistToVideoLibrary(youtubeId, modules, lang) {
    try {
        const VideoLibrary = require('../models/VideoLibrary');
        const code = normalizeLang(lang);
        await VideoLibrary.updateMany(
            { youtubeId },
            {
                $set: {
                    [`modulesByLang.${code}`]: modules,
                    modules,
                    modulesGeneratedAt: new Date()
                }
            }
        );
    } catch (e) {
        console.warn('[TranscriptModules] VideoLibrary save skipped:', e.message);
    }
}

async function segmentVideoIntoModules(opts = {}) {
    const youtubeId = extractVideoId(opts.youtubeId || opts.videoId || opts.url);
    if (!youtubeId) return { success: false, message: 'videoId required', modules: [] };

    const lang = normalizeLang(opts.lang);
    const topic = String(opts.topic || opts.skillName || opts.title || 'this skill').trim() || 'this skill';
    const key = cacheKey(youtubeId, lang, topic);

    if (memoryCache.has(key) && !isStaleLanguageCache(memoryCache.get(key))) {
        return memoryCache.get(key);
    }
    const disk = loadDiskCache();
    if (disk[key]?.modules?.length && !isStaleLanguageCache(disk[key])) {
        memoryCache.set(key, disk[key]);
        return disk[key];
    }
    if (inFlight.has(key)) return inFlight.get(key);

    const work = (async () => {
    const cues = await fetchTimedTranscript(youtubeId, lang);
    const durationSec = Math.max(
        Number(opts.durationSec) || 0,
        cues.length ? Number(cues[cues.length - 1].end) || 0 : 3600
    );
    const lines = groupCues(cues, durationSec > 3600 ? 30 : 18);
    let proposed = [];
    let method = 'groq-single';

    if (!cues.length) {
        proposed = localModulesFromLines([], durationSec, topic, lang);
        method = 'local-fallback';
        try {
            const stub = `[0:00] Beginner ${topic} tutorial in ${langMeta(lang).name}. Duration ${Math.floor(durationSec)} seconds.`;
            proposed = await enqueueGroq(() => proposeModulesFromText(
                topic,
                stub,
                `No timed captions were available. Create 3-5 evenly spaced modules covering 0 to ${Math.floor(durationSec)} seconds.`,
                lang
            ));
            method = 'groq-single';
        } catch (e) {
            console.warn('[TranscriptModules] Groq segmentation failed:', e.message);
        }
    } else {
    try {
        const block = formatTranscriptBlock(downsampleLines(lines, TARGET_LINES_PER_PROMPT));
        proposed = await enqueueGroq(() => proposeModulesFromText(topic, block, '', lang));
    } catch (e) {
        console.warn('[TranscriptModules] Groq segmentation failed:', e.message);
        proposed = localModulesFromLines(lines, durationSec, topic, lang);
        method = 'local-fallback';
    }
    }

    let modules = validateModules(proposed, durationSec, lines);
    if (modules.length < 2) {
        modules = validateModules(localModulesFromLines(lines, durationSec, topic, lang), durationSec, lines);
        method = method === 'groq-single' ? 'local-fallback' : method;
    }
    const result = {
        success: modules.length >= 2,
        youtubeId,
        topic,
        lang,
        durationSec: Math.floor(durationSec),
        method,
        model: method === 'groq-single' ? GROQ_MODEL : 'local',
        modules,
        warning: method === 'local-fallback' ? 'Groq was busy, so modules were split from the transcript locally.' : null
    };

    if (modules.length >= 2) {
        memoryCache.set(key, result);
        disk[key] = result;
        saveDiskCache();
        persistToVideoLibrary(youtubeId, modules, lang).catch(() => {});
    }
    return result;
    })();

    inFlight.set(key, work);
    try {
        return await work;
    } finally {
        inFlight.delete(key);
    }
}

async function translateModulesToEnglish(modules) {
    const list = Array.isArray(modules) ? modules : [];
    if (!list.length) return [];
    const compact = list.map((m) => ({
        order: m.order,
        title: m.title,
        summary: m.summary
    }));
    const parsed = await enqueueGroq(() => groqJson([
        {
            role: 'system',
            content: 'You translate beginner tutorial step titles and summaries into clear English. Return strict JSON only. Keep technical terms like Spring Boot, Java, API, SQL in English. Do not change order or invent new steps.'
        },
        {
            role: 'user',
            content: `Translate only title and summary to English.\nReturn JSON: {"modules":[{"order":1,"title":"","summary":""}]}\n\n${JSON.stringify(compact)}`
        }
    ], 700));
    const translated = Array.isArray(parsed?.modules) ? parsed.modules : [];
    return list.map((m, i) => {
        const t = translated.find((x) => Number(x.order) === Number(m.order)) || translated[i] || {};
        return {
            ...m,
            title: String(t.title || m.title || '').replace(/\s+/g, ' ').trim() || m.title,
            summary: String(t.summary || m.summary || '').replace(/\s+/g, ' ').trim() || m.summary
        };
    });
}

module.exports = {
    segmentVideoIntoModules,
    translateModulesToEnglish,
    validateModules
};
