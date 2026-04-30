const express = require('express');
const router = express.Router();
const { Groq } = require('groq-sdk');
const axios = require('axios');
const dotenv = require('dotenv');

dotenv.config();

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const MODEL = process.env.AI_MODEL || 'llama-3.3-70b-versatile';
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

// ── Helper ──────────────────────────────────────────────────────────────────
async function askGroq(messages, jsonMode = false) {
    const opts = {
        model: MODEL,
        messages,
        temperature: 0.7,
        max_tokens: 1500,
    };
    if (jsonMode) opts.response_format = { type: 'json_object' };
    const completion = await groq.chat.completions.create(opts);
    return completion.choices[0]?.message?.content || '';
}

// ── POST /api/projects/youtube ───────────────────────────────────────────────
router.post('/youtube', async (req, res) => {
    const { projectTitle, tags = [] } = req.body;
    if (!projectTitle) return res.status(400).json({ error: 'projectTitle required' });

    // Fallback if no API key
    if (!YOUTUBE_API_KEY) {
        console.warn('[projects/youtube] YOUTUBE_API_KEY missing, using AI suggestions');
        try {
            const messages = [
                { role: 'system', content: 'Return valid JSON only.' },
                { role: 'user', content: `Suggest 5 YouTube tutorial videos for: "${projectTitle}". JSON: { "videos": [{ "title", "channel", "duration", "description", "videoId" }] }` }
            ];
            const raw = await askGroq(messages, true);
            return res.json(JSON.parse(raw));
        } catch (e) {
            return res.status(500).json({ error: 'YouTube Search Unavailable' });
        }
    }

    try {
        const query = `${projectTitle} ${tags.join(' ')} tutorial`.trim();
        console.log(`[YT Search] Query: ${query}`);

        const response = await axios.get('https://www.googleapis.com/youtube/v3/search', {
            params: {
                part: 'snippet',
                q: query,
                type: 'video',
                maxResults: 6,
                key: YOUTUBE_API_KEY,
                relevanceLanguage: 'en',
                videoEmbeddable: 'true'
            }
        });

        const items = response.data.items || [];
        const videos = items.map(item => ({
            title: item.snippet.title,
            channel: item.snippet.channelTitle,
            duration: 'Tutorial', // Search API doesn't return duration, requires separate call or estimated
            description: item.snippet.description,
            videoId: item.id.videoId,
            thumbnail: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.medium?.url
        }));

        res.json({ videos });
    } catch (err) {
        console.error('[projects/youtube] Error:', err.response?.data || err.message);
        res.status(500).json({ error: 'Failed to search YouTube' });
    }
});

// ── POST /api/projects/github ────────────────────────────────────────────────
router.post('/github', async (req, res) => {
    const { projectTitle, tags = [] } = req.body;
    if (!projectTitle) return res.status(400).json({ error: 'projectTitle required' });

    try {
        const messages = [
            {
                role: 'system',
                content: 'You are an open-source developer expert. Return valid JSON only — no markdown, no explanation.'
            },
            {
                role: 'user',
                content: `Recommend 5 real, relevant open-source GitHub repositories for building: "${projectTitle}" (tags: ${tags.join(', ')}).
Return ONLY this JSON shape:
{
  "repos": [
    {
      "name": "owner/repo",
      "description": "what this repo does and why it's relevant",
      "stars": "like 12.4k or 3.1k",
      "language": "primary language",
      "topics": ["tag1", "tag2"],
      "searchQuery": "search query to find this on GitHub"
    }
  ]
}`
            }
        ];

        const raw = await askGroq(messages, true);
        const parsed = JSON.parse(raw);
        res.json(parsed);
    } catch (err) {
        console.error('[projects/github]', err.message);
        res.status(500).json({ error: 'Failed to fetch GitHub repositories', details: err.message });
    }
});

// ── POST /api/projects/docs ──────────────────────────────────────────────────
router.post('/docs', async (req, res) => {
    const { projectTitle, tags = [] } = req.body;
    if (!projectTitle) return res.status(400).json({ error: 'projectTitle required' });

    try {
        const messages = [
            {
                role: 'system',
                content: 'You are a senior software engineer writing project documentation. Return valid JSON only — no markdown wrapper.'
            },
            {
                role: 'user',
                content: `Create a complete project documentation guide for: "${projectTitle}" (tags: ${tags.join(', ')}).
Return ONLY this JSON shape:
{
  "overview": "Detailed project description",
  "prerequisites": ["required software", "api keys"],
  "tools": ["Essential tool 1", "Essential tool 2", "Essential tool 3"],
  "components": ["Module 1", "Module 2", "Module 3"],
  "roadmap": [
    { "phase": "Phase 1: Setup", "goal": "Architecture and initial config" },
    { "phase": "Phase 2: Core", "goal": "Primary logic implementation" },
    { "phase": "Phase 3: Final", "goal": "Testing and deployment" }
  ],
  "steps": [
    { "step": 1, "title": "Setup", "description": "detailed description" },
    { "step": 2, "title": "Core Logic", "description": "detailed description" },
    { "step": 3, "title": "Advanced Features", "description": "detailed description" },
    { "step": 4, "title": "Testing", "description": "detailed description" },
    { "step": 5, "title": "Deployment", "description": "detailed description" }
  ],
  "resources": [
    {
      "name": "resource",
      "type": "Official Docs",
      "url": "http://...",
      "description": "info"
    }
  ]
}

IMPORTANT: You MUST provide non-empty values for 'tools', 'components', and 'roadmap' based on the project specificity.`
            }
        ];

        const raw = await askGroq(messages, true);
        const parsed = JSON.parse(raw);
        res.json(parsed);
    } catch (err) {
        console.error('[projects/docs]', err.message);
        res.status(500).json({ error: 'Failed to generate documentation', details: err.message });
    }
});

// ── POST /api/projects/search ────────────────────────────────────────────────
router.post('/search', async (req, res) => {
    const { query, projectTitle, tags = [] } = req.body;
    if (!query || !projectTitle) return res.status(400).json({ error: 'query and projectTitle required' });

    try {
        const messages = [
            {
                role: 'system',
                content: `You are an expert developer helping someone build "${projectTitle}" (tags: ${tags.join(', ')}). Answer questions concisely and technically. No JSON — plain helpful text with code examples if relevant.`
            },
            {
                role: 'user',
                content: query
            }
        ];

        const answer = await askGroq(messages, false);
        res.json({ answer });
    } catch (err) {
        console.error('[projects/search]', err.message);
        res.status(500).json({ error: 'Failed to answer query', details: err.message });
    }
});

// ── POST /api/projects/chat ──────────────────────────────────────────────────
router.post('/chat', async (req, res) => {
    const { messages, projectTitle, tags = [] } = req.body;
    if (!messages || !Array.isArray(messages)) return res.status(400).json({ error: 'messages array required' });

    try {
        const systemMessage = {
            role: 'system',
            content: `You are Orbit, Hiero's AI assistant. The user is building a project called "${projectTitle}" (tags: ${tags.join(', ')}). Help them with implementation, debugging, architecture choices, and best practices. Be friendly, concise, and technical. Use markdown for code blocks.`
        };

        const fullMessages = [systemMessage, ...messages];
        const reply = await askGroq(fullMessages, false);
        res.json({ reply });
    } catch (err) {
        console.error('[projects/chat]', err.message);
        res.status(500).json({ error: 'Failed to get chat response', details: err.message });
    }
});

module.exports = router;
