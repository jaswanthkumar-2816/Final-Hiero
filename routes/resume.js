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

router.post('/preview-resume', async (req, res) => {
    try {
        const data = req.body;
        // Basic validation
        if (!data || Object.keys(data).length === 0) {
            return res.status(400).send('No resume data provided');
        }
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'inline; filename=resume-preview.pdf');
        await generateUnifiedResume(data, data.template || 'classic', res, { forceSinglePage: true });
    } catch (error) {
        console.error('Preview error:', error);
        if (!res.headersSent) res.status(500).send('Generation failed');
    }
});

router.post('/download-resume', async (req, res) => {
    try {
        const data = req.body;
        // Basic validation
        if (!data || Object.keys(data).length === 0) {
            return res.status(400).send('No resume data provided');
        }
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
    const {
        personalInfo = {},
        experience = [],
        education = [],
        projects = [],
        softSkills = '',
        summary = '',
        achievements = ''
    } = data;

    // Skills can come as 'skills' or 'technicalSkills'
    const technicalSkills = data.skills || data.technicalSkills || '';

    const template = data.template || 'classic';
    const isHieroEssence = template === 'hiero-essence' || template === 'essence';

    // Hiero Essence Colors
    const colors = {
        bg: isHieroEssence ? '#121212' : '#FFFFFF',
        text: isHieroEssence ? '#FFFFFF' : '#000000',
        accent: isHieroEssence ? '#f5a623' : '#2ae023',
        secondaryText: isHieroEssence ? '#AAAAAA' : '#333333'
    };

    const titles = {
        summary: 'Professional Summary',
        education: 'Education',
        projects: 'Projects',
        technicalSkills: 'Technical Skills',
        experience: 'Work Experience',
        achievements: 'Achievements',
        softSkills: 'Soft Skills'
    };

    return `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head><meta charset='utf-8'><title>Resume</title><style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.4; color: ${colors.text}; background-color: ${colors.bg}; padding: 20pt; }
        .header { text-align: center; margin-bottom: 25pt; border-bottom: 2pt solid ${colors.accent}; padding-bottom: 10pt; }
        .name { font-size: 24pt; font-weight: bold; margin: 0; color: ${colors.accent}; }
        .contact { font-size: 10pt; color: ${colors.secondaryText}; margin-top: 5pt; }
        .section-title { font-size: 14pt; font-weight: bold; color: ${colors.accent}; margin-top: 20pt; margin-bottom: 5pt; text-transform: uppercase; letter-spacing: 1px; background-color: ${isHieroEssence ? '#1e1e1e' : '#f0f0f0'}; padding: 5pt; }
        .section-line { border-top: 1pt solid ${colors.accent}; margin-bottom: 10pt; }
        .item-title { font-size: 11pt; font-weight: bold; color: ${colors.accent}; }
        .item-meta { font-size: 10pt; color: ${colors.secondaryText}; }
        .content { font-size: 10pt; margin-bottom: 8pt; text-align: justify; color: ${colors.text}; }
        ul { margin-top: 5pt; padding-left: 20pt; }
        li { margin-bottom: 4pt; color: ${colors.text}; }
        a { color: ${colors.accent}; text-decoration: none; }
    </style></head>
    <body style='background-color: ${colors.bg}; color: ${colors.text}; margin: 0; padding: 0;'>
        <table width="100%" border="0" cellspacing="0" cellpadding="40" bgcolor="${colors.bg}" style='background-color: ${colors.bg};'>
            <tr>
                <td align="left" valign="top">
                    <div class='header' style="text-align: center; margin-bottom: 25pt; border-bottom: 2pt solid ${colors.accent}; padding-bottom: 10pt;">
                        ${personalInfo.profilePhoto ? `
                            <div style='text-align: center; margin-bottom: 10pt;'>
                                <img src="${personalInfo.profilePhoto}" width="120" height="120" style="border-radius: 60px;">
                            </div>
                        ` : ''}
                        <div class='name' style='font-size: 24pt; font-weight: bold; margin: 0; color: ${colors.accent}; text-align: center;'>${(personalInfo.fullName || 'RESUME').toUpperCase()}</div>
                        <div class='contact' style='font-size: 10pt; color: ${colors.secondaryText}; margin-top: 5pt; text-align: center;'>${[personalInfo.address, personalInfo.phone, personalInfo.email].filter(Boolean).join('  |  ')}</div>
                    </div>
                    
                    ${summary ? `
                        <div class='section-title' style="font-size: 14pt; font-weight: bold; color: ${colors.accent}; margin-top: 20pt; margin-bottom: 5pt; text-transform: uppercase; letter-spacing: 1px; background-color: ${isHieroEssence ? '#1e1e1e' : '#f0f0f0'}; padding: 5pt;">${titles.summary}</div>
                        <div class='section-line' style="border-top: 1pt solid ${colors.accent}; margin-bottom: 10pt;"></div>
                        <div class='content' style="font-size: 10pt; margin-bottom: 8pt; text-align: justify; color: ${colors.text};">${summary}</div>
                    ` : ''}
                    
                    <div class='section-title' style="font-size: 14pt; font-weight: bold; color: ${colors.accent}; margin-top: 20pt; margin-bottom: 5pt; text-transform: uppercase; letter-spacing: 1px; background-color: ${isHieroEssence ? '#1e1e1e' : '#f0f0f0'}; padding: 5pt;">${titles.education}</div>
                    <div class='section-line' style="border-top: 1pt solid ${colors.accent}; margin-bottom: 10pt;"></div>
                    ${education.map(edu => `
                        <div style='margin-bottom: 10pt;'>
                            <div class='item-title' style="font-size: 11pt; font-weight: bold; color: ${colors.accent};">${edu.degree || ''}</div>
                            <div class='item-meta' style="font-size: 10pt; color: ${colors.secondaryText};">${edu.school || ''} ${edu.gradYear ? ` | ${edu.gradYear}` : ''} ${edu.gpa ? ` | GPA: ${edu.gpa}` : ''}</div>
                        </div>
                    `).join('')}

                    <div class='section-title' style="font-size: 14pt; font-weight: bold; color: ${colors.accent}; margin-top: 20pt; margin-bottom: 5pt; text-transform: uppercase; letter-spacing: 1px; background-color: ${isHieroEssence ? '#1e1e1e' : '#f0f0f0'}; padding: 5pt;">${titles.projects}</div>
                    <div class='section-line' style="border-top: 1pt solid ${colors.accent}; margin-bottom: 10pt;"></div>
                    ${Array.isArray(projects) ? projects.map(proj => `
                        <div style='margin-bottom: 12pt;'>
                            <div class='item-title' style="font-size: 11pt; font-weight: bold; color: ${colors.accent};">${proj.name || proj.title || ''}</div>
                            <div class='item-meta' style="font-size: 10pt; color: ${colors.secondaryText};">${proj.technologies || ''}</div>
                            <div class='content' style="font-size: 10pt; margin-bottom: 8pt; text-align: justify; color: ${colors.text};">${proj.description || ''}</div>
                            ${proj.achievement ? `<div class='content' style="font-size: 10pt; margin-bottom: 8pt; text-align: justify; color: ${colors.text};"><b>Achievement:</b> ${proj.achievement}</div>` : ''}
                        </div>
                    `).join('') : `<div class='content' style="font-size: 10pt; margin-bottom: 8pt; text-align: justify; color: ${colors.text};">${projects}</div>`}

                    ${technicalSkills ? `
                        <div class='section-title' style="font-size: 14pt; font-weight: bold; color: ${colors.accent}; margin-top: 20pt; margin-bottom: 5pt; text-transform: uppercase; letter-spacing: 1px; background-color: ${isHieroEssence ? '#1e1e1e' : '#f0f0f0'}; padding: 5pt;">${titles.technicalSkills}</div>
                        <div class='section-line' style="border-top: 1pt solid ${colors.accent}; margin-bottom: 10pt;"></div>
                        <div class='content' style="font-size: 10pt; margin-bottom: 8pt; text-align: justify; color: ${colors.text};">${technicalSkills}</div>
                    ` : ''}

                    <div class='section-title' style="font-size: 14pt; font-weight: bold; color: ${colors.accent}; margin-top: 20pt; margin-bottom: 5pt; text-transform: uppercase; letter-spacing: 1px; background-color: ${isHieroEssence ? '#1e1e1e' : '#f0f0f0'}; padding: 5pt;">${titles.experience}</div>
                    <div class='section-line' style="border-top: 1pt solid ${colors.accent}; margin-bottom: 10pt;"></div>
                    ${experience.map(exp => `
                        <div style='margin-bottom: 15pt;'>
                            <div class='item-title' style="font-size: 11pt; font-weight: bold; color: ${colors.accent};">${exp.jobTitle || ''}</div>
                            <div class='item-meta' style="font-size: 10pt; color: ${colors.secondaryText};">${exp.company || ''} (${exp.startDate || ''} - ${exp.endDate || 'Present'})</div>
                            <div class='content' style="font-size: 10pt; margin-bottom: 8pt; text-align: justify; color: ${colors.text};">${exp.description ? `<ul style="margin-top: 5pt; padding-left: 20pt;">${exp.description.split('\n').filter(l => l.trim()).map(l => `<li style="margin-bottom: 4pt; color: ${colors.text};">${l.replace(/^[\*-•]\s*/, '')}</li>`).join('')}</ul>` : ''}</div>
                        </div>
                    `).join('')}

                    ${achievements ? `
                        <div class='section-title' style="font-size: 14pt; font-weight: bold; color: ${colors.accent}; margin-top: 20pt; margin-bottom: 5pt; text-transform: uppercase; letter-spacing: 1px; background-color: ${isHieroEssence ? '#1e1e1e' : '#f0f0f0'}; padding: 5pt;">${titles.achievements}</div>
                        <div class='section-line' style="border-top: 1pt solid ${colors.accent}; margin-bottom: 10pt;"></div>
                        <div class='content' style="font-size: 10pt; margin-bottom: 8pt; text-align: justify; color: ${colors.text};">${achievements}</div>
                    ` : ''}

                    ${softSkills ? `
                        <div class='section-title' style="font-size: 14pt; font-weight: bold; color: ${colors.accent}; margin-top: 20pt; margin-bottom: 5pt; text-transform: uppercase; letter-spacing: 1px; background-color: ${isHieroEssence ? '#1e1e1e' : '#f0f0f0'}; padding: 5pt;">${titles.softSkills}</div>
                        <div class='section-line' style="border-top: 1pt solid ${colors.accent}; margin-bottom: 10pt;"></div>
                        <div class='content' style="font-size: 10pt; margin-bottom: 8pt; text-align: justify; color: ${colors.text};">${softSkills}</div>
                    ` : ''}

                    ${Array.isArray(data.customDetails) ? data.customDetails.map(custom => `
                        <div class='section-title' style="font-size: 14pt; font-weight: bold; color: ${colors.accent}; margin-top: 20pt; margin-bottom: 5pt; text-transform: uppercase; letter-spacing: 1px; background-color: ${isHieroEssence ? '#1e1e1e' : '#f0f0f0'}; padding: 5pt;">${custom.heading || 'ADDITIONAL DETAIL'}</div>
                        <div class='section-line' style="border-top: 1pt solid ${colors.accent}; margin-bottom: 10pt;"></div>
                        <div class='content' style="font-size: 10pt; margin-bottom: 8pt; text-align: justify; color: ${colors.text};">${custom.content || ''}</div>
                    `).join('') : ''}
                </td>
            </tr>
        </table>
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
