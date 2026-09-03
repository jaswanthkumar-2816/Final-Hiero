/**
 * HIERO — Analysis Routes
 * Resume vs JD analysis, skill gap detection, video recommendations.
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const { YOUTUBE_API_KEY } = require('../../config/constants');
const { fetchVideos } = require('../../utils/youtube');
const { normalizeSkill } = require('../../utils/helpers');

const upload = multer({ dest: 'uploads/' });

// ─── GET /api/analysis/get-videos ──────────────────────
router.post('/get-videos', async (req, res) => {
    const { skill, score, lang } = req.body;
    if (!skill) return res.status(400).json({ success: false, error: 'Missing skill parameter' });

    try {
        const videos = await fetchVideos(skill, score || 20, lang || 'english');
        res.json({ success: true, skill, videos });
    } catch (error) {
        console.error(`[Analysis] Video fetch error for ${skill}:`, error.message);
        res.status(500).json({ success: false, error: 'Failed to fetch videos' });
    }
});

// ─── POST /api/analysis/analyze ────────────────────────
// NOTE: Full analysis logic (PDF parsing, AI scoring) should be extracted
// from the legacy routes/analysis.js into analysis.service.js
// This is a placeholder route that the full implementation will replace.
router.post(['/analyze', '/analyze-full'], upload.fields([{ name: 'resume' }, { name: 'jdFile' }]), async (req, res) => {
    try {
        // TODO: Extract full analysis logic from routes/analysis.js
        // This includes: PDF parsing, Groq AI scoring, skill extraction, video curation
        res.status(501).json({ success: false, message: 'Full analysis implementation pending migration' });
    } catch (error) {
        console.error('[Analysis] Error:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
