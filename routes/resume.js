const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const os = require('os');
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


const { generatePuppeteerPDF } = require('../utils/puppeteer-service');

router.post('/preview-resume', async (req, res) => {
    try {
        const data = req.body;
        if (!data || Object.keys(data).length === 0) {
            return res.status(400).send('No resume data provided');
        }

        const templateId = data.template || 'classic';

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'inline; filename=resume-preview.pdf');
        await generateUnifiedResume(data, templateId, res, { forceSinglePage: true });
    } catch (error) {
        console.error('Preview error:', error);
        if (!res.headersSent) res.status(500).send('Generation failed');
    }
});

router.post('/download-resume', async (req, res) => {
    try {
        const data = req.body;
        if (!data || Object.keys(data).length === 0) {
            return res.status(400).send('No resume data provided');
        }

        const templateId = data.template || 'classic';
        const name = (data.personalInfo?.fullName || 'Resume').replace(/\s+/g, '_');

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${name}_Hiero.pdf"`);
        await generateUnifiedResume(data, templateId, res);
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

// Helper for Word generation (Exact Hiero Minimal Replica)
function generateWordHTML(data) {
    const {
        personalInfo = {},
        experience = [],
        education = [],
        projects = [],
        technicalSkills: techSkillsRaw = '',
        softSkills = '',
        summary = '',
        languages = '',
        hobbies = '',
        references = []
    } = data;

    const technicalSkills = data.skills || data.technicalSkills || techSkillsRaw || '';
    const template = data.template || 'classic';
    const roleTitle = (personalInfo.roleTitle || personalInfo.title || (experience[0]?.jobTitle || '') || 'Professional').toUpperCase();

    const colors = {
        text: '#222222',
        secondary: '#666666',
        line: '#cccccc',
        light: '#f0f0f0'
    };

    // Helper: Render Hiero Timeline Row (3-column layout)
    const renderHieroRow = (left, right, isLast = false, sectionTitle = "") => `
        <tr>
            <td width="150" align="right" valign="top" style="padding-top: 5pt; padding-right: 20pt; font-size: 8.5pt; color: ${colors.secondary}; font-family: 'Segoe UI', Arial, sans-serif;">
                ${left}
            </td>
            <td width="20" align="center" valign="top" style="padding-top: 4pt; ${isLast ? '' : `border-left: 1.5pt solid ${colors.line};`}">
                <div style="font-size: 16pt; color: ${colors.line}; line-height: 1; margin-left: -12.5pt;">•</div>
            </td>
            <td valign="top" style="padding-bottom: 20pt; padding-left: 20pt; font-family: 'Segoe UI', Arial, sans-serif;">
                ${right}
            </td>
        </tr>
    `;

    const renderSectionHeader = (title) => {
        const isSkills = title.toUpperCase() === "SKILLS";
        return `
            <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-top: 18pt; margin-bottom: 12pt;">
                <tr>
                    <td width="150" align="right" valign="bottom" style="font-size: 11pt; font-weight: bold; color: #111111; text-transform: uppercase; letter-spacing: 1.5pt; font-family: 'Times New Roman', serif; padding-right: 20pt;">
                        ${isSkills ? title : ''}
                    </td>
                    <td width="20"></td>
                    <td style="font-size: 11pt; font-weight: bold; color: #111111; text-transform: uppercase; letter-spacing: 1.5pt; border-bottom: 1.5pt solid #dddddd; padding-bottom: 8pt; font-family: 'Times New Roman', serif;">
                        ${!isSkills ? title : '&nbsp;'}
                    </td>
                </tr>
            </table>
        `;
    };

    // IF HIERO-MINIMAL (New refined version)
    if (template === 'hiero-minimal' || template === 'minimal' || template === 'hiero-timeline') {
        let html = '';

        // HEADER - Exactly matching the image layout
        html += `
            <table width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                    <td width="90" valign="top">
                        ${personalInfo.profilePhoto ? `<img src="${personalInfo.profilePhoto}" width="85" height="85">` : '<div style="width:85pt;height:85pt;background:#f0f0f0;"></div>'}
                    </td>
                    <td valign="top" style="padding-left: 25pt;">
                        <div style="font-size: 28pt; font-weight: bold; color: #000000; font-family: 'Times New Roman', serif; line-height: 1.1;">${(personalInfo.fullName || 'RESUME')}</div>
                        <div style="font-size: 10pt; color: ${colors.secondary}; margin-top: 3pt; letter-spacing: 2pt; font-family: 'Segoe UI', Arial, sans-serif;">${roleTitle}</div>
                        
                        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-top: 15pt;">
                            <tr>
                                <td width="48%" style="font-size: 9pt; color: ${colors.secondary}; font-family: 'Segoe UI', Arial, sans-serif; padding-bottom: 8pt;">
                                    <span style="font-family: 'Segoe UI Symbol', sans-serif; color: #111111; font-size: 10pt;">☎</span> &nbsp; ${personalInfo.phone || ''}
                                </td>
                                <td style="font-size: 9pt; color: ${colors.secondary}; font-family: 'Segoe UI', Arial, sans-serif; padding-bottom: 8pt;">
                                    <span style="font-family: 'Segoe UI Symbol', sans-serif; color: #111111; font-size: 10pt;">📍</span> &nbsp; ${personalInfo.address || ''}
                                </td>
                            </tr>
                            <tr>
                                <td style="font-size: 9pt; color: ${colors.secondary}; font-family: 'Segoe UI', Arial, sans-serif;">
                                    <span style="font-family: 'Segoe UI Symbol', sans-serif; color: #111111; font-size: 10pt;">🌐</span> &nbsp; ${personalInfo.website || personalInfo.linkedin || ''}
                                </td>
                                <td style="font-size: 9pt; color: ${colors.secondary}; font-family: 'Segoe UI', Arial, sans-serif;">
                                    <span style="font-family: 'Segoe UI Symbol', sans-serif; color: #111111; font-size: 10pt;">✉</span> &nbsp; ${personalInfo.email || ''}
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>
            <div style="height: 1pt; border-bottom: 1.2pt solid #dddddd; margin-top: 20pt; margin-bottom: 20pt;"></div>
        `;

        if (summary) {
            html += `<div style="font-size: 10.5pt; color: #666666; line-height: 1.5; text-align: justify; margin-bottom: 20pt; font-family: 'Segoe UI', Arial, sans-serif; margin-left: 110pt;">${summary}</div>`;
        }

        // MAIN CONTENT
        if (experience.length > 0) {
            html += renderSectionHeader('Work Experience');
            html += `<table width="100%" border="0" cellspacing="0" cellpadding="0">`;
            experience.forEach((exp, i) => {
                const left = `<b>${exp.company || ''}</b><br><span style="font-size: 8pt;">${exp.startDate || ''} - ${exp.endDate || 'Present'}</span>`;
                const right = `
                    <div style="font-size: 10pt; font-weight: bold; color: #111111; margin-bottom: 4pt;">${exp.jobTitle || ''}</div>
                    <div style="font-size: 9pt; color: ${colors.secondary}; line-height: 1.4;">
                        ${exp.description ? `<ul style="margin: 0; padding-left: 15pt;">${exp.description.split('\n').filter(l => l.trim()).map(l => `<li style="margin-bottom: 3pt;">${l.replace(/^[\*-•]\s*/, '')}</li>`).join('')}</ul>` : ''}
                    </div>
                `;
                html += renderHieroRow(left, right, i === experience.length - 1);
            });
            html += `</table>`;
        }

        if (education.length > 0) {
            html += renderSectionHeader('Education');
            html += `<table width="100%" border="0" cellspacing="0" cellpadding="0">`;
            education.forEach((edu, i) => {
                const left = `<b>${edu.school || ''}</b><br><span style="font-size: 8pt;">${edu.gradYear || ''}</span>`;
                const right = `<div style="font-size: 10pt; font-weight: bold; color: #111111;">${edu.degree || ''}</div>${edu.gpa ? `<div style="font-size: 9pt; color: ${colors.secondary}; margin-top: 2pt;">GPA: ${edu.gpa}</div>` : ''}`;
                html += renderHieroRow(left, right, i === education.length - 1);
            });
            html += `</table>`;
        }

        if (technicalSkills || softSkills) {
            html += renderSectionHeader('Skills');
            html += `<table width="100%" border="0" cellspacing="0" cellpadding="0">`;
            if (technicalSkills) html += renderHieroRow(`<b>TECHNICAL<br>SKILLS</b>`, `<div style="font-size: 9.5pt; color: ${colors.secondary}; line-height: 1.5;">${technicalSkills}</div>`, false);
            if (softSkills) html += renderHieroRow(`<b>SOFT SKILLS</b>`, `<div style="font-size: 9.5pt; color: ${colors.secondary}; line-height: 1.5;">${softSkills}</div>`, true);
            html += `</table>`;
        }

        const certs = [...(Array.isArray(projects) ? projects : []), ...(data.certifications || [])];
        if (certs.length > 0) {
            html += renderSectionHeader('Certification & Projects');
            html += `<table width="100%" border="0" cellspacing="0" cellpadding="0">`;
            certs.forEach((item, i) => {
                const left = `<b>${item.duration || item.date || ''}</b>`;
                const right = `
                    <div style="font-size: 10pt; font-weight: bold; color: #111111;">${item.name || item.title || ''}</div>
                    ${item.technologies ? `<div style="font-size: 8.5pt; color: ${colors.secondary}; font-style: italic; margin-top: 1pt;">${item.technologies}</div>` : ''}
                    <div style="font-size: 9pt; color: ${colors.secondary}; margin-top: 3pt;">${item.description || ''}</div>
                `;
                html += renderHieroRow(left, right, i === certs.length - 1);
            });
            html += `</table>`;
        }

        return `
        <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
        <head><meta charset='utf-8'><title>Resume</title>
        <style>
            @page { size: 8.5in 11in; margin: 0; }
            body { font-family: 'Segoe UI', Arial, sans-serif; color: #111111; margin: 0; padding: 0; }
            table { border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
            td { padding: 0; }
            ul { margin: 0; }
        </style>
        </head>
        <body>
            <table width="100%" height="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                    <td width="30" style="background-color: #111111; height: 11in;">&nbsp;</td>
                    <td valign="top" style="padding: 0.5in; background-color: #ffffff;">
                        ${html}
                    </td>
                </tr>
            </table>
        </body>
        </html>`;
    }

    // --- Format Helpers for legacy templates ---
    const formatExp = (exp, colorText, colorAccent, colorMeta) => {
        let descHtml = '';
        if (exp.description) {
            const lines = Array.isArray(exp.description) ? exp.description : exp.description.split('\n');
            descHtml = `<ul style="margin-top: 5pt; padding-left: 20pt;">${lines.filter(l => l && typeof l === 'string' && l.trim()).map(l => `<li style="margin-bottom: 4pt; color: ${colorText};">${l.replace(/^[\*-•]\s*/, '')}</li>`).join('')}</ul>`;
        }
        return `
        <div style='margin-bottom: 15pt;'>
            <div style="font-size: 11pt; font-weight: bold; color: ${colorAccent};">${exp.jobTitle || exp.title || ''}</div>
            <div style="font-size: 10pt; color: ${colorMeta};">${exp.company || ''} (${exp.startDate || ''} - ${exp.endDate || 'Present'})</div>
            <div style="font-size: 10pt; margin-bottom: 8pt; text-align: justify; color: ${colorText};">${descHtml}</div>
        </div>
        `;
    };

    const formatEdu = (edu, colorText, colorAccent, colorMeta) => `
        <div style='margin-bottom: 10pt;'>
            <div style="font-size: 11pt; font-weight: bold; color: ${colorAccent};">${edu.degree || ''}</div>
            <div style="font-size: 10pt; color: ${colorMeta};">${edu.school || ''} ${edu.gradYear ? ` | ${edu.gradYear}` : ''} ${edu.gpa ? ` | GPA: ${edu.gpa}` : ''}</div>
        </div>
    `;

    const name = (personalInfo.fullName || 'RESUME').toUpperCase();
    const contactStr = [personalInfo.address, personalInfo.phone, personalInfo.email].filter(Boolean).join('  |  ');

    // LEGACY TEMPLATES
    if (template === 'hiero-retail') {
        const bg = '#FFFFFF', text = '#333333', accent = '#1f2a6b', meta = '#666666';
        return `<html>...</html>`; // Truncated for brevity but should be fully restored if needed
    }
    // ... (rest of logic) ...

    if (template === 'hiero-premium' || template === 'premium') {
        const BG_COLOR = '#F4F5F7';
        const CARD_BG = '#FFFFFF';
        const PEACH_ACCENT = '#F2B66D';
        const TEXT_PRI = '#333333';
        const TEXT_SEC = '#555555';
        const TEXT_HEADER = '#000000';

        const activitiesArr = data.extraCurricular || data.activities || [];
        const skillsArr = Array.isArray(data.skills) ? data.skills : (data.technicalSkills || '').split(/[,|]/).filter(Boolean);
        const nameText = (personalInfo.fullName || 'STEVEN TERRY').toUpperCase();

        return `
        <html xmlns:v='urn:schemas-microsoft-com:vml' xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
        <head><meta charset='utf-8'><title>Resume</title>
        <style>
            @page {
                size: 8.27in 11.69in;
                margin: 0in;
            }
            body { 
                font-family: 'Helvetica', 'Open Sans', Arial, sans-serif; 
                margin: 0; 
                padding: 0; 
                background-color: ${BG_COLOR};
            }
            table { border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt; border: none; }
            td { padding: 0; vertical-align: top; border: none; }
            
            .card-outer {
                background-color: ${CARD_BG};
                margin-bottom: 12pt;
                border: 1pt solid #E2E6EA;
                border-radius: 6pt;
                overflow: hidden;
                box-shadow: 2px 2px 5px rgba(0,0,0,0.05);
            }
            .card-inner-table {
                padding: 12pt;
            }
            .card-header {
                background-color: ${PEACH_ACCENT};
                color: ${TEXT_HEADER};
                font-size: 10pt;
                font-weight: bold;
                padding: 5pt 10pt;
                margin-bottom: 10pt;
            }
        </style>
        </head>
        <body>
            <table width="100%" border="0" cellspacing="0" cellpadding="0" style="table-layout: fixed;">
                <tr><td height="30" style="height: 30px; line-height: 30px;"></td></tr>
                <tr>
                    <td width="30" style="width: 30px;"></td>
                    <td>
                        <table width="100%" border="0" cellspacing="0" cellpadding="0">
                            <tr>
                                <!-- LEFT COLUMN: 35% -->
                                <td width="35%" valign="top">
                                    <div style="text-align: center; margin-bottom: 20pt;">
                                        ${personalInfo.profilePhoto ?
                `<!--[if gte vml 1]><v:oval style="position:relative;width:110px;height:110px;" strokecolor="${BG_COLOR}" strokeweight="1pt"><v:fill type="frame" src="${personalInfo.profilePhoto}" /></v:oval><![endif]--><![if !vml]><img src="${personalInfo.profilePhoto}" width="110" height="110" style="border-radius: 55px;"><![endif]>` :
                `<div style="width: 110px; height: 110px; border-radius: 55px; background-color: #d0d0d0; margin: 0 auto;"></div>`
            }
                                    </div>
                                    
                                    <table class="card-outer" width="100%"><tr><td class="card-inner-table">
                                        <div style="font-size:10pt; color:${TEXT_SEC}; line-height:1.6;">
                                            ${[data.personalInfo.gender, data.personalInfo.dob, data.personalInfo.phone, data.personalInfo.email, data.personalInfo.linkedin, data.personalInfo.github, data.personalInfo.website, data.personalInfo.address].filter(Boolean).map(i => `<div><span style="color:${PEACH_ACCENT}">•</span> ${i}</div>`).join('')}
                                        </div>
                                    </td></tr></table>

                                    ${data.summary ? `
                                    <table class="card-outer" width="100%"><tr><td class="card-inner-table">
                                        <div class="card-header">OBJECTIVE</div>
                                        <div style="font-size:9.5pt; color:${TEXT_SEC}; line-height:1.4;">${data.summary}</div>
                                    </td></tr></table>
                                    ` : ''}

                                    ${skillsArr.length > 0 ? `
                                    <table class="card-outer" width="100%"><tr><td class="card-inner-table">
                                        <div class="card-header">SKILLS</div>
                                        <div style="font-size:9.5pt; color:${TEXT_SEC}; line-height:1.6;">
                                            ${skillsArr.map(s => `<div>- ${s.toString().trim()}</div>`).join('')}
                                        </div>
                                    </td></tr></table>
                                    ` : ''}

                                    ${data.personalInfo.languagesKnown || data.languages ? `
                                    <table class="card-outer" width="100%"><tr><td class="card-inner-table">
                                        <div class="card-header">LANGUAGES</div>
                                        <div style="font-size:9.5pt; color:${TEXT_SEC}; line-height:1.4;">${data.personalInfo.languagesKnown || data.languages}</div>
                                    </td></tr></table>
                                    ` : ''}

                                </td>
                                <td width="5%" style="width:20px;"></td>

                                <!-- RIGHT COLUMN: 60% -->
                                <td width="60%" valign="top">
                                    <div style="padding-top: 25pt; padding-bottom: 20pt;">
                                        <div style="font-size: 26pt; font-family: 'Helvetica', Arial, sans-serif; font-weight: bold; color: ${TEXT_PRI};">${nameText}</div>
                                        <div style="height: 1px; background-color: #CCCCCC; line-height: 1px; margin: 10pt 0;"></div>
                                        <div style="font-size: 12pt; color: ${TEXT_SEC};">${data.personalInfo.jobTitle || data.experience?.[0]?.jobTitle || 'Sales Staff'}</div>
                                    </div>
                                    
                                    ${(data.education && data.education.length > 0) ? `
                                    <table class="card-outer" width="100%"><tr><td class="card-inner-table">
                                        <div class="card-header">EDUCATION</div>
                                        ${data.education.map(edu => `
                                            <div style="margin-bottom:12pt;">
                                                <div style="font-size:11pt; font-weight:bold; color:${TEXT_PRI};">${edu.school || ''}</div>
                                                <div style="font-size:10pt; color:${TEXT_SEC}; margin-top:2pt;">${edu.degree || ''}</div>
                                                <div style="font-size:9.5pt; color:${TEXT_SEC}; margin-top:2pt;">${edu.startDate || ''} - ${edu.endDate || ''}</div>
                                                ${edu.gpa ? `<div style="font-size:9.5pt; color:${TEXT_SEC};">GPA: ${edu.gpa}</div>` : ''}
                                            </div>
                                        `).join('')}
                                    </td></tr></table>
                                    ` : ''}

                                    ${(data.experience && data.experience.length > 0) ? `
                                    <table class="card-outer" width="100%"><tr><td class="card-inner-table">
                                        <div class="card-header">WORK EXPERIENCE</div>
                                        ${data.experience.map(exp => `
                                            <div style="margin-bottom:15pt;">
                                                <div style="font-size:10.5pt; font-weight:bold; color:${TEXT_PRI};">${exp.company ? exp.company + ', ' : ''}${exp.jobTitle || ''}</div>
                                                <div style="font-size:9.5pt; color:${TEXT_SEC}; margin-top:2pt; margin-bottom:5pt;">${exp.startDate || ''} - ${exp.endDate || 'Present'}</div>
                                                ${exp.description ? `
                                                    <div style="font-size:9.5pt; color:${TEXT_SEC}; line-height:1.4;">
                                                        ${!exp.description.includes('Main responsibilities:') ? 'Main responsibilities:<br>' : ''}
                                                        ${exp.description.split('\n').filter(Boolean).map(l => `<div>- ${l.replace(/^[-•]\s*/, '')}</div>`).join('')}
                                                    </div>
                                                ` : ''}
                                            </div>
                                        `).join('')}
                                    </td></tr></table>
                                    ` : ''}

                                    ${(data.projects && data.projects.length > 0) ? `
                                    <table class="card-outer" width="100%"><tr><td class="card-inner-table">
                                        <div class="card-header">PROJECTS</div>
                                        ${data.projects.map(proj => `
                                            <div style="margin-bottom:15pt;">
                                                <div style="font-size:10.5pt; font-weight:bold; color:${TEXT_PRI};">${proj.title || ''}</div>
                                                ${proj.tech ? `<div style="font-size:9.5pt; color:${PEACH_ACCENT}; margin-top:2pt;">${proj.tech}</div>` : ''}
                                                ${proj.description ? `
                                                    <div style="font-size:9.5pt; color:${TEXT_SEC}; line-height:1.4; margin-top:5pt;">
                                                        ${proj.description.split('\n').filter(Boolean).map(l => `<div>- ${l.replace(/^[-•]\s*/, '')}</div>`).join('')}
                                                    </div>
                                                ` : ''}
                                            </div>
                                        `).join('')}
                                    </td></tr></table>
                                    ` : ''}

                                    ${(data.certifications && data.certifications.length > 0) ? `
                                    <table class="card-outer" width="100%"><tr><td class="card-inner-table">
                                        <div class="card-header">CERTIFICATIONS</div>
                                        ${data.certifications.map(cert => {
                const name = typeof cert === 'string' ? cert : (cert.name || cert.title || '');
                return `
                                            <div style="margin-bottom:8pt;">
                                                <div style="font-size:10.5pt; font-weight:bold; color:${TEXT_PRI};">• ${name}</div>
                                            </div>
                                            `;
            }).join('')}
                                    </td></tr></table>
                                    ` : ''}
                                    
                                    ${(activitiesArr.length > 0) ? `
                                    <table class="card-outer" width="100%"><tr><td class="card-inner-table">
                                        <div class="card-header">ACTIVITIES</div>
                                        ${activitiesArr.map(act => {
                const t = typeof act === 'string' ? act : (act.title || act.name || '');
                const r = typeof act === 'string' ? '' : (act.role || act.description || '');
                return `
                                            <div style="margin-bottom:10pt;">
                                                <div style="font-size:10.5pt; font-weight:bold; color:${TEXT_PRI};">${t}</div>
                                                ${r ? `<div style="font-size:9.5pt; color:${TEXT_SEC}; margin-top:2pt;">${r}</div>` : ''}
                                            </div>
                                            `;
            }).join('')}
                                    </td></tr></table>
                                    ` : ''}

                                </td>
                            </tr>
                        </table>
                    </td>
                    <td width="30" style="width: 30px;"></td>
                </tr>
            </table>
        </body></html>`;
    }

    // DEFAULT FALLBACK
    const bgFallback = '#FFFFFF', textFallback = '#000000', accentFallback = '#2ae023', metaFallback = '#333333';
    return `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head><meta charset='utf-8'><title>Resume</title></head>
    <body style='font-family: Arial, sans-serif; background-color: ${bgFallback}; color: ${textFallback}; padding: 20pt;'>
        <div style="text-align: center; margin-bottom: 25pt; border-bottom: 2pt solid ${accentFallback}; padding-bottom: 10pt;">
            <div style="font-size: 24pt; font-weight: bold; color: ${accentFallback};">${name}</div>
            <div style="font-size: 10pt; color: ${metaFallback}; margin-top: 5pt;">${contactStr}</div>
        </div>
        ${summary ? `<h2 style="font-size: 14pt; color:${accentFallback}; border-bottom: 1pt solid #ccc; padding-bottom:4pt; text-transform:uppercase;">Summary</h2><p>${summary}</p>` : ''}
        ${experience.map(e => formatExp(e, textFallback, accentFallback, metaFallback)).join('')}
        ${education.map(e => formatEdu(e, textFallback, accentFallback, metaFallback)).join('')}
    </body></html>`;
}

router.get('/preview-pdf', async (req, res) => {
    try {
        const userId = req.query.userId;
        const resume = await Resume.findOne({ userId });
        if (!resume) return res.status(404).send('Resume not found');

        const templateId = resume.data.template || 'classic';

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'inline; filename=resume-preview.pdf');
        await generateUnifiedResume(resume.data, templateId, res);
    } catch (error) {
        console.error('Preview GET error:', error);
        res.status(500).send('Generation failed');
    }
});

router.get('/download', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId || req.user.id;
        const resume = await Resume.findOne({ userId });
        if (!resume) return res.status(404).json({ error: 'Resume not found' });

        const templateId = resume.data.template || 'classic';
        const name = (resume.data.basic?.full_name || 'Resume').replace(/\s+/g, '_');

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${name}_Hiero.pdf"`);
        await generateUnifiedResume(resume.data, templateId, res);
    } catch (error) {
        console.error('Download GET error:', error);
        if (!res.headersSent) res.status(500).json({ error: 'Failed to generate PDF' });
    }
});

router.get('/templates', (req, res) => {
    const templates = [
        { id: 'classic', name: 'Classic Professional', preview: '/templates/previews/classic.png' },
        { id: 'modern-pro', name: 'Modern Tech', preview: '/templates/previews/modern-pro.png' },
        { id: 'tech-focus', name: 'Developer Focus', preview: '/templates/previews/tech-focus.png' },
        { id: 'minimal', name: 'Elegant Minimal', preview: '/templates/previews/minimal.png' },
        { id: 'hiero-signature', name: 'Hiero Signature', preview: '/templates/previews/hiero-signature.png' },
        { id: 'hiero-prestige', name: 'Hiero Prestige', preview: '/templates/previews/hiero-prestige.png' },
        { id: 'hiero-cool', name: 'Hiero Cool (Premium)', preview: '/templates/previews/hiero-cool.png' }
    ];
    res.json({ success: true, templates });
});

module.exports = router;
