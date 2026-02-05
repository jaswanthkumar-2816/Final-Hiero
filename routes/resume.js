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
        await generateUnifiedResume(data, data.template || 'classic', res, { forceSinglePage: true });
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

// Helper for Word generation (Refined to match the 'Jhon Smith' template)
function generateWordHTML(data) {
    const { personalInfo = {}, experience = [], education = [], projects = [], technicalSkills = '', softSkills = '', summary = '', achievements = '' } = data;

    // Mapping keys to perfect titles
    const titles = {
        summary: 'CARRIER OBJECTIVE',
        education: 'EDUCATION',
        projects: 'PROJECTS',
        technicalSkills: 'TECHNICAL STRENGTHS',
        experience: 'WORK EXPERIENCE',
        achievements: 'ACADEMIC ACHIEVEMENTS',
        softSkills: 'PERSONAL TRAITS'
    };

    return `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head><meta charset='utf-8'><title>Resume</title><style>
        body { font-family: 'Times New Roman', serif; line-height: 1.4; color: #000; margin: 40pt; }
        .header { text-align: center; margin-bottom: 25pt; }
        .name { font-size: 20pt; font-weight: bold; margin: 0; text-transform: none; }
        .contact { font-size: 10pt; color: #333; margin-top: 5pt; }
        .section-title { font-size: 12pt; font-weight: bold; color: #000; margin-top: 20pt; margin-bottom: 5pt; text-transform: uppercase; letter-spacing: 1px; }
        .section-line { border-top: 1pt solid #000; margin-bottom: 10pt; }
        .item-title { font-size: 11pt; font-weight: bold; }
        .item-meta { font-size: 10pt; color: #444; }
        .content { font-size: 10pt; margin-bottom: 8pt; text-align: justify; }
        ul { margin-top: 5pt; padding-left: 20pt; }
        li { margin-bottom: 4pt; }
    </style></head>
    <body>
        <div class='header'>
            <div class='name'>${personalInfo.fullName || 'RESUME'}</div>
            <div class='contact'>${[personalInfo.address, personalInfo.phone, personalInfo.email].filter(Boolean).join('  |  ')}</div>
        </div>
        
        ${summary ? `
            <div class='section-title'>${titles.summary}</div>
            <div class='section-line'></div>
            <div class='content'>${summary}</div>
        ` : ''}
        
        <div class='section-title'>${titles.education}</div>
        <div class='section-line'></div>
        ${education.map(edu => `
            <div style='margin-bottom: 10pt;'>
                <div class='item-title'>${edu.degree || ''}</div>
                <div class='item-meta'>${edu.school || ''} ${edu.gradYear ? ` | ${edu.gradYear}` : ''} ${edu.gpa ? ` | GPA: ${edu.gpa}` : ''}</div>
            </div>
        `).join('')}

        <div class='section-title'>${titles.projects}</div>
        <div class='section-line'></div>
        ${Array.isArray(projects) ? projects.map(proj => `
            <div style='margin-bottom: 12pt;'>
                <div class='item-title'>${proj.name || proj.title || ''}</div>
                <div class='item-meta'>${proj.technologies || ''}</div>
                <div class='content'>${proj.description || ''}</div>
                ${proj.achievement ? `<div class='content'><b>Achievement:</b> ${proj.achievement}</div>` : ''}
            </div>
        `).join('') : `<div class='content'>${projects}</div>`}

        ${technicalSkills ? `
            <div class='section-title'>${titles.technicalSkills}</div>
            <div class='section-line'></div>
            <div class='content'>${technicalSkills}</div>
        ` : ''}

        <div class='section-title'>${titles.experience}</div>
        <div class='section-line'></div>
        ${experience.map(exp => `
            <div style='margin-bottom: 15pt;'>
                <div class='item-title'>${exp.jobTitle || ''}</div>
                <div class='item-meta'>${exp.company || ''} (${exp.startDate || ''} - ${exp.endDate || 'Present'})</div>
                <div class='content'>${exp.description ? `<ul>${exp.description.split('\n').filter(l => l.trim()).map(l => `<li>${l.replace(/^[\*-•]\s*/, '')}</li>`).join('')}</ul>` : ''}</div>
            </div>
        `).join('')}

        ${achievements ? `
            <div class='section-title'>${titles.achievements}</div>
            <div class='section-line'></div>
            <div class='content'>${achievements}</div>
        ` : ''}

        ${softSkills ? `
            <div class='section-title'>${titles.softSkills}</div>
            <div class='section-line'></div>
            <div class='content'>${softSkills}</div>
        ` : ''}

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
