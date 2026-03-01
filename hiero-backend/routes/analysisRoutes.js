import express from 'express';
import auth from '../middleware/auth.js';
import { analyzeResume, reAnalyzeResume, getAnalysisHistory, getAnalysisResult, upload } from '../controllers/analysisController.js';

const router = express.Router();

// Route for initial resume analysis (supports files: resume, jd OR text fields resumeText / jobDescription / jd_text)
router.post('/analyze', auth, upload.fields([
  { name: 'resume', maxCount: 1 },
  { name: 'jd', maxCount: 1 }
]), analyzeResume);

// Route for re-analyzing resume after learning
router.post('/reanalyze', auth, upload.fields([
  { name: 'resume', maxCount: 1 },
  { name: 'jd', maxCount: 1 }
]), reAnalyzeResume);

// Route to get user's analysis history
router.get('/history', auth, getAnalysisHistory);

// Route to get the latest analysis result
router.get('/result', auth, getAnalysisResult);

// Route to get the latest analysis result for a specific user
router.get('/result/:userId', auth, getAnalysisResult);

// Placeholder analysis route; extend or replace with real logic as needed
router.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

export default router;
