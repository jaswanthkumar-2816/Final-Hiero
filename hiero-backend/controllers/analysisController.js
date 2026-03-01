// controllers/analysisController.js
import User from '../models/User.js';
import multer from 'multer';
import winston from 'winston';
import { analyzeResumeAndJD, extractPdfTextIfNeeded } from '../services/analysisEngine.js';

// Enhanced lightweight analysis stub to avoid importing the standalone analysis server
// Provides structure compatible with results page expectations
async function getAnalysis(resumeText, jobDescription) {
  // Delegate to centralized engine
  return analyzeResumeAndJD(resumeText, jobDescription);
}

// Configure multer for file uploads (memory storage for simple text payloads)
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    // Allow PDF or plain text for JD; resume currently PDF
    const allowed = ['application/pdf', 'text/plain'];
    if (allowed.includes(file.mimetype) || file.originalname.match(/\.(pdf|txt)$/i)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF or TXT files are allowed'), false);
    }
  }
});

// Store analysis results temporarily
const analysisResults = new Map();

// Helper to extract rudimentary text from uploaded file buffer (placeholder for real PDF parsing)
function bufferToPseudoText(file) {
  if (!file) return '';
  // Attempt proper PDF parse first
  // (Could extend to detect mimetype)
  return file.mimetype === 'application/pdf' ? '' : file.buffer.toString('utf8');
}

// Initial resume analysis
export const analyzeResume = async (req, res) => {
  try {
    // Accept either JSON body (resumeText, jobDescription) OR multipart form with files / jd_text
    let { resumeText, jobDescription, jd_text } = req.body || {};

    // Files (if multipart)
    const resumeFile = req.files?.resume?.[0];
    const jdFile = req.files?.jd?.[0];

    if (!resumeText && resumeFile) {
      resumeText = await extractPdfTextIfNeeded(resumeFile);
    }
    // Support alias jd_text
    if (!jobDescription) jobDescription = jd_text;
    if (!jobDescription && jdFile) {
      jobDescription = await extractPdfTextIfNeeded(jdFile);
    }

    const userId = req.userId;

    if (!resumeText || !jobDescription) {
      return res.status(400).json({
        success: false,
        error: 'Missing resume text or job description (provide resumeText/jobDescription, or files resume/jd, or jd_text)'
      });
    }

    winston.info(`Starting analysis for user ${userId}`);

    const analysisResult = await getAnalysis(resumeText, jobDescription);

    analysisResults.set(userId, {
      ...analysisResult,
      timestamp: new Date(),
      resumeText,
      jobDescription,
      isInitial: true
    });

    try {
      await User.findByIdAndUpdate(userId, {
        $push: {
          analysisHistory: {
            score: analysisResult.score,
            missingSkills: analysisResult.missingSkills,
            analyzedAt: new Date(),
            isReAnalysis: false
          }
        }
      });
    } catch (e) {
      winston.warn('Skipping DB update for analysisHistory:', e.message);
    }

    winston.info(`Analysis completed for user ${userId}: Score ${analysisResult.score}%`);

    res.json({ success: true, data: analysisResult });

  } catch (error) {
    winston.error(`Analysis error for user ${req.userId}: ${error.message}`);
    res.status(500).json({ success: false, error: 'Analysis failed. Please try again.' });
  }
};

// Smart re-analysis after learning
export const reAnalyzeResume = async (req, res) => {
  try {
    let { resumeText, jobDescription, jd_text } = req.body || {};
    const resumeFile = req.files?.resume?.[0];
    const jdFile = req.files?.jd?.[0];

    if (!resumeText && resumeFile) resumeText = await extractPdfTextIfNeeded(resumeFile);
    if (!jobDescription) jobDescription = jd_text;
    if (!jobDescription && jdFile) jobDescription = await extractPdfTextIfNeeded(jdFile);

    const userId = req.userId;

    if (!resumeText || !jobDescription) {
      return res.status(400).json({ success: false, error: 'Missing resume text or job description' });
    }

    winston.info(`Starting re-analysis for user ${userId}`);

    const previousAnalysis = analysisResults.get(userId);
    if (!previousAnalysis) {
      return res.status(400).json({ success: false, error: 'No previous analysis found. Please run initial analysis first.' });
    }

    const newAnalysisResult = await getAnalysis(resumeText, jobDescription);

    const scoreImprovement = newAnalysisResult.score - previousAnalysis.score;
    const previouslyMissing = new Set(previousAnalysis.missingSkills.map(s => s.toLowerCase()));
    const newlyMissing = new Set(newAnalysisResult.missingSkills.map(s => s.toLowerCase()));

    const skillsLearned = [...previouslyMissing].filter(skill => !newlyMissing.has(skill));
    const newSkillsToLearn = [...newlyMissing].filter(skill => !previouslyMissing.has(skill));

    const progressReport = {
      scoreImprovement,
      skillsLearned,
      newSkillsToLearn,
      previousScore: previousAnalysis.score,
      currentScore: newAnalysisResult.score
    };

    winston.info(`Re-analysis for user ${userId} shows a score improvement of ${scoreImprovement}. Skills learned: ${skillsLearned.join(', ')}`);

    analysisResults.set(userId, {
      ...newAnalysisResult,
      timestamp: new Date(),
      resumeText,
      jobDescription,
      isInitial: false
    });

    try {
      await User.findByIdAndUpdate(userId, {
        $push: {
          analysisHistory: {
            score: newAnalysisResult.score,
            missingSkills: newAnalysisResult.missingSkills,
            analyzedAt: new Date(),
            isReAnalysis: true
          }
        }
      });
    } catch (e) {
      winston.warn('Skipping DB update for analysisHistory (re):', e.message);
    }

    res.json({ success: true, data: newAnalysisResult, progress: progressReport });

  } catch (error) {
    winston.error(`Re-analysis error for user ${req.userId}: ${error.message}`);
    res.status(500).json({ success: false, error: 'Re-analysis failed. Please try again.' });
  }
};

// Get analysis history
export const getAnalysisHistory = async (req, res) => {
  try {
    const userId = req.userId;
    const user = await User.findById(userId).select('analysisHistory');
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });
    res.json({ success: true, history: user.analysisHistory || [] });
  } catch (error) {
    winston.error(`Get analysis history error: ${error.message}`);
    res.status(500).json({ success: false, error: 'Failed to get analysis history' });
  }
};

// Get latest analysis result
export const getAnalysisResult = async (req, res) => {
  try {
    const userId = req.params.userId || req.userId;
    const result = analysisResults.get(userId);
    if (!result) return res.status(404).json({ success: false, error: 'No analysis result found for this user.' });
    res.json({ success: true, data: result });
  } catch (error) {
    winston.error(`Get analysis result error: ${error.message}`);
    res.status(500).json({ success: false, error: 'Failed to get analysis result' });
  }
};

export { upload };
