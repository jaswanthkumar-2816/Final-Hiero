import Resume from '../models/Resume.js';
import User from '../models/User.js'; // Add this if you have a User model
import { v4 as uuid } from 'uuid';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import winston from 'winston';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt'; // Add for password hashing
import { loadLatexTemplate } from '../utils/latexUtils.js';
import PDFDocument from 'pdfkit';

const execPromise = promisify(exec);

// Lightweight debug helper to safely stringify data without overwhelming logs
function dbg(label, obj) {
  try {
    const slim = JSON.stringify(obj, (k, v) => {
      if (Array.isArray(v)) return `[Array(${v.length})]`;
      if (v && typeof v === 'object') return Object.keys(v);
      return v;
    });
    winston.debug(`DBG ${label}: ${slim}`);
  } catch (_) { }
}

// === Controllers ===

export const login = async (req, res) => {
  const { userId, password } = req.body;
  if (!userId || !password) return res.status(400).json({ success: false, error: 'Missing userId or password' });

  try {
    const user = await User.findOne({ userId }); // Replace with your user schema field
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    const token = jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '1h' });
    winston.info(`Login successful for user ${userId}`);
    res.json({ success: true, token });
  } catch (error) {
    winston.error(`Login error for user ${userId}: ${error.message}`);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

// In-memory storage for demo (replace with MongoDB in production)
export const userResumes = new Map();

export const basic = async (req, res) => {
  const { full_name, contact_info, career_summary = '', website = '' } = req.body;
  if (!req.userId || !full_name || !contact_info?.email || !contact_info?.phone) {
    return res.status(400).json({ success: false, error: 'Missing required fields: full_name, contact_info.email, contact_info.phone' });
  }
  try {
    // Get existing resume or create new one
    let resume = userResumes.get(req.userId) || { userId: req.userId, data: {} };

    // Update basic info
    resume.data.basic = {
      full_name,
      contact_info,
      career_summary,
      website,
    };

    // Save back to storage
    userResumes.set(req.userId, resume);
    dbg('basicSaved', resume.data.basic);
    winston.info(`Basic info saved for user ${req.userId}`);
    res.json({ success: true, message: 'Basic info saved', nextStep: 'education' });
  } catch (error) {
    winston.error(`Basic info save error: userId=${req.userId}, error=${error.message}`);
    res.status(500).json({ success: false, error: 'Failed to save basic info' });
  }
};

export const education = async (req, res) => {
  const { education } = req.body;
  if (!req.userId || !education) {
    return res.status(400).json({ success: false, error: 'Missing required fields' });
  }
  try {
    let resume = userResumes.get(req.userId) || { userId: req.userId, data: {} };
    resume.data.education = education;
    userResumes.set(req.userId, resume);
    dbg('educationSaved', education);
    winston.info(`Education saved for user ${req.userId}`);
    res.json({ success: true, message: 'Education saved', nextStep: 'experience' });
  } catch (error) {
    winston.error(`Education save error: userId=${req.userId}, error=${error.message}`);
    res.status(500).json({ success: false, error: 'Failed to save education' });
  }
};

export const projects = async (req, res) => {
  const { projects } = req.body;
  if (!req.userId) {
    return res.status(400).json({ success: false, error: 'Missing userId' });
  }
  try {
    let resume = userResumes.get(req.userId) || { userId: req.userId, data: {} };
    resume.data.projects = projects;
    userResumes.set(req.userId, resume);
    dbg('projectsSaved', projects);
    winston.info(`Projects saved for user ${req.userId}`);
    res.json({ success: true, message: 'Projects saved', nextStep: 'skills' });
  } catch (error) {
    winston.error(`Projects save error: userId=${req.userId}, error=${error.message}`);
    res.status(500).json({ success: false, error: 'Failed to save projects' });
  }
};

export const skills = async (req, res) => {
  const { skills } = req.body;
  if (!req.userId) {
    return res.status(400).json({ success: false, error: 'Missing userId' });
  }
  try {
    let resume = userResumes.get(req.userId) || { userId: req.userId, data: {} };
    resume.data.skills = skills;
    userResumes.set(req.userId, resume);
    dbg('skillsSaved', skills);
    winston.info(`Skills saved for user ${req.userId}`);
    res.json({ success: true, message: 'Skills saved', nextStep: 'certifications' });
  } catch (error) {
    winston.error(`Skills save error: userId=${req.userId}, error=${error.message}`);
    res.status(500).json({ success: false, error: 'Failed to save skills' });
  }
};

export const certifications = async (req, res) => {
  const { certifications } = req.body;
  if (!req.userId) {
    return res.status(400).json({ success: false, error: 'Missing userId' });
  }
  try {
    let resume = userResumes.get(req.userId) || { userId: req.userId, data: {} };
    resume.data.certifications = certifications;
    userResumes.set(req.userId, resume);
    dbg('certificationsSaved', certifications);
    winston.info(`Certifications saved for user ${req.userId}`);
    res.json({ success: true, message: 'Certifications saved', nextStep: 'achievements' });
  } catch (error) {
    winston.error(`Certifications save error: userId=${req.userId}, error=${error.message}`);
    res.status(500).json({ success: false, error: 'Failed to save certifications' });
  }
};

export const achievements = async (req, res) => {
  const { achievements } = req.body;
  if (!req.userId) {
    return res.status(400).json({ success: false, error: 'Missing userId' });
  }
  try {
    let resume = userResumes.get(req.userId) || { userId: req.userId, data: {} };
    resume.data.achievements = achievements;
    // Automatically set hiero-standard template
    resume.data.template = 'hiero-standard';
    userResumes.set(req.userId, resume);
    dbg('achievementsSaved', achievements);
    winston.info(`Achievements saved and template set for user ${req.userId}`);
    res.json({ success: true, message: 'Achievements saved, ready for preview', nextStep: 'preview' });
  } catch (error) {
    winston.error(`Achievements save error: userId=${req.userId}, error=${error.message}`);
    res.status(500).json({ success: false, error: 'Failed to save achievements' });
  }
};

export const hobbies = async (req, res) => {
  const { hobbies } = req.body;
  if (!req.userId) {
    return res.status(400).json({ success: false, error: 'Missing userId' });
  }
  try {
    let resume = userResumes.get(req.userId) || { userId: req.userId, data: {} };
    resume.data.hobbies = hobbies;
    userResumes.set(req.userId, resume);
    dbg('hobbiesSaved', hobbies);
    winston.info(`Hobbies saved for user ${req.userId}`);
    res.json({ success: true, message: 'Hobbies saved', nextStep: 'personal_details' });
  } catch (error) {
    winston.error(`Hobbies save error: userId=${req.userId}, error=${error.message}`);
    res.status(500).json({ success: false, error: 'Failed to save hobbies' });
  }
};

export const personal_details = async (req, res) => {
  const { personal_details } = req.body;
  if (!req.userId) {
    return res.status(400).json({ success: false, error: 'Missing userId' });
  }
  try {
    let resume = userResumes.get(req.userId) || { userId: req.userId, data: {} };
    resume.data.personal_details = personal_details;
    userResumes.set(req.userId, resume);
    dbg('personalDetailsSaved', personal_details);
    winston.info(`Personal details saved for user ${req.userId}`);
    res.json({ success: true, message: 'Personal details saved', nextStep: 'references' });
  } catch (error) {
    winston.error(`Personal details save error: userId=${req.userId}, error=${error.message}`);
    res.status(500).json({ success: false, error: 'Failed to save personal details' });
  }
};

export const references = async (req, res) => {
  const { references } = req.body;
  if (!req.userId) {
    return res.status(400).json({ success: false, error: 'Missing userId' });
  }
  try {
    let resume = userResumes.get(req.userId) || { userId: req.userId, data: {} };
    resume.data.references = references;
    userResumes.set(req.userId, resume);
    dbg('referencesSaved', references);
    winston.info(`References saved for user ${req.userId}`);
    res.json({ success: true, message: 'References saved', nextStep: 'photo' });
  } catch (error) {
    winston.error(`References save error: userId=${req.userId}, error=${error.message}`);
    res.status(500).json({ success: false, error: 'Failed to save references' });
  }
};

export const photo = async (req, res) => {
  const photoPath = req.file ? req.file.path : null;
  if (!req.userId) {
    return res.status(400).json({ success: false, error: 'Missing userId' });
  }
  try {
    let resume = userResumes.get(req.userId) || { userId: req.userId, data: {} };
    resume.data.photo = photoPath;
    userResumes.set(req.userId, resume);
    dbg('photoSaved', { hasPhoto: !!photoPath });
    winston.info(`Photo uploaded for user ${req.userId}`);
    res.json({ success: true, message: 'Photo uploaded', nextStep: 'template' });
  } catch (error) {
    winston.error(`Photo upload error: userId=${req.userId}, error=${error.message}`);
    res.status(500).json({ success: false, error: 'Failed to upload photo' });
  }
};

export const template = async (req, res) => {
  // Allow template selection, default to hiero-standard
  try {
    const { template: selectedTemplate } = req.body;
    const templateName = selectedTemplate || 'hiero-standard';

    let resume = userResumes.get(req.userId) || { userId: req.userId, data: {} };
    resume.data.template = templateName;
    userResumes.set(req.userId, resume);
    dbg('templateSet', templateName);
    winston.info(`Template '${templateName}' set for user ${req.userId}`);
    res.json({ success: true, message: `Template set to ${templateName}`, template: templateName, nextStep: 'preview' });
  } catch (error) {
    winston.error(`Template setup error: userId=${req.userId}, error=${error.message}`);
    res.status(500).json({ success: false, error: 'Failed to setup template' });
  }
};

export const preview = async (req, res) => {
  try {
    if (!req.userId) return res.status(400).json({ success: false, error: 'Missing userId' });
    const resumeData = userResumes.get(req.userId);
    const preview = {
      template: resumeData?.data?.template || 'Not selected',
      basic: resumeData?.data?.basic || {},
      education: resumeData?.data?.education || [],
      projects: resumeData?.data?.projects || [],
      skills: resumeData?.data?.skills || {},
      certifications: resumeData?.data?.certifications || [],
      achievements: resumeData?.data?.achievements || [],
      hobbies: resumeData?.data?.hobbies || [],
      personal_details: resumeData?.data?.personal_details || {},
      references: resumeData?.data?.references || [],
      photo: resumeData?.data?.photo || ''
    };
    dbg('previewPayload', preview);
    if (resumeData) {
      resumeData.preview = preview;
      userResumes.set(req.userId, resumeData);
    }
    winston.info(`Preview generated for user ${req.userId}`);
    res.json({ success: true, preview });
  } catch (error) {
    winston.error(`Preview generation error: userId=${req.userId}, error=${error.message}`);
    res.status(500).json({ success: false, error: 'Failed to generate preview' });
  }
};

export const generate = async (req, res) => {
  try {
    const resumeData = userResumes.get(req.userId);
    if (!req.userId || !resumeData?.data?.basic?.full_name) {
      return res.status(400).json({ success: false, error: 'Missing userId or full name' });
    }
    dbg('generateResumeDataKeys', Object.keys(resumeData.data));
    dbg('generateSectionsSizes', {
      education: resumeData.data.education?.length || 0,
      projects: resumeData.data.projects?.length || 0,
      certifications: resumeData.data.certifications?.length || 0,
      achievements: resumeData.data.achievements?.length || 0,
      references: resumeData.data.references?.length || 0,
    });
    const fullName = resumeData.data.basic.full_name.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_');
    const timestamp = Date.now();
    const fileName = `resume_${fullName}_${timestamp}.pdf`;
    const filePath = path.join('./temp', fileName);
    const texFile = path.join('./temp', `resume_${fullName}_${timestamp}.tex`);
    const latexTemplate = loadLatexTemplate(resumeData.data.template, resumeData.data);
    fs.writeFileSync(texFile, latexTemplate);
    dbg('latexSnippetStart', latexTemplate.substring(0, 400));
    try {
      await execPromise(`latexmk -pdf -outdir=./temp ${texFile}`, { timeout: 45000 });
      winston.info(`📄 Resume generated for user ${req.userId} using template ${resumeData.data.template}, file: ${fileName}`);
      const tempFiles = fs.readdirSync('./temp').filter(f =>
        f.startsWith(`resume_${fullName}`) && (f.endsWith('.aux') || f.endsWith('.log') || f.endsWith('.out') || f.endsWith('.tex'))
      );
      tempFiles.forEach(f => fs.unlinkSync(path.join('./temp', f)));
      return res.json({ success: true, message: 'Resume generated', file: fileName });
    } catch (latexErr) {
      winston.warn(`latexmk failed, falling back to PDFKit for user ${req.userId}: ${latexErr.message}`);
      // Fallback: minimal PDF via PDFKit
      await new Promise((resolve, reject) => {
        try {
          const doc = new PDFDocument({ size: 'A4', margin: 50 });
          const stream = fs.createWriteStream(filePath);
          stream.on('finish', resolve);
          stream.on('error', reject);
          doc.pipe(stream);
          const basic = resumeData.data.basic || {};
          doc.fontSize(20).text(basic.full_name || 'Resume', { align: 'left' });
          doc.moveDown();
          if (basic.contact_info) {
            doc.fontSize(10).text(`Email: ${basic.contact_info.email || ''}`);
            doc.text(`Phone: ${basic.contact_info.phone || ''}`);
            if (basic.website) doc.text(`Website: ${basic.website}`);
            doc.moveDown();
          }
          if (basic.career_summary) {
            doc.fontSize(12).text('Summary', { underline: true });
            doc.fontSize(10).text(basic.career_summary);
            doc.moveDown();
          }
          const sections = [
            ['Experience', resumeData.data.experience],
            ['Education', resumeData.data.education],
            ['Projects', resumeData.data.projects],
            ['Skills', resumeData.data.skills],
            ['Certifications', resumeData.data.certifications],
            ['Achievements', resumeData.data.achievements],
            ['Hobbies', resumeData.data.hobbies],
            ['References', resumeData.data.references]
          ];
          sections.forEach(([label, content]) => {
            if (!content || (Array.isArray(content) && content.length === 0)) return;
            doc.moveDown(0.5);
            doc.fontSize(12).text(label, { underline: true });
            doc.fontSize(10);
            if (Array.isArray(content)) {
              content.forEach(item => {
                if (typeof item === 'string') {
                  doc.text(`• ${item}`);
                } else {
                  const title = item.jobTitle || item.title || item.degree || item.name || item.institution || 'Entry';
                  const subTitle = item.company || item.organization || item.school || '';
                  const date = item.startDate || item.year || item.gradYear || '';
                  const end = item.endDate || '';
                  const dateRange = (date && end) ? ` (${date} - ${end})` : (date ? ` (${date})` : '');

                  doc.fontSize(10).font('Helvetica-Bold').text(`• ${title}${dateRange}`);
                  if (subTitle) doc.fontSize(9).font('Helvetica-Oblique').text(`  ${subTitle}`);
                  if (item.description) doc.fontSize(9).font('Helvetica').text(`  ${item.description}`);
                  doc.moveDown(0.2);
                }
              });
            } else if (typeof content === 'object') {
              Object.entries(content).forEach(([k, v]) => doc.text(`• ${k}: ${Array.isArray(v) ? v.join(', ') : v}`));
            } else {
              doc.text(String(content));
            }
          });
          doc.end();
        } catch (e) { reject(e); }
      });
      winston.info(`📄 Fallback PDF generated for user ${req.userId}, file: ${fileName}`);
      return res.json({ success: true, message: 'Resume generated (fallback)', file: fileName });
    }
  } catch (error) {
    winston.error(`Resume generation error: userId=${req.userId}, error=${error.message}`);
    if (!res.headersSent) {
      res.status(500).json({ success: false, error: 'Failed to generate resume' });
    }
  }
};

export const download = (req, res) => {
  const fileName = req.query.file;
  const filePath = path.join('./temp', fileName);
  if (fs.existsSync(filePath)) {
    res.download(filePath, fileName, (err) => {
      if (err) winston.error(`Download error: file=${fileName}, error=${err.message}`);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath); // Clean up after download
    });
    winston.info(`Resume downloaded: ${fileName}`);
  } else {
    res.status(404).json({ success: false, error: 'File not found' });
  }
};

// ✅ Preview PDF Route - generates and displays PDF in browser
export const previewPdf = async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    if (authHeader && !req.userId) {
      try {
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.userId = decoded.userId || decoded.id;
      } catch (_) { }
    }
    const userId = req.userId || req.query.userId;
    const { template } = req.query;
    if (!userId) {
      return res.status(400).json({ success: false, error: 'User ID required' });
    }
    const resumeData = userResumes.get(userId);
    if (!resumeData?.data) {
      return res.status(400).json({ success: false, error: 'No resume data found' });
    }
    dbg('previewPdfSectionsSizes', {
      education: resumeData.data.education?.length || 0,
      projects: resumeData.data.projects?.length || 0,
      certifications: resumeData.data.certifications?.length || 0,
      achievements: resumeData.data.achievements?.length || 0,
      references: resumeData.data.references?.length || 0,
    });
    const templateToUse = template || resumeData.data.template || 'professionalcv';
    const fullName = resumeData.data.basic?.full_name?.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_') || 'Preview';
    const timestamp = Date.now();
    const fileName = `preview_${fullName}_${timestamp}.pdf`;
    const filePath = path.join('./temp', fileName);
    const texFile = path.join('./temp', `preview_${fullName}_${timestamp}.tex`);
    const latexTemplate = loadLatexTemplate(templateToUse, resumeData.data);
    fs.writeFileSync(texFile, latexTemplate);
    dbg('previewLatexSnippetStart', latexTemplate.substring(0, 400));
    try {
      await execPromise(`latexmk -pdf -outdir=./temp ${texFile}`, { timeout: 45000 });
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'inline; filename=' + fileName);
      const pdfStream = fs.createReadStream(filePath);
      pdfStream.pipe(res);
      pdfStream.on('close', () => {
        try {
          const prefix = fileName.replace(/\.pdf$/, '');
          const tempFiles = fs.readdirSync('./temp').filter(f =>
            f.startsWith(prefix) && (f.endsWith('.aux') || f.endsWith('.log') || f.endsWith('.out') || f.endsWith('.tex') || f.endsWith('.pdf'))
          );
          tempFiles.forEach(f => {
            try { fs.unlinkSync(path.join('./temp', f)); } catch (_) { }
          });
        } catch (e) {
          console.warn('Failed to clean up temp files:', e.message);
        }
      });
      winston.info(`📄 Preview generated for user ${userId} using template ${templateToUse}`);
    } catch (latexErr) {
      winston.warn(`latexmk preview failed, falling back to PDFKit inline for user ${userId}: ${latexErr.message}`);
      // Stream a minimal PDF inline without writing to disk
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'inline; filename=' + fileName);
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      doc.pipe(res);
      const basic = resumeData.data.basic || {};
      doc.fontSize(20).text(basic.full_name || 'Resume Preview', { align: 'left' });
      doc.moveDown();
      if (basic.contact_info) {
        doc.fontSize(10).text(`Email: ${basic.contact_info.email || ''}`);
        doc.text(`Phone: ${basic.contact_info.phone || ''}`);
        if (basic.website) doc.text(`Website: ${basic.website}`);
        doc.moveDown();
      }
      if (basic.career_summary) {
        doc.fontSize(12).text('Summary', { underline: true });
        doc.fontSize(10).text(basic.career_summary);
        doc.moveDown();
      }
      const sections = [
        ['Experience', resumeData.data.experience],
        ['Education', resumeData.data.education],
        ['Projects', resumeData.data.projects],
        ['Skills', resumeData.data.skills],
        ['Certifications', resumeData.data.certifications],
        ['Achievements', resumeData.data.achievements],
        ['Hobbies', resumeData.data.hobbies],
        ['References', resumeData.data.references]
      ];
      sections.forEach(([label, content]) => {
        if (!content || (Array.isArray(content) && content.length === 0)) return;
        doc.moveDown(0.5);
        doc.fontSize(12).text(label, { underline: true });
        doc.fontSize(10);
        if (Array.isArray(content)) {
          content.forEach(item => {
            if (typeof item === 'string') {
              doc.text(`• ${item}`);
            } else {
              const title = item.jobTitle || item.title || item.degree || item.name || item.institution || 'Entry';
              const subTitle = item.company || item.organization || item.school || '';
              const date = item.startDate || item.year || item.gradYear || '';
              const end = item.endDate || '';
              const dateRange = (date && end) ? ` (${date} - ${end})` : (date ? ` (${date})` : '');

              doc.fontSize(10).font('Helvetica-Bold').text(`• ${title}${dateRange}`);
              if (subTitle) doc.fontSize(9).font('Helvetica-Oblique').text(`  ${subTitle}`);
              if (item.description) doc.fontSize(9).font('Helvetica').text(`  ${item.description}`);
              doc.moveDown(0.2);
            }
          });
        } else if (typeof content === 'object') {
          Object.entries(content).forEach(([k, v]) => doc.text(`• ${k}: ${Array.isArray(v) ? v.join(', ') : v}`));
        } else {
          doc.text(String(content));
        }
      });
      doc.end();
    }
  } catch (error) {
    winston.error(`Preview PDF error: userId=${req.userId || req.query.userId}, error=${error.message}`);
    if (!res.headersSent) {
      res.status(500).json({ success: false, error: 'Failed to generate preview' });
    }
  }
};

// Fast HTML Preview endpoint
export const htmlPreview = async (req, res) => {
  try {
    // Get auth token from header or URL param
    let token = null;
    const authHeader = req.headers['authorization'];
    if (authHeader) {
      token = authHeader.split(' ')[1];
    } else if (req.query.auth) {
      token = req.query.auth;
    }

    if (!token) {
      return res.status(401).send('<html><body><h1>Authentication Required</h1><p>Please login first.</p></body></html>');
    }

    // Verify token and extract userId
    const jwt = await import('jsonwebtoken');
    let userId;
    try {
      const decoded = jwt.default.verify(token, process.env.JWT_SECRET);
      userId = decoded.userId || decoded.id;
    } catch (error) {
      return res.status(401).send('<html><body><h1>Invalid Token</h1><p>Please login again.</p></body></html>');
    }

    const resumeData = userResumes.get(userId);
    if (!resumeData || !resumeData.data.basic?.full_name) {
      return res.status(400).send('<html><body><h1>No Resume Data</h1><p>Please complete basic information first.</p></body></html>');
    }

    const templateId = resumeData.data.template || 'professionalcv';

    // Import HTML generator
    const { generateHTMLPreview } = await import('../utils/htmlGenerator.js');
    const htmlContent = generateHTMLPreview(templateId, resumeData.data);

    // Return HTML content that can be displayed in an iframe or new window
    res.setHeader('Content-Type', 'text/html');
    res.send(htmlContent);

    winston.info(`HTML preview generated for user ${userId} using template ${templateId}`);
  } catch (error) {
    winston.error(`HTML preview error: error=${error.message}`);
    res.status(500).send('<html><body><h1>Error</h1><p>Failed to generate HTML preview</p></body></html>');
  }
};

// Optimized PDF generation with fallback to fast HTML->PDF conversion
export const generateFast = async (req, res) => {
  try {
    const resumeData = userResumes.get(req.userId);
    if (!req.userId || !resumeData?.data?.basic?.full_name) {
      return res.status(400).json({ success: false, error: 'Missing userId or resume data' });
    }

    const fullName = resumeData.data.basic.full_name.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_');
    const timestamp = Date.now();
    const fileName = `resume_${fullName}_${timestamp}.pdf`;
    const filePath = path.join('./temp', fileName);

    // Use template from resumeData or default to hiero-standard
    const selectedTemplate = resumeData.data.template || 'hiero-standard';
    dbg('fastGenerateRequest', { userId: req.userId, template: selectedTemplate });

    try {
      // Try quick LaTeX compilation with reduced timeout
      const texFile = path.join('./temp', `resume_${fullName}_${timestamp}.tex`);
      const latexTemplate = loadLatexTemplate(selectedTemplate, resumeData.data);
      fs.writeFileSync(texFile, latexTemplate);

      // Increased timeout for reliable LaTeX compilation
      await execPromise(`latexmk -pdf -interaction=nonstopmode -outdir=./temp ${texFile}`, { timeout: 30000 });

      // Clean up temp files
      const tempFiles = fs.readdirSync('./temp').filter(f =>
        f.startsWith(`resume_${fullName}`) && (f.endsWith('.aux') || f.endsWith('.log') || f.endsWith('.out') || f.endsWith('.tex'))
      );
      tempFiles.forEach(f => fs.unlinkSync(path.join('./temp', f)));

      winston.info(`📄 Fast resume generated for user ${req.userId} with template ${selectedTemplate}, file: ${fileName}`);
      return res.json({ success: true, message: `Resume generated with ${selectedTemplate} template`, file: fileName, downloadUrl: `/api/resume/download?file=${fileName}` });

    } catch (latexErr) {
      winston.warn(`LaTeX failed, using optimized PDFKit for user ${req.userId}: ${latexErr.message}`);

      // Enhanced PDFKit fallback with better formatting
      await generateEnhancedPDF(resumeData.data, filePath);

      winston.info(`📄 Fast PDFKit resume generated for user ${req.userId}, file: ${fileName}`);
      return res.json({ success: true, message: 'Resume generated (fast)', file: fileName, downloadUrl: `/api/resume/download?file=${fileName}` });
    }

  } catch (error) {
    winston.error(`Fast generation error: userId=${req.userId}, error=${error.message}`);
    res.status(500).json({ success: false, error: 'Failed to generate resume' });
  }
};

async function generateEnhancedPDF(resumeData, filePath) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 50,
        font: 'Helvetica'
      });

      const stream = fs.createWriteStream(filePath);
      stream.on('finish', resolve);
      stream.on('error', reject);
      doc.pipe(stream);

      const basic = resumeData.basic || {};
      const contact = basic.contact_info || {};

      // Header with name and contact
      doc.fontSize(24).font('Helvetica-Bold').text(basic.full_name || 'Resume', { align: 'center' });
      doc.moveDown(0.5);

      // Contact information
      const contactInfo = [];
      if (contact.email) contactInfo.push(contact.email);
      if (contact.phone) contactInfo.push(contact.phone);
      if (contact.address) contactInfo.push(contact.address);
      if (basic.website) contactInfo.push(basic.website);

      if (contactInfo.length > 0) {
        doc.fontSize(10).font('Helvetica').text(contactInfo.join(' | '), { align: 'center' });
        doc.moveDown(0.5);
      }

      // Add a line separator
      doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
      doc.moveDown(0.5);

      // Career Summary
      if (basic.career_summary) {
        addSection(doc, 'PROFESSIONAL SUMMARY', basic.career_summary);
      }

      // Experience
      if (resumeData.experience && resumeData.experience.length > 0) {
        addSection(doc, 'WORK EXPERIENCE');
        resumeData.experience.forEach(exp => {
          doc.fontSize(11).font('Helvetica-Bold').text(exp.jobTitle || exp.title || '', { continued: true });
          if (exp.startDate || exp.endDate) {
            doc.font('Helvetica').text(` (${exp.startDate || ''} - ${exp.endDate || 'Present'})`, { align: 'right' });
          } else {
            doc.text('');
          }
          if (exp.company || exp.organization) {
            doc.fontSize(10).font('Helvetica-Oblique').text(exp.company || exp.organization);
          }
          if (exp.description) {
            doc.fontSize(10).font('Helvetica').text(exp.description);
          }
          doc.moveDown(0.3);
        });
      }

      // Education
      if (resumeData.education && resumeData.education.length > 0) {
        addSection(doc, 'EDUCATION');
        resumeData.education.forEach(edu => {
          doc.fontSize(11).font('Helvetica-Bold').text(edu.degree || edu.title || '', { continued: true });
          if (edu.year) doc.font('Helvetica').text(` (${edu.year})`, { align: 'right' });
          else doc.text('');
          if (edu.institution) {
            doc.fontSize(10).font('Helvetica-Oblique').text(edu.institution);
          }
          if (edu.gpa) {
            doc.fontSize(9).font('Helvetica').text(`GPA: ${edu.gpa}`);
          }
          doc.moveDown(0.3);
        });
      }

      // Projects
      if (resumeData.projects && resumeData.projects.length > 0) {
        addSection(doc, 'PROJECTS');
        resumeData.projects.forEach(project => {
          doc.fontSize(11).font('Helvetica-Bold').text(project.name || project.title || '', { continued: true });
          if (project.year) doc.font('Helvetica').text(` (${project.year})`, { align: 'right' });
          else doc.text('');
          if (project.description) {
            doc.fontSize(10).font('Helvetica').text(project.description);
          }
          if (project.technologies) {
            doc.fontSize(9).font('Helvetica-Oblique').text(`Technologies: ${project.technologies}`);
          }
          doc.moveDown(0.3);
        });
      }

      // Skills
      if (resumeData.skills || resumeData.technicalSkills || resumeData.softSkills) {
        addSection(doc, 'SKILLS');

        // Handle technical skills (object or array/string)
        let techText = '';
        if (resumeData.skills && typeof resumeData.skills === 'object' && !Array.isArray(resumeData.skills)) {
          if (resumeData.skills.technical && resumeData.skills.technical.length > 0) {
            techText = Array.isArray(resumeData.skills.technical) ? resumeData.skills.technical.join(', ') : resumeData.skills.technical;
          }
        } else {
          const s = resumeData.technicalSkills || resumeData.skills;
          techText = Array.isArray(s) ? s.join(', ') : (s || '');
        }

        if (techText) {
          doc.fontSize(10).font('Helvetica-Bold').text('Technical Skills: ', { continued: true });
          doc.font('Helvetica').text(techText);
        }

        // Handle soft skills
        let softText = '';
        if (resumeData.skills && typeof resumeData.skills === 'object' && !Array.isArray(resumeData.skills)) {
          if (resumeData.skills.management && resumeData.skills.management.length > 0) {
            softText = Array.isArray(resumeData.skills.management) ? resumeData.skills.management.join(', ') : resumeData.skills.management;
          }
        }

        if (!softText && resumeData.softSkills) {
          softText = Array.isArray(resumeData.softSkills) ? resumeData.softSkills.join(', ') : resumeData.softSkills;
        }

        if (softText) {
          doc.fontSize(10).font('Helvetica-Bold').text('Professional Skills: ', { continued: true });
          doc.font('Helvetica').text(softText);
        }
      }

      // Other sections
      const sections = [
        ['CERTIFICATIONS', resumeData.certifications],
        ['ACHIEVEMENTS', resumeData.achievements],
        ['REFERENCES', resumeData.references]
      ];

      sections.forEach(([title, items]) => {
        if (items && Array.isArray(items) && items.length > 0) {
          addSection(doc, title);
          items.forEach(item => {
            const name = item.name || item.title || item.degree || item;
            const details = [];
            if (item.issuer || item.provider) details.push(item.issuer || item.provider);
            if (item.year || item.date) details.push(item.year || item.date);
            if (item.relationship) details.push(item.relationship);
            if (item.contact) details.push(item.contact);

            doc.fontSize(10).font('Helvetica').text(`• ${name}${details.length > 0 ? ` - ${details.join(', ')}` : ''}`);
          });
          doc.moveDown(0.3);
        }
      });

      doc.end();

    } catch (e) {
      reject(e);
    }
  });
}

function addSection(doc, title, content = null) {
  doc.moveDown(0.5);
  doc.fontSize(12).font('Helvetica-Bold').text(title);
  doc.moveTo(50, doc.y + 2).lineTo(200, doc.y + 2).stroke();
  doc.moveDown(0.3);

  if (content) {
    doc.fontSize(10).font('Helvetica').text(content);
    doc.moveDown(0.3);
  }
}

// New experience controller
export const experience = async (req, res) => {
  const { experience } = req.body;
  if (!req.userId) {
    return res.status(400).json({ success: false, error: 'Missing userId' });
  }
  try {
    let resume = userResumes.get(req.userId) || { userId: req.userId, data: {} };
    resume.data.experience = experience;
    userResumes.set(req.userId, resume);
    dbg('experienceSaved', experience);
    winston.info(`Experience saved for user ${req.userId}`);
    res.json({ success: true, message: 'Experience saved', nextStep: 'projects' });
  } catch (error) {
    winston.error(`Experience save error: userId=${req.userId}, error=${error.message}`);
    res.status(500).json({ success: false, error: 'Failed to save experience' });
  }
};

