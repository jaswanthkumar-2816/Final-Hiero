/**
 * HIERO — Mastery Routes
 * Unified API surface for the consolidated mastery engine.
 */

const express = require('express');
const router = express.Router();
const masteryController = require('./mastery.controller');

// ─── DIAGNOSTIC ────────────────────────────────────────
router.post('/set-beginner-level', masteryController.setBeginnerLevel);
router.post('/diagnostic-10q', masteryController.generateDiagnostic10q);
router.post('/grade-diagnostic-10q', masteryController.gradeDiagnostic10q);

// ─── PRACTICE & ASSESSMENT ─────────────────────────────
router.post('/submit-practice', masteryController.submitPractice);
router.post('/submit-assessment', masteryController.submitAssessment);

// ─── PROGRESS & PATH ───────────────────────────────────
router.get('/path/:userId/:skillName', masteryController.getPath);
router.get('/overview/:userId', masteryController.getOverview);

module.exports = router;
