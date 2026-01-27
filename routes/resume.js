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

const router = express.Router();

// Multer for uploads
const upload = multer({ dest: '/tmp' });

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ error: 'Access token required' });

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) return res.status(403).json({ error: 'Invalid or expired token' });
        req.user = decoded;
        next();
    });
};

// --- Resume Extraction (AI Integrated) ---

async function extractTextFromPdf(filePath) {
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdfParse(dataBuffer);
    return data.text || '';
}

async function mapResumeToFormFields(rawText) {
    if (process.env.OPENROUTER_API_KEY) {
        try {
            const prompt = `Extract all career data from this resume text into a standard JSON format for a resume builder. Look for name, contact, summary, education (array of objects), experience (array of objects), projects (array), skills (object with technical and soft). Return JSON ONLY.\n\n TEXT: ${rawText.slice(0, 10000)}`;
            const { data } = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
                model: 'openai/gpt-3.5-turbo',
                messages: [{ role: 'user', content: prompt }],
                response_format: { type: "json_object" }
            }, {
                headers: { 'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}` }
            });
            return JSON.parse(data.choices[0].message.content);
        } catch (e) {
            console.error('AI Extraction failed, returning basic structure');
        }
    }
    return { personalInfo: { fullName: 'Extracted User' }, data: { basic: { full_name: 'Extracted' } } };
}

router.post('/import', upload.single('resume'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ success: false, error: 'No file uploaded' });
        const text = await extractTextFromPdf(req.file.path);
        const extractedData = await mapResumeToFormFields(text);
        if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
        res.json({ success: true, data: extractedData });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to parse resume' });
    }
});

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

router.get('/health', (req, res) => res.json({ status: 'ok', service: 'resume-integrated' }));

router.post('/preview-resume', authenticateToken, async (req, res) => {
    try {
        const data = req.body;
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'inline; filename=resume-preview.pdf');
        await generateUnifiedResume(data, data.template || 'classic', res);
    } catch (error) {
        console.error('Preview error:', error);
        res.status(500).send('Generation failed');
    }
});

router.post('/download-resume', authenticateToken, async (req, res) => {
    try {
        const data = req.body;
        const name = (data.personalInfo?.fullName || 'Resume').replace(/\s+/g, '_');
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${name}_Hiero.pdf"`);
        await generateUnifiedResume(data, data.template || 'classic', res);
    } catch (error) {
        console.error('Download PDF error:', error);
        if (!res.headersSent) res.status(500).json({ error: 'Failed to generate PDF' });
    }
});

router.post('/download-docx', authenticateToken, async (req, res) => {
    try {
        const data = req.body;
        const name = (data.personalInfo?.fullName || 'Resume').replace(/\s+/g, '_');

        // Generate Word session content (Word-compatible HTML)
        const html = generateWordHTML(data);

        res.setHeader('Content-Type', 'application/msword');
        res.setHeader('Content-Disposition', `attachment; filename="${name}_Hiero.doc"`);
        res.send(html);
    } catch (error) {
        console.error('Download Word error:', error);
        if (!res.headersSent) res.status(500).json({ error: 'Failed to generate Word document' });
    }
});

// Helper for Word generation
function generateWordHTML(data) {
    const { personalInfo = {}, experience = [], education = [], projects = [], technicalSkills = '', softSkills = '', summary = '' } = data;

    return `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head><meta charset='utf-8'><title>Resume</title><style>
        body { font-family: 'Arial', sans-serif; line-height: 1.4; color: #333; }
        .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px; }
        .name { font-size: 24pt; font-weight: bold; margin: 0; }
        .contact { font-size: 10pt; color: #666; }
        .section-title { font-size: 14pt; font-weight: bold; color: #2ae023; border-bottom: 1px solid #eee; margin-top: 20px; margin-bottom: 10px; text-transform: uppercase; }
        .item-title { font-size: 11pt; font-weight: bold; }
        .item-meta { font-size: 10pt; color: #666; font-style: italic; }
        .content { font-size: 10pt; margin-bottom: 10px; }
        ul { margin-top: 5px; }
        li { margin-bottom: 3px; }
    </style></head>
    <body>
        <div class='header'>
            <p class='name'>${personalInfo.fullName || 'RESUME'}</p>
            <p class='contact'>${[personalInfo.email, personalInfo.phone, personalInfo.address].filter(Boolean).join(' | ')}</p>
        </div>
        
        ${summary ? `<div class='section-title'>Professional Summary</div><div class='content'>${summary}</div>` : ''}
        
        <div class='section-title'>Experience</div>
        ${experience.map(exp => `
            <div style='margin-bottom: 15px;'>
                <span class='item-title'>${exp.jobTitle}</span> | <span class='item-meta'>${exp.company} (${exp.startDate} - ${exp.endDate})</span>
                <div class='content'>${exp.description ? `<ul>${exp.description.split('\n').filter(l => l.trim()).map(l => `<li>${l.replace(/^[\*-•]\s*/, '')}</li>`).join('')}</ul>` : ''}</div>
            </div>
        `).join('')}

        <div class='section-title'>Education</div>
        ${education.map(edu => `
            <div style='margin-bottom: 10px;'>
                <span class='item-title'>${edu.degree}</span> | <span class='item-meta'>${edu.school} (${edu.gradYear})</span>
                ${edu.gpa ? `<div class='content'>GPA: ${edu.gpa}</div>` : ''}
            </div>
        `).join('')}

        ${technicalSkills ? `<div class='section-title'>Technical Skills</div><div class='content'>${technicalSkills}</div>` : ''}
        ${softSkills ? `<div class='section-title'>Soft Skills</div><div class='content'>${softSkills}</div>` : ''}

        <div class='section-title'>Projects</div>
        ${Array.isArray(projects) ? projects.map(proj => `
            <div style='margin-bottom: 10px;'>
                <span class='item-title'>${proj.name}</span> | <span class='item-meta'>${proj.technologies}</span>
                <div class='content'>${proj.description}</div>
            </div>
        `).join('') : `<div class='content'>${projects}</div>`}
    </body>
    </html>`;
}


router.get('/preview-pdf', async (req, res) => {
    try {
        const userId = req.query.userId;
        const resume = await Resume.findOne({ userId });
        if (!resume) return res.status(404).send('Resume not found');
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'inline; filename=resume-preview.pdf');
        await generateUnifiedResume(resume.data, resume.data.template || 'classic', res);
    } catch (error) {
        res.status(500).send('Generation failed');
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
        await generateUnifiedResume(resume.data, resume.data.template || 'classic', res);
    } catch (error) {
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

module.exports = router;
