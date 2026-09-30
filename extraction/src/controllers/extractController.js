const fs = require('fs');
const documentParser = require('../services/documentParser');
const deterministicExtractor = require('../services/deterministicExtractor');
const groqService = require('../services/groqService');
const { reconcileExtractedData } = require('../services/reconciliationService');
const { scoreResume } = require('../services/atsScorer');
const config = require('../config');

/**
 * Common pipeline that takes raw resume text and runs deterministic extraction,
 * Groq AI analysis, reconciliation, and ATS scoring.
 */
async function processResumeExtraction(rawText, originalFilename = '') {
    // 1. Run deterministic anchor extractor
    const emails = deterministicExtractor.extractEmails(rawText);
    const phoneNumbers = deterministicExtractor.extractPhoneNumbers(rawText);
    const urls = deterministicExtractor.extractUrls(rawText);
    const { allSections, extraSections } = deterministicExtractor.segmentSections(rawText);

    const deterministicAnchors = {
        emails,
        phoneNumbers,
        urls,
        extraSections,
        totalSectionsFound: allSections.length
    };

    // 2. Run Groq AI extraction with fallback chain
    const groqResult = await groqService.extractWithGroq(rawText, deterministicAnchors);

    // 3. Reconcile, normalize, and build form-ready structures
    const reconciled = reconcileExtractedData(groqResult.data, deterministicAnchors);

    // 4. Compute ATS score and feedback
    const atsAnalytics = scoreResume(reconciled, rawText);

    return {
        success: true,
        source: {
            filename: originalFilename || 'raw_text_input',
            charCount: rawText.length,
            wordCount: rawText.split(/\s+/).filter(Boolean).length
        },
        meta: {
            modelUsed: groqResult.modelUsed,
            groqUsage: groqResult.usage,
            extractedAt: new Date().toISOString()
        },
        data: reconciled,
        // Top-level aliases for direct form binding & template consumption
        formFields: reconciled.formFields,
        additionalDetails: reconciled.additionalDetails,
        customDetails: reconciled.customDetails,
        atsAnalytics
    };
}

/**
 * Controller: Handle file uploads (PDF, DOCX, Images, Text)
 */
async function extractFromFile(req, res) {
    if (!req.file) {
        return res.status(400).json({
            success: false,
            error: 'No file uploaded. Please upload a resume file (PDF, DOCX, or Image) using field name "resume".'
        });
    }

    const filePath = req.file.path;
    const originalName = req.file.originalname;

    try {
        console.log(`[ExtractController] Processing uploaded file: ${originalName} (${req.file.size} bytes)`);

        // 1. Extract raw text from document
        const parseResult = await documentParser.parseDocument(filePath, originalName);

        // 2. Run full extraction pipeline
        const result = await processResumeExtraction(parseResult.text, originalName);

        return res.status(200).json(result);
    } catch (err) {
        console.error('[ExtractController] Extraction error:', err);
        return res.status(500).json({
            success: false,
            error: err.message || 'Internal error during resume extraction.',
            details: process.env.NODE_ENV === 'development' ? err.stack : undefined
        });
    } finally {
        // Always clean up temp file
        if (filePath && fs.existsSync(filePath)) {
            try {
                fs.unlinkSync(filePath);
            } catch (unlinkErr) {
                console.warn('[ExtractController] Failed to delete temp file:', unlinkErr.message);
            }
        }
    }
}

/**
 * Controller: Handle raw text payload
 */
async function extractFromRawText(req, res) {
    const { text, filename } = req.body;

    if (!text || typeof text !== 'string' || text.trim().length < 20) {
        return res.status(400).json({
            success: false,
            error: 'Missing or insufficient resume text. Please provide "text" with at least 20 characters.'
        });
    }

    try {
        console.log(`[ExtractController] Processing raw text input (${text.length} chars)...`);
        const result = await processResumeExtraction(text, filename || 'direct_text_input');
        return res.status(200).json(result);
    } catch (err) {
        console.error('[ExtractController] Raw text extraction error:', err);
        return res.status(500).json({
            success: false,
            error: err.message || 'Internal error during text extraction.'
        });
    }
}

const { compareResumes } = require('../services/comparisonService');

/**
 * Controller: Compare two resumes (previous vs current)
 */
async function compareResumesEndpoint(req, res) {
    try {
        let prevResult = null;
        let currResult = null;

        // 1. If files were uploaded via multipart
        if (req.files) {
            const prevFile = req.files.previous ? req.files.previous[0] : null;
            const currFile = req.files.current ? req.files.current[0] : null;

            if (!prevFile || !currFile) {
                return res.status(400).json({
                    success: false,
                    error: 'Please upload both "previous" and "current" resume files for comparison.'
                });
            }

            const prevParsed = await documentParser.parseDocument(prevFile.path, prevFile.originalname);
            const currParsed = await documentParser.parseDocument(currFile.path, currFile.originalname);

            prevResult = await processResumeExtraction(prevParsed.text, prevFile.originalname);
            currResult = await processResumeExtraction(currParsed.text, currFile.originalname);

            // Clean up files
            try { fs.unlinkSync(prevFile.path); } catch (_) {}
            try { fs.unlinkSync(currFile.path); } catch (_) {}
        }
        // 2. If raw text was sent in JSON body
        else if (req.body.previousText && req.body.currentText) {
            prevResult = await processResumeExtraction(req.body.previousText, 'previous_resume.txt');
            currResult = await processResumeExtraction(req.body.currentText, 'current_resume.txt');
        }
        // 3. If pre-extracted data objects were sent
        else if (req.body.previousData && req.body.currentData) {
            prevResult = { data: req.body.previousData, atsAnalytics: req.body.previousAts || scoreResume(req.body.previousData) };
            currResult = { data: req.body.currentData, atsAnalytics: req.body.currentAts || scoreResume(req.body.currentData) };
        } else {
            return res.status(400).json({
                success: false,
                error: 'Please provide either previous and current files, or previousText and currentText, or previousData and currentData.'
            });
        }

        const diff = compareResumes(prevResult.data, currResult.data, prevResult.atsAnalytics, currResult.atsAnalytics);

        return res.status(200).json({
            success: true,
            comparison: diff,
            previous: prevResult,
            current: currResult
        });
    } catch (err) {
        console.error('[ExtractController] Comparison error:', err);
        return res.status(500).json({
            success: false,
            error: err.message || 'Error occurred during resume comparison.'
        });
    }
}

/**
 * Controller: Health check & config status
 */
function checkHealth(req, res) {
    res.status(200).json({
        status: 'online',
        service: 'Groq Resume Details Extraction Backend',
        version: '1.0.0',
        port: config.port,
        groqConfigured: groqService.isAvailable(),
        primaryModel: config.groq.primaryModel,
        fallbackModels: config.groq.fallbackModels,
        timestamp: new Date().toISOString()
    });
}

module.exports = {
    processResumeExtraction,
    extractFromFile,
    extractFromRawText,
    compareResumesEndpoint,
    checkHealth
};
