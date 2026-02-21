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

// Helper for Word generation
function generateWordHTML(data) {
    const {
        personalInfo = {},
        experience = [],
        education = [],
        projects = [],
        summary = ''
    } = data;

    let technicalSkills = data.skills || data.technicalSkills || '';
    if (Array.isArray(technicalSkills)) technicalSkills = technicalSkills.join(', ');

    const template = data.template || 'classic';
    const name = (personalInfo.fullName || 'RESUME').toUpperCase();
    const contactStr = [personalInfo.address, personalInfo.phone, personalInfo.email].filter(Boolean).join('  |  ');

    // Format Experience Helper
    const formatExp = (exp, colorText, colorAccent, colorMeta) => {
        let descHtml = '';
        if (exp.description) {
            const lines = Array.isArray(exp.description) ? exp.description : exp.description.split('\n');
            descHtml = `<ul style="margin-top: 5pt; padding-left: 20pt;">${lines.filter(l => l && typeof l === 'string' && l.trim()).map(l => `<li style="margin-bottom: 4pt; color: ${colorText};">${l.replace(/^[\*-•]\s*/, '')}</li>`).join('')}</ul>`;
        } else if (exp.points && Array.isArray(exp.points)) {
            descHtml = `<ul style="margin-top: 5pt; padding-left: 20pt;">${exp.points.map(l => `<li style="margin-bottom: 4pt; color: ${colorText};">${l.replace(/^[\*-•]\s*/, '')}</li>`).join('')}</ul>`;
        }
        return `
        <div style='margin-bottom: 15pt;'>
            <div style="font-size: 11pt; font-weight: bold; color: ${colorAccent};">${exp.jobTitle || exp.title || ''}</div>
            <div style="font-size: 10pt; color: ${colorMeta};">${exp.company || ''} (${exp.startDate || ''} - ${exp.endDate || 'Present'})</div>
            <div style="font-size: 10pt; margin-bottom: 8pt; text-align: justify; color: ${colorText};">${descHtml}</div>
        </div>
        `;
    };

    // Format Education Helper
    const formatEdu = (edu, colorText, colorAccent, colorMeta) => `
        <div style='margin-bottom: 10pt;'>
            <div style="font-size: 11pt; font-weight: bold; color: ${colorAccent};">${edu.degree || ''}</div>
            <div style="font-size: 10pt; color: ${colorMeta};">${edu.school || ''} ${edu.gradYear ? ` | ${edu.gradYear}` : ''} ${edu.gpa ? ` | GPA: ${edu.gpa}` : ''}</div>
        </div>
    `;

    // --------------------------------------------------------------------------------
    // TEMPLATE: HIERO-RETAIL (2-column: Left Sidebar, Right Main)
    // --------------------------------------------------------------------------------
    if (template === 'hiero-retail') {
        const bg = '#FFFFFF', text = '#333333', accent = '#1f2a6b', meta = '#666666';
        return `
        <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
        <head><meta charset='utf-8'><title>Resume</title></head>
        <body style='font-family: Arial, sans-serif; background-color: ${bg}; padding: 0;'>
            <table width="100%" border="0" cellspacing="0" cellpadding="0" style="border: 4pt solid ${accent}; padding: 15pt;">
                <tr><td colspan="2" style="padding-bottom: 20pt;">
                    <h1 style="color: ${accent}; margin:0; font-size: 28pt;">${name}</h1>
                    <div style="color: ${meta}; font-style: italic; font-size: 14pt; margin-top: 5pt;">${personalInfo.roleTitle || 'Professional'}</div>
                    <p style="color: ${text}; font-size: 10pt; margin-top: 10pt;">${summary}</p>
                </td></tr>
                <tr>
                    <td width="30%" valign="top" style="padding-right: 15pt; border-right: 1pt solid #ccc;">
                        <div style="font-size: 14pt; font-weight: bold; color: ${accent}; border-bottom: 1pt solid #ccc; margin-bottom: 10pt; padding-bottom: 3pt;">Contact</div>
                        <div style="font-size: 10pt; color: ${text}; font-weight:bold;">Address</div>
                        <div style="font-size: 10pt; color: ${meta}; margin-bottom: 8pt;">${personalInfo.address || ''}</div>
                        <div style="font-size: 10pt; color: ${text}; font-weight:bold;">Phone</div>
                        <div style="font-size: 10pt; color: ${meta}; margin-bottom: 8pt;">${personalInfo.phone || ''}</div>
                        <div style="font-size: 10pt; color: ${text}; font-weight:bold;">E-mail</div>
                        <div style="font-size: 10pt; color: ${meta}; margin-bottom: 15pt;">${personalInfo.email || ''}</div>
                        
                        ${technicalSkills ? `<div style="font-size: 14pt; font-weight: bold; color: ${accent}; border-bottom: 1pt solid #ccc; margin-bottom: 10pt; padding-bottom: 3pt;">Skills</div>
                        <div style="font-size: 10pt; color: ${text}; line-height: 1.5;">${technicalSkills.split(',').map(s => `• ${s.trim()}<br>`).join('')}</div>` : ''}
                    </td>
                    <td width="70%" valign="top" style="padding-left: 15pt;">
                        <div style="font-size: 16pt; font-weight: bold; color: ${accent}; border-bottom: 1pt solid #ccc; margin-bottom: 10pt; padding-bottom: 3pt;">Education</div>
                        ${education.map(e => formatEdu(e, text, text, meta)).join('')}
                        
                        <div style="font-size: 16pt; font-weight: bold; color: ${accent}; border-bottom: 1pt solid #ccc; margin-bottom: 10pt; margin-top: 15pt; padding-bottom: 3pt;">Work History</div>
                        ${experience.map(e => formatExp(e, text, text, meta)).join('')}
                    </td>
                </tr>
            </table>
        </body></html>`;
    }

    // --------------------------------------------------------------------------------
    // TEMPLATE: PRIYA-ANALYTICS (Grey Top Bar, Single Column)
    // --------------------------------------------------------------------------------
    if (template === 'priya-analytics' || template === 'priya') {
        const bg = '#FFFFFF', text = '#333333', accent = '#333333', meta = '#666666';
        return `
        <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
        <head><meta charset='utf-8'><title>Resume</title></head>
        <body style='font-family: Arial, sans-serif; background-color: ${bg}; padding: 0;'>
            <table width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr><td style="background-color: #f0f0f0; padding: 20pt; text-align: center; border-bottom: 3pt solid #dcdcdc; margin-bottom: 20pt;">
                    <h1 style="color: ${accent}; margin:0; font-size: 26pt; letter-spacing: 2pt;">${name}</h1>
                    <div style="color: ${meta}; font-size: 11pt; margin-top: 8pt;">${contactStr}</div>
                </td></tr>
                <tr><td style="padding: 20pt;">
                    ${summary ? `<h2 style="font-size: 14pt; color:${accent}; border-bottom: 1pt solid #ccc; padding-bottom:4pt; text-transform:uppercase;">Professional Summary</h2><p style="font-size:10pt;">${summary}</p>` : ''}
                    ${technicalSkills ? `<h2 style="font-size: 14pt; color:${accent}; border-bottom: 1pt solid #ccc; padding-bottom:4pt; text-transform:uppercase;">Technical Skills</h2><p style="font-size:10pt;">${technicalSkills}</p>` : ''}
                    
                    <h2 style="font-size: 14pt; color:${accent}; border-bottom: 1pt solid #ccc; padding-bottom:4pt; text-transform:uppercase;">Work Experience</h2>
                    ${experience.map(e => formatExp(e, text, accent, meta)).join('')}
                    
                    <h2 style="font-size: 14pt; color:${accent}; border-bottom: 1pt solid #ccc; padding-bottom:4pt; text-transform:uppercase;">Education</h2>
                    ${education.map(e => formatEdu(e, text, accent, meta)).join('')}
                </td></tr>
            </table>
        </body></html>`;
    }

    // --------------------------------------------------------------------------------
    // TEMPLATE: HIERO-ESSENCE (Dark Theme, Orange Accents)
    // --------------------------------------------------------------------------------
    if (template === 'hiero-essence' || template === 'essence') {
        const bg = '#121212', text = '#FFFFFF', accent = '#f5a623', meta = '#AAAAAA';
        return `
        <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
        <head><meta charset='utf-8'><title>Resume</title></head>
        <body style='font-family: Arial, sans-serif; background-color: ${bg}; color: ${text}; padding: 20pt;'>
            <table width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr><td style="padding-bottom: 20pt; border-bottom: 2pt solid ${accent}; text-align: center;">
                    <h1 style="color: ${accent}; margin:0; font-size: 28pt;">${name}</h1>
                    <div style="color: ${meta}; font-size: 11pt; margin-top: 8pt;">${contactStr}</div>
                </td></tr>
                <tr><td style="padding-top: 20pt;">
                    ${summary ? `<div style="font-size: 14pt; font-weight: bold; background-color: #1e1e1e; padding: 5pt; color: ${accent}; text-transform: uppercase;">Professional Summary</div>
                    <p style="font-size:10pt; color: ${text};">${summary}</p>` : ''}
                    
                    <div style="font-size: 14pt; font-weight: bold; background-color: #1e1e1e; padding: 5pt; color: ${accent}; text-transform: uppercase; margin-top: 15pt;">Work Experience</div>
                    <div style="border-top: 1pt solid ${accent}; margin-bottom: 10pt;"></div>
                    ${experience.map(e => formatExp(e, text, accent, meta)).join('')}
                    
                    <div style="font-size: 14pt; font-weight: bold; background-color: #1e1e1e; padding: 5pt; color: ${accent}; text-transform: uppercase; margin-top: 15pt;">Education</div>
                    <div style="border-top: 1pt solid ${accent}; margin-bottom: 10pt;"></div>
                    ${education.map(e => formatEdu(e, text, accent, meta)).join('')}
                    
                    ${technicalSkills ? `<div style="font-size: 14pt; font-weight: bold; background-color: #1e1e1e; padding: 5pt; color: ${accent}; text-transform: uppercase; margin-top: 15pt;">Skills</div>
                    <p style="font-size:10pt; color: ${text};">${technicalSkills}</p>` : ''}
                </td></tr>
            </table>
        </body></html>`;
    }

    // --------------------------------------------------------------------------------
    // DEFAULT GENERIC FORMAT
    // --------------------------------------------------------------------------------
    const bg = '#FFFFFF', text = '#000000', accent = '#2ae023', meta = '#333333';
    return `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head><meta charset='utf-8'><title>Resume</title></head>
    <body style='font-family: Arial, sans-serif; background-color: ${bg}; color: ${text}; padding: 20pt;'>
        <div style="text-align: center; margin-bottom: 25pt; border-bottom: 2pt solid ${accent}; padding-bottom: 10pt;">
            <div style="font-size: 24pt; font-weight: bold; color: ${accent};">${name}</div>
            <div style="font-size: 10pt; color: ${meta}; margin-top: 5pt;">${contactStr}</div>
        </div>
        
        ${summary ? `<div style="font-size: 14pt; font-weight: bold; color: ${accent}; text-transform: uppercase; padding: 5pt; background-color: #f0f0f0; margin-top: 15pt;">Professional Summary</div>
        <div style="border-top: 1pt solid ${accent}; margin-bottom: 10pt;"></div><p style="font-size:10pt;">${summary}</p>` : ''}
        
        ${technicalSkills ? `<div style="font-size: 14pt; font-weight: bold; color: ${accent}; text-transform: uppercase; padding: 5pt; background-color: #f0f0f0; margin-top: 15pt;">Technical Skills</div>
        <div style="border-top: 1pt solid ${accent}; margin-bottom: 10pt;"></div><p style="font-size:10pt;">${technicalSkills}</p>` : ''}
        
        <div style="font-size: 14pt; font-weight: bold; color: ${accent}; text-transform: uppercase; padding: 5pt; background-color: #f0f0f0; margin-top: 15pt;">Work Experience</div>
        <div style="border-top: 1pt solid ${accent}; margin-bottom: 10pt;"></div>
        ${experience.map(e => formatExp(e, text, accent, meta)).join('')}
        
        <div style="font-size: 14pt; font-weight: bold; color: ${accent}; text-transform: uppercase; padding: 5pt; background-color: #f0f0f0; margin-top: 15pt;">Education</div>
        <div style="border-top: 1pt solid ${accent}; margin-bottom: 10pt;"></div>
        ${education.map(e => formatEdu(e, text, accent, meta)).join('')}
    </body></html>`;
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
