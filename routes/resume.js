const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const PDFDocument = require('pdfkit');
const jwt = require('jsonwebtoken');
const pdfParse = require('pdf-parse');
const axios = require('axios');
const Resume = require('../models/Resume');
const { generateUnifiedResume } = require('./unifiedTemplates');
const { generateWordHTML } = require('./wordTemplates');
const { generatePuppeteerPDF } = require('./pdfTemplate');
const router = express.Router();
const crypto = require('crypto');

async function generatePDFKitBuffer(data, templateId) {
    const tempDir = path.join(__dirname, '..', 'tmp');
    if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
    }
    const tempPath = path.join(tempDir, `resume_${crypto.randomUUID()}.pdf`);
    const stream = fs.createWriteStream(tempPath);
    
    // generateUnifiedResume returns a promise that resolves only after the stream's 'finish' event emits.
    // Hence, no further finish waiting is needed afterwards.
    await generateUnifiedResume(data, templateId, stream);
    
    const buffer = fs.readFileSync(tempPath);
    try {
        fs.unlinkSync(tempPath); // Clean up temp file immediately
    } catch (e) {
        console.error('Error deleting temp PDF:', e);
    }
    return buffer;
}

// Multer for uploads
const upload = multer({ dest: '/tmp' });

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ error: 'Access token required' });

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) return res.status(401).json({ error: 'Invalid token' });
        req.user = decoded;
        next();
    });
};

// --- Resume Data Routes ---

router.post('/basic', authenticateToken, async (req, res) => {
    try {
        const { full_name, contact_info, career_summary, website } = req.body;
        const userId = req.user.userId || req.user.id;
        let resume = await Resume.findOne({ userId });
        if (!resume) resume = new Resume({ userId, data: {} });
        resume.data.basic = { full_name, contact_info, career_summary, website };
        resume.markModified('data');
        await resume.save();
        res.json({ success: true, message: 'Basic info saved' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

router.post('/education', authenticateToken, async (req, res) => {
    try {
        const { education } = req.body;
        const userId = req.user.userId || req.user.id;
        let resume = await Resume.findOne({ userId });
        if (!resume) return res.status(404).json({ error: 'Resume not found' });
        resume.data.education = education;
        resume.markModified('data');
        await resume.save();
        res.json({ success: true, message: 'Education saved' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

router.post('/experience', authenticateToken, async (req, res) => {
    try {
        const { experience } = req.body;
        const userId = req.user.userId || req.user.id;
        let resume = await Resume.findOne({ userId });
        resume.data.experience = experience;
        resume.markModified('data');
        await resume.save();
        res.json({ success: true, message: 'Experience saved' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

router.post('/projects', authenticateToken, async (req, res) => {
    try {
        const { projects } = req.body;
        const userId = req.user.userId || req.user.id;
        let resume = await Resume.findOne({ userId });
        resume.data.projects = projects;
        resume.markModified('data');
        await resume.save();
        res.json({ success: true, message: 'Projects saved' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

router.post('/skills', authenticateToken, async (req, res) => {
    try {
        const { skills } = req.body;
        const userId = req.user.userId || req.user.id;
        let resume = await Resume.findOne({ userId });
        resume.data.skills = skills;
        resume.markModified('data');
        await resume.save();
        res.json({ success: true, message: 'Skills saved' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

router.post('/template', authenticateToken, async (req, res) => {
    try {
        const { template } = req.body;
        const userId = req.user.userId || req.user.id;
        let resume = await Resume.findOne({ userId });
        if (resume) {
            resume.data.template = template;
            resume.markModified('data');
            await resume.save();
        }
        res.json({ success: true, message: 'Template updated' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// --- Generation & Download ---

const WORD_TEMPLATES_LINE_COUNT = (() => { try { return require('fs').readFileSync(require('path').join(__dirname, 'wordTemplates.js'), 'utf8').split('\n').length; } catch(e) { return -1; } })();
router.get('/health', (req, res) => res.json({ status: 'ok', service: 'resume-integrated', build: 'v2-' + WORD_TEMPLATES_LINE_COUNT + 'lines', wordTemplatesLines: WORD_TEMPLATES_LINE_COUNT }));

router.post('/preview-resume', async (req, res) => {
    try {
        const data = req.body;
        // Basic validation
        if (!data || Object.keys(data).length === 0) {
            return res.status(400).send('No resume data provided');
        }
        const templateId = data.template || data.templateId || 'classic';
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'inline; filename=resume-preview.pdf');
        let pdfBuffer;
        try {
            // Preferred render path (matches HTML template output)
            pdfBuffer = await generatePuppeteerPDF(data, templateId);
            res.setHeader('X-Render-Engine', 'puppeteer');
        } catch (puppeteerErr) {
            // Cloud/runtime fallback: still return PDF instead of 500.
            console.error('Preview Puppeteer failed, falling back to PDFKit:', puppeteerErr.message || puppeteerErr);
            pdfBuffer = await generatePDFKitBuffer(data, templateId);
            res.setHeader('X-Render-Engine', 'pdfkit');
        }
        res.send(Buffer.isBuffer(pdfBuffer) ? pdfBuffer : Buffer.from(pdfBuffer));
    } catch (error) {
        console.error('Preview error:', error);
        if (!res.headersSent) res.status(500).send('Generation failed');
    }
});

router.post('/download-resume', async (req, res) => {
	try {
		const templateId = req.body.template || req.body.templateId || 'classic';
		const data = req.body;

		// Allow caller to request a specific format using either query or body
		const format = String(req.query.format || req.body.format || 'pdf').toLowerCase();

		if (format === 'docx') {
			// Delegate to the dedicated docx route logic
			req.body.template = templateId;
			return router.handle({ ...req, url: '/download-docx', method: 'POST' }, res, (err) => {
				if (err) {
					console.error('DOCX delegation error:', err);
					return res.status(500).send('Failed to generate DOCX');
				}
			});
		}

		let pdfBuffer;
		try {
			// Preferred render path (matches HTML template output)
			pdfBuffer = await generatePuppeteerPDF(data, templateId);
			res.setHeader('X-Render-Engine', 'puppeteer');
		} catch (puppeteerErr) {
			// Cloud/runtime fallback: still return PDF instead of 500.
			console.error('Download Puppeteer failed, falling back to PDFKit:', puppeteerErr.message || puppeteerErr);
			pdfBuffer = await generatePDFKitBuffer(data, templateId);
			res.setHeader('X-Render-Engine', 'pdfkit');
		}
		res.setHeader('Content-Type', 'application/pdf');
		res.setHeader('Content-Disposition', `attachment; filename="resume_${templateId}.pdf"`);
		return res.send(Buffer.isBuffer(pdfBuffer) ? pdfBuffer : Buffer.from(pdfBuffer));
	} catch (e) {
		console.error('download-resume error:', e);
		return res.status(500).json({ error: 'Failed to generate resume' });
	}
});

// Generate the same HTML that the PDF renderer uses (single source of truth)
async function generateResumeHTML(data, templateId) {
    try {
        const pdfTmpl = require('./pdfTemplate');
        if (typeof pdfTmpl.generateResumeHtmlForOutput === 'function') {
            return pdfTmpl.generateResumeHtmlForOutput(data, templateId);
        }
    } catch (e) {
        // ignore and fallback
    }
    return generateWordHTML(data, templateId);
}

async function htmlToDocxBuffer(html) {
    // Use html-to-docx if installed.
    // Returns a Buffer containing a valid .docx file.
    const mod = await import('html-to-docx');
    const htmlToDocx = mod.default || mod;

    // Basic document options tuned for resume rendering
    const docxBuffer = await htmlToDocx(html, null, {
        table: { row: { cantSplit: true } },
        footer: false,
        pageNumber: false,
        font: 'Calibri'
    });

    // html-to-docx may return a Buffer or Uint8Array
    return Buffer.isBuffer(docxBuffer) ? docxBuffer : Buffer.from(docxBuffer);
}

function htmlToWordDocBuffer(html) {
    // Fallback for templates that html-to-docx cannot parse (complex table layouts).
    // This produces a Word-compatible .doc (HTML-based) so users still get a file.
    const wrapped = `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body>${html}</body></html>`;
    return Buffer.from(wrapped, 'utf8');
}

router.post('/preview-docx-html', async (req, res) => {
    try {
        const data = req.body || {};
        const templateId = data.template || data.templateId || 'classic';
        const html = await generateResumeHTML(data, templateId);
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.send(html);
    } catch (e) {
        console.error('preview-docx-html error:', e);
        res.status(500).send(`<pre>preview-docx-html failed: ${String(e.message || e)}</pre>`);
    }
});

router.post('/download-docx', async (req, res) => {
    try {
        const data = req.body || {};
        const templateId = data.template || data.templateId || 'classic';
        const mode = String(req.query.mode || req.body.mode || 'exact').toLowerCase();

        const html = await generateResumeHTML(data, templateId);
        let fileBuffer;
        let contentType;
        let filename;

        // "exact" mode sends the SAME HTML used by PDF into a Word-openable .doc.
        // This preserves visual fidelity better than html-to-docx for complex templates.
        if (mode === 'exact') {
            fileBuffer = htmlToWordDocBuffer(html);
            contentType = 'application/msword';
            filename = `resume_${templateId}.doc`;
        } else {
            contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
            filename = `resume_${templateId}.docx`;
            try {
                fileBuffer = await htmlToDocxBuffer(html);
            } catch (err) {
                console.error('html-to-docx failed:', err);
                fileBuffer = htmlToWordDocBuffer(html);
                contentType = 'application/msword';
                filename = `resume_${templateId}.doc`;
            }
        }

        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(fileBuffer);
    } catch (e) {
        console.error('download-docx error:', e);
        res.status(500).json({ error: e.message || 'DOCX generation failed' });
    }
});

router.get('/preview-pdf', async (req, res) => {
    try {
        const userId = req.query.userId;
        const resume = await Resume.findOne({ userId });
        if (!resume) return res.status(404).send('Resume not found');
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'inline; filename=resume-preview.pdf');
        const pdfBuffer = await generatePDFKitBuffer(resume.data, resume.data.template || 'classic');
        res.send(pdfBuffer);
    } catch (error) {
        console.error('Preview PDF error:', error);
        res.status(500).send('Generation failed');
    }
});

router.get('/data', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId || req.user.id;
        const resume = await Resume.findOne({ userId });
        if (!resume) return res.status(404).json({ error: 'Resume not found' });
        res.json({ success: true, data: resume.data });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

router.get('/download', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId || req.user.id;
        const resume = await Resume.findOne({ userId });
        if (!resume) return res.status(404).json({ error: 'Resume not found' });
        const name = (resume.data.basic?.full_name || 'Resume').replace(/\s+/g, '_');
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${name}_Hiero.pdf"`);
        const pdfBuffer = await generatePDFKitBuffer(resume.data, resume.data.template || 'classic');
        res.send(pdfBuffer);
    } catch (error) {
        console.error('Download PDF error:', error);
        if (!res.headersSent) res.status(500).json({ error: 'Failed to generate PDF' });
    }
});

router.get('/templates', (req, res) => {
    const templates = [
        { id: 'classic', name: 'Classic Professional', preview: '/templates/previews/classic.png' },
        { id: 'modern-pro', name: 'Modern Tech', preview: '/templates/previews/modern-pro.png' },
        { id: 'tech-focus', name: 'Developer Focus', preview: '/templates/previews/tech-focus.png' },
        { id: 'minimal', name: 'Elegant Minimal', preview: '/templates/previews/minimal.png' }
    ];
    res.json({ success: true, templates });
});

// ─── DEBUG ENDPOINT ──────────────────────────────────────────────────────────
// Hit this on Render to diagnose why Puppeteer/templates are failing:
// GET /api/resume/debug-render
router.get('/debug-render', async (req, res) => {
    const fs = require('fs');
    const { execSync } = require('child_process');
    const result = {
        timestamp: new Date().toISOString(),
        node: process.version,
        platform: process.platform,
        env: {
            PUPPETEER_EXECUTABLE_PATH: process.env.PUPPETEER_EXECUTABLE_PATH || '(not set)',
            NODE_ENV: process.env.NODE_ENV || '(not set)',
        },
        chromiumPath: null,
        chromiumExists: false,
        puppeteerLaunch: 'not tested',
        puppeteerPDF: 'not tested',
        puppeteerError: null,
        wordTemplatesLines: null,
        sampleHTMLLength: null,
    };

    // Check chromium path
    const paths = [
        process.env.PUPPETEER_EXECUTABLE_PATH,
        '/usr/bin/chromium-browser',
        '/usr/bin/chromium',
        '/usr/bin/google-chrome',
        '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    ].filter(Boolean);
    for (const p of paths) {
        if (fs.existsSync(p)) { result.chromiumPath = p; result.chromiumExists = true; break; }
    }
    // Also check .chromium_path file
    const chromiumPathFile = require('path').join(__dirname, '..', '.chromium_path');
    if (fs.existsSync(chromiumPathFile)) {
        result.chromiumPathFile = fs.readFileSync(chromiumPathFile, 'utf8').trim();
        result.chromiumPathFileExists = fs.existsSync(result.chromiumPathFile);
    }
    // Check wordTemplates
    try {
        const wt = require('./wordTemplates');
        const sampleData = { name:'Test User', email:'test@test.com', phone:'1234567890', experience:[], education:[], skills:[], projects:[] };
        const html = wt.generateWordHTML(sampleData, 'hiero-cool');
        result.wordTemplatesLines = html.split('\n').length;
        result.sampleHTMLLength = html.length;
        result.sampleHTMLSnippet = html.substring(0, 200);
    } catch(e) { result.wordTemplatesError = e.message; }

    // Test Puppeteer launch
    try {
        const puppeteer = require('puppeteer');
        const launchOpts = {
            headless: 'new',
            args: ['--no-sandbox','--disable-setuid-sandbox','--disable-dev-shm-usage','--disable-gpu','--single-process'],
        };
        if (result.chromiumPath) launchOpts.executablePath = result.chromiumPath;
        else if (result.chromiumPathFile && result.chromiumPathFileExists) launchOpts.executablePath = result.chromiumPathFile;

        const browser = await puppeteer.launch(launchOpts);
        result.puppeteerLaunch = 'SUCCESS';
        const page = await browser.newPage();
        await page.setContent('<html><body style="background:red;color:white;font-size:24px">TEST</body></html>', { waitUntil: 'domcontentloaded', timeout: 15000 });
        const pdf = await page.pdf({ format: 'A4', timeout: 15000 });
        result.puppeteerPDF = `SUCCESS (${pdf.length} bytes)`;
        await page.close();
        await browser.close();
    } catch(e) {
        result.puppeteerLaunch = result.puppeteerLaunch === 'not tested' ? 'FAILED' : result.puppeteerLaunch;
        result.puppeteerPDF = 'FAILED';
        result.puppeteerError = e.message;
    }

    res.json(result);
});
// ─────────────────────────────────────────────────────────────────────────────

module.exports = router;
