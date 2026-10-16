/**
 * Beginner practice mode — "prepare from the beginning".
 *
 * The graded interview in routes/interview.js tests whether someone can
 * answer. This tests nothing. It is a rehearsal room: pick one section of your
 * own resume, see the questions before you answer them, say it out loud, then
 * hear the same thing answered properly and slowly, and go again.
 *
 * The questions and the model answers are grounded in the candidate's own
 * resume text. Generic "tell me about yourself" drilling is free on YouTube;
 * practising YOUR bullet points is the part nobody else does.
 */
const express = require('express');
const axios = require('axios');
const router = express.Router();

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
// A chain, not a constant. Groq retires models without notice -- that is how
// llama-3.3-70b-versatile started 404ing and took five routes in this repo
// down with it. Verify against GET /openai/v1/models before adding an id.
const MODELS = [
    process.env.GROQ_MODEL,
    'openai/gpt-oss-120b',
    'openai/gpt-oss-20b',
    'qwen/qwen3.8-27b',
].filter(Boolean);

async function llm(messages, { temperature = 0.4, maxTokens = 1200 } = {}) {
    if (!process.env.GROQ_API_KEY) {
        const e = new Error('GROQ_API_KEY is not set on this server.');
        e.reason = 'GROQ_KEY_MISSING';
        throw e;
    }
    let lastErr;
    for (const model of MODELS) {
        try {
            const { data } = await axios.post(GROQ_URL, {
                model, messages, temperature, max_tokens: maxTokens,
                response_format: { type: 'json_object' }
            }, {
                headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}`, 'Content-Type': 'application/json' },
                timeout: 45000
            });
            const raw = data?.choices?.[0]?.message?.content || '{}';
            try { return JSON.parse(raw); }
            catch { return JSON.parse(raw.replace(/^```(?:json)?/i, '').replace(/```$/, '').trim()); }
        } catch (e) {
            lastErr = e;
            const code = e.response && e.response.status;
            // 404 = this id is gone; 400 = it rejected the request shape. Both
            // are worth trying the next model for. Anything else (401, 429, a
            // timeout) will fail the same way on every model, so stop.
            if (code !== 404 && code !== 400) break;
            console.warn(`[PRACTICE] model ${model} unavailable (${code}); trying next`);
        }
    }
    throw lastErr || new Error('No Groq model accepted the request.');
}

// ── section splitting ────────────────────────────────────────────────────────
// Deterministic first: resume headings are a small, well-known set, and a regex
// pass is instant, free and cannot hallucinate a section the candidate does not
// have. The LLM is only a fallback for resumes with no recognisable headings.
const HEADINGS = [
    ['summary',        /^(professional\s+)?(summary|profile|objective|about(\s+me)?)\b/i],
    ['experience',     /^(work\s+|professional\s+|employment\s+)?(experience|history)\b/i],
    ['projects',       /^(key\s+|academic\s+|personal\s+)?projects?\b/i],
    ['skills',         /^(technical\s+|core\s+|key\s+)?skills?\b|^competenc/i],
    ['education',      /^education|^academics?\b|^qualifications?\b/i],
    ['internships',    /^internships?\b|^training\b/i],
    ['certifications', /^certificat|^licen[cs]e/i],
    ['achievements',   /^achievements?\b|^awards?\b|^honou?rs\b|^accomplish/i],
    ['publications',   /^publications?\b|^research\b|^papers?\b/i],
    ['activities',     /^activities\b|^volunteer|^extra[- ]?curricular|^leadership\b/i],
    ['references',     /^references?\b/i],
];

// What each section is actually testing when you are asked about it out loud.
const INTENT = {
    summary:        'introduce yourself in 30 seconds without rambling',
    experience:     'describe what you actually did and what changed because of it',
    projects:       'explain a thing you built, the decisions you made and why',
    skills:         'back up a claimed skill with evidence instead of repeating the word',
    education:      'connect what you studied to the job you want',
    internships:    'show what you took away from short, junior work',
    certifications: 'say why you took it and what you can now do',
    achievements:   'state an accomplishment without sounding boastful or vague',
    publications:   'explain technical work to a non-specialist',
    activities:     'show initiative and teamwork outside coursework',
    references:     'speak about how other people would describe your work',
};
const LABEL = {
    summary: 'Summary', experience: 'Work experience', projects: 'Projects',
    skills: 'Skills', education: 'Education', internships: 'Internships',
    certifications: 'Certifications', achievements: 'Achievements',
    publications: 'Publications', activities: 'Activities', references: 'References',
};
// References/publications are rarely what a beginner needs to rehearse.
const PRIORITY = ['summary','experience','projects','skills','internships','education',
                  'achievements','certifications','activities','publications','references'];

function splitSections(text) {
    const lines = String(text || '').split(/\r?\n/);
    const found = [];
    lines.forEach((line, i) => {
        const t = line.trim();
        // A heading is short, and is not a sentence.
        if (!t || t.length > 46 || /[.;,]$/.test(t)) return;
        for (const [kind, re] of HEADINGS) {
            if (re.test(t.replace(/^[^A-Za-z]+/, ''))) { found.push({ kind, at: i, raw: t }); break; }
        }
    });
    const out = [];
    found.forEach((h, idx) => {
        const end = idx + 1 < found.length ? found[idx + 1].at : lines.length;
        const body = lines.slice(h.at + 1, end).map(l => l.trim()).filter(Boolean);
        if (!body.length) return;
        if (out.some(s => s.kind === h.kind)) return;         // keep the first of a kind
        out.push({
            id: h.kind,
            kind: h.kind,
            title: LABEL[h.kind] || h.raw,
            heading: h.raw,
            intent: INTENT[h.kind] || 'talk about this part of your background',
            lines: body.slice(0, 40),
            content: body.slice(0, 40).join('\n'),
        });
    });
    return out.sort((a, b) => PRIORITY.indexOf(a.kind) - PRIORITY.indexOf(b.kind));
}

// POST /api/practice/sections   { text } -> { sections }
router.post('/sections', async (req, res) => {
    try {
        const text = (req.body && req.body.text) || '';
        if (!text.trim()) return res.status(400).json({ success: false, error: 'No resume text supplied.' });

        let sections = splitSections(text);

        if (sections.length < 2) {
            // No recognisable headings — ask the model to segment it instead.
            try {
                const j = await llm([
                    { role: 'system', content: 'You split resumes into sections. Return JSON only.' },
                    { role: 'user', content:
`Split this resume into its sections. Use ONLY these kinds: ${Object.keys(LABEL).join(', ')}.
Copy the candidate's own wording into "content" — never invent content.

Return: {"sections":[{"kind":"experience","title":"Work experience","content":"..."}]}

RESUME:
${text.slice(0, 6000)}` }
                ], { temperature: 0.1 });
                const ai = Array.isArray(j.sections) ? j.sections : [];
                if (ai.length) {
                    sections = ai.filter(s => s && s.kind && s.content).map(s => ({
                        id: s.kind,
                        kind: s.kind,
                        title: s.title || LABEL[s.kind] || s.kind,
                        heading: s.title || LABEL[s.kind] || s.kind,
                        intent: INTENT[s.kind] || 'talk about this part of your background',
                        lines: String(s.content).split('\n').filter(Boolean).slice(0, 40),
                        content: String(s.content).slice(0, 2500),
                    })).sort((a, b) => PRIORITY.indexOf(a.kind) - PRIORITY.indexOf(b.kind));
                }
            } catch (e) {
                console.warn('[PRACTICE] LLM segmentation failed:', e.message);
            }
        }

        if (!sections.length) {
            return res.json({ success: false, error: 'Could not find any sections in that resume.', sections: [] });
        }
        res.json({ success: true, sections });
    } catch (err) {
        console.error('[PRACTICE] /sections error:', err.message);
        res.status(500).json({ success: false, error: 'Could not read that resume.' });
    }
});

// POST /api/practice/questions   { section, role } -> { questions }
router.post('/questions', async (req, res) => {
    try {
        const { section, role } = req.body || {};
        if (!section || !section.content) {
            return res.status(400).json({ success: false, error: 'No section supplied.' });
        }
        const j = await llm([
            { role: 'system', content:
'You write interview questions for NERVOUS BEGINNERS practising out loud. Return JSON only.' },
            { role: 'user', content:
`Write 4 spoken interview questions about ONLY this resume section.

Rules:
- Quote the candidate's OWN details (their project, their tool, their number). A question that
  would fit any candidate is a failed question.
- Plain, warm, spoken English. No jargon, no multi-part questions.
- Order them easiest first, so the first one builds confidence.
- "why" gives each question one line on what the interviewer is really checking.

${role ? `Target role: ${role}` : ''}
SECTION — ${section.title}:
${String(section.content).slice(0, 2200)}

Return: {"questions":[{"q":"...","why":"...","seconds":60}]}` }
        ], { temperature: 0.5 });

        const questions = (Array.isArray(j.questions) ? j.questions : [])
            .filter(q => q && q.q).slice(0, 5)
            .map((q, i) => ({
                n: i + 1,
                q: String(q.q).trim(),
                why: String(q.why || '').trim(),
                seconds: Math.min(120, Math.max(30, parseInt(q.seconds) || 60)),
            }));

        if (!questions.length) return res.status(502).json({ success: false, error: 'Could not write questions for that section.' });
        res.json({ success: true, questions });
    } catch (err) {
        console.error('[PRACTICE] /questions error:', err.message);
        res.status(err.reason === 'GROQ_KEY_MISSING' ? 503 : 500)
           .json({ success: false, error: err.reason === 'GROQ_KEY_MISSING'
                ? 'Question generation is not configured on this server.' : 'Could not write questions.' });
    }
});

// POST /api/practice/model-answer  { question, section, attempt } -> { answer, structure, tips }
router.post('/model-answer', async (req, res) => {
    try {
        const { question, section, attempt } = req.body || {};
        if (!question) return res.status(400).json({ success: false, error: 'No question supplied.' });

        const j = await llm([
            { role: 'system', content:
'You teach nervous beginners how to SAY their own experience out loud. Return JSON only.' },
            { role: 'user', content:
`Write a model spoken answer to this question, using ONLY the candidate's real details below.

Rules:
- First person, as the candidate. 55-90 words. It must be sayable in one breath-group,
  not read like an essay.
- Spoken English: short sentences, contractions, no bullet points, no corporate filler
  ("leverage", "synergy", "passionate about").
- Use their real numbers and tool names. If a number is missing, say so in "tips" rather
  than inventing one.
- "structure" names the 3-4 beats of the answer so they can rebuild it in their own words
  instead of memorising this one.
- "tips" must never suggest saying a filler word. Do not tell them to open with "um",
  "so", "like", "basically" or "you know" -- removing those is the point of practising.
  Tips are about what to include, what to cut, and where to slow down.
${attempt ? `\nThe candidate just said this — reference what they already did well in "tips":\n"""${String(attempt).slice(0, 900)}"""` : ''}

QUESTION: ${question}

THEIR ${section?.title || 'resume'}:
${String(section?.content || '').slice(0, 1800)}

Return: {"answer":"...","structure":["...","..."],"tips":["...","..."]}` }
        ], { temperature: 0.55, maxTokens: 900 });

        const answer = String(j.answer || '').trim();
        if (!answer) return res.status(502).json({ success: false, error: 'Could not write a model answer.' });
        res.json({
            success: true,
            answer,
            structure: (Array.isArray(j.structure) ? j.structure : []).map(String).slice(0, 5),
            tips: (Array.isArray(j.tips) ? j.tips : []).map(String).slice(0, 4),
            words: answer.split(/\s+/).length,
        });
    } catch (err) {
        console.error('[PRACTICE] /model-answer error:', err.message);
        res.status(err.reason === 'GROQ_KEY_MISSING' ? 503 : 500)
           .json({ success: false, error: 'Could not write a model answer.' });
    }
});

router.get('/health', (_req, res) => res.json({
    ok: true, llm: !!process.env.GROQ_API_KEY, tts: !!process.env.DEEPGRAM_API_KEY
}));

module.exports = router;
