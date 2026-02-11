import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import path from 'path';
import fs from 'fs';
import winston from 'winston';
import multer from 'multer';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import resumeRoutes from './routes/resumeRoutes.js';
import analysisRoutes from './routes/analysisRoutes.js';
import reviewRoutes from './routes/reviewRoutes.js';
import { generateTemplateHTML } from './templates/index.js';
import pdfParse from 'pdf-parse';
dotenv.config();

console.log('MONGODB_URI from env:', process.env.MONGODB_URI);

// Ensure a JWT secret exists in non-production to avoid auth failures in dev
if (!process.env.JWT_SECRET && process.env.NODE_ENV !== 'production') {
  process.env.JWT_SECRET = 'dev-secret-change-me';
  console.warn('[WARN] JWT_SECRET was not set. Using a dev fallback secret.');
}

// Fix for __dirname in ES module scope
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Logger setup
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console()
  ]
});

// Initialize Express app
const app = express();

// ========== CORS CONFIGURATION ==========
const allowedOrigins = [
  'https://hiero-gateway.onrender.com',
  'https://www.hiero-gateway.onrender.com',
  'https://hiero.in',
  'https://www.hiero.in',
  'http://localhost:3000',
  'http://localhost:5173',
  'http://localhost:4173',
  'http://localhost:8080',
  'http://127.0.0.1:5500', // VS Code Live Server default
  'http://127.0.0.1:5501',
  'http://127.0.0.1:5502',
  'http://127.0.0.1:5503',
  'http://127.0.0.1:5504',  // Allow local testing on port 5504 (your current origin)
  'http://localhost:8000',
  'http://127.0.0.1:8000'
];

app.use(cors({
  origin: '*', // Allow ABSOLUTELY EVERYTHING
  methods: ['GET', 'POST', 'OPTIONS', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  credentials: false // Must be false when origin is *
}));

console.log('🔓 CORS is now OPEN for ALL origins (*)');

app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

// Simple health check endpoint to keep Render and UptimeRobot happy
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'hiero-resume-backend' });
});

// Multer for file uploads - Use /tmp to avoid triggering nodemon/live-server reloads
const upload = multer({ dest: '/tmp' });

// Helper function to normalize data from frontend
function normalizeResumeData(data) {
  const normalized = { ...data };

  // Convert string fields to arrays if needed
  const arrayFields = ['skills', 'certifications', 'languages', 'achievements', 'hobbies'];

  arrayFields.forEach(field => {
    if (normalized[field]) {
      if (typeof normalized[field] === 'string') {
        // Split by newlines or commas
        normalized[field] = normalized[field]
          .split(/[\n,]/)
          .map(item => item.trim())
          .filter(item => item.length > 0);
      }
    } else {
      normalized[field] = [];
    }
  });

  // Ensure technicalSkills and softSkills are also converted
  if (normalized.technicalSkills && typeof normalized.technicalSkills === 'string') {
    normalized.skills = normalized.skills || [];
    const techSkills = normalized.technicalSkills.split(/[\n,]/).map(s => s.trim()).filter(s => s);
    normalized.skills = [...normalized.skills, ...techSkills];
  }

  if (normalized.softSkills && typeof normalized.softSkills === 'string') {
    normalized.skills = normalized.skills || [];
    const softSkills = normalized.softSkills.split(/[\n,]/).map(s => s.trim()).filter(s => s);
    normalized.skills = [...normalized.skills, ...softSkills];
  }

  return normalized;
}

// ✨ Helper: Extract text from PDF file
async function extractTextFromPdf(filePath) {
  try {
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdfParse(dataBuffer);
    const text = data.text || '';

    // Check if we got meaningful text
    if (!text.trim()) {
      logger.warn('⚠️ PDF appears to be empty or image-based (no extractable text)');
      return '';
    }

    logger.info(`✅ Extracted ${text.length} chars from PDF`);
    return text;
  } catch (error) {
    logger.error('PDF extraction error:', error);
    return ''; // Return empty string instead of throwing, let caller decide
  }
}

import axios from 'axios';

// ✨ Helper: Parse resume text with LLM for perfect extraction
async function mapResumeToFormFields(rawText) {
  if (!rawText || rawText.trim().length === 0) {
    throw new Error('No text extracted from resume');
  }

  // 1. Try LLM Extraction first (if API key exists)
  if (process.env.OPENROUTER_API_KEY) {
    try {
      console.log('🤖 Using LLM for perfect resume extraction...');
      const systemPrompt = `You are an expert resume parser. Your job is to extract data from the resume text and return it in a strict JSON format.
      
      Output JSON structure MUST match this exactly:
      {
        "personalInfo": { 
          "fullName": "string", 
          "email": "string", 
          "phone": "string", 
          "address": "string", 
          "linkedin": "string", 
          "website": "string" 
        },
        "summary": "string",
        "technicalSkills": "string (comma separated)",
        "softSkills": "string (comma separated)",
        "experience": [ 
          { "jobTitle": "string", "company": "string", "startDate": "YYYY-MM", "endDate": "YYYY-MM", "description": "string (bullet points)" } 
        ],
        "education": [ 
          { "degree": "string", "school": "string", "gradYear": "YYYY", "gpa": "string" } 
        ],
        "projects": [ 
          { "name": "string", "tech": "string", "description": "string", "link": "string", "achievement": "string", "duration": "string" } 
        ],
        "certifications": ["string"],
        "languages": ["string"],
        "achievements": "string (multiline string)",
        "hobbies": "string (comma separated)",
        "references": [
          { "name": "string", "title": "string", "company": "string", "phone": "string", "email": "string" }
        ],
        "customSections": [
          { "title": "string", "items": ["string"] }
        ]
      }

      Rules:
      1. **Experience & Education are CRITICAL.** Look for "Work History", "Employment", "Professional Experience", "Academic Background".
      2. **Dates:** MUST be in YYYY-MM format for Experience (e.g. "2023-05"). If only year is known, use "2023-01". For "Present", use "Present" (frontend handles it).
      3. **References:** Extract Title, Company, Phone, Email if available.
      4. **Projects:** Extract Duration (e.g. "3 months" or "2023") and Key Achievements.
      5. **LinkedIn:** Extract full URL.
      6. **Portfolio/Website:** Extract full URL.
      `;

      const { data } = await axios.post(
        'https://openrouter.ai/api/v1/chat/completions',
        {
          model: 'openai/gpt-3.5-turbo',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `Extract data from this resume:\n\n${rawText.slice(0, 14000)}` }
          ],
          temperature: 0.1,
          response_format: { type: "json_object" }
        },
        {
          headers: {
            'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'http://localhost:5003',
            'X-Title': 'Hiero Resume Parser'
          }
        }
      );

      const content = data.choices[0].message.content;
      console.log('🔍 LLM Raw Output:', content.slice(0, 200) + '...'); // Log start of output
      const parsedData = JSON.parse(content);
      console.log('✅ LLM Extraction Successful. Experience entries:', parsedData.experience?.length, 'Education entries:', parsedData.education?.length);
      return parsedData;

    } catch (llmError) {
      console.error('⚠️ LLM Extraction failed, falling back to Regex:', llmError.message);
      // Fall through to regex logic below
    }
  }

  // 2. Fallback to Regex Logic (Original Implementation)
  try {
    const lines = rawText.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    const lowerText = rawText.toLowerCase();

    // Initialize structured data
    const structuredData = {
      personalInfo: {
        fullName: '',
        email: '',
        phone: '',
        address: '',
        linkedin: '',
        github: '',
        website: ''
      },
      summary: '',
      technicalSkills: '',
      softSkills: '',
      experience: [],
      education: [],
      skills: [],
      certifications: [],
      projects: [],
      languages: [],
      achievements: [],
      hobbies: [],
      references: [],
      customSections: [],
      customDetails: []
    };

    // === PERSONAL INFO EXTRACTION ===

    // Extract email
    const emailMatch = rawText.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
    if (emailMatch) structuredData.personalInfo.email = emailMatch[1];

    // Extract phone
    const phoneMatch = rawText.match(/(\+\d{1,3}[\s-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/) || rawText.match(/\d{10}/);
    if (phoneMatch) structuredData.personalInfo.phone = phoneMatch[0];

    // Extract LinkedIn
    const linkedinMatch = rawText.match(/linkedin\.com\/in\/[\w-]+|linkedin\.com\/[\w-]+/i);
    if (linkedinMatch) structuredData.personalInfo.linkedin = linkedinMatch[0];

    // Extract Website/Portfolio (excluding linkedin/github)
    const websiteMatch = rawText.match(/(https?:\/\/)?(www\.)?[\w-]+\.(com|org|net|io|me|dev)(\/[\w-]+)*/i);
    if (websiteMatch && !websiteMatch[0].includes('linkedin') && !websiteMatch[0].includes('github') && !websiteMatch[0].includes('gmail')) {
      structuredData.personalInfo.website = websiteMatch[0];
    }

    // Extract Address (simple heuristic: look for zip codes or city/state patterns near top)
    const addressMatch = rawText.slice(0, 1000).match(/\d+\s+[\w\s,]+(?:Street|St|Avenue|Ave|Road|Rd|Blvd|Lane|Ln|Drive|Dr)\.?|[\w\s,]+[A-Z]{2}\s+\d{5}/i);
    if (addressMatch) structuredData.personalInfo.address = addressMatch[0].trim();

    // === SECTION TEXT EXTRACTION ===
    const sections = {
      education: ['Education', 'Academic Background', 'Qualifications'],
      experience: ['Experience', 'Work History', 'Employment', 'Professional Experience'],
      skills: ['Skills', 'Technical Skills', 'Core Competencies', 'Expertise'],
      softSkills: ['Soft Skills', 'Interpersonal Skills', 'Strengths', 'Personal Skills'],
      projects: ['Projects', 'Key Projects', 'Personal Projects'],
      languages: ['Languages', 'Language Skills'],
      certifications: ['Certifications', 'Licenses', 'Courses']
    };

    // Helper to find section content
    const findSectionContent = (keywords) => {
      const lowerRaw = rawText.toLowerCase();
      let startIndex = -1;

      for (const k of keywords) {
        const idx = lowerRaw.indexOf(k.toLowerCase());
        if (idx !== -1) {
          startIndex = idx + k.length;
          break;
        }
      }

      if (startIndex === -1) return null;

      // Find the next section start to restrict content
      let minNextIndex = rawText.length;
      Object.values(sections).flat().forEach(k => {
        const idx = lowerRaw.indexOf(k.toLowerCase(), startIndex + 50); // +50 to separate current header from next
        if (idx !== -1 && idx < minNextIndex) minNextIndex = idx;
      });

      return rawText.slice(startIndex, minNextIndex).trim();
    };

    // Parse Sections

    // Skills
    const skillsText = findSectionContent(sections.skills);
    if (skillsText) {
      structuredData.skills = skillsText.split(/[\n,•●]/).map(s => s.trim()).filter(s => s.length > 2 && s.length < 30);
      structuredData.technicalSkills = structuredData.skills.join(', ');
    }

    // Soft Skills
    const softSkillsText = findSectionContent(sections.softSkills);
    if (softSkillsText) {
      structuredData.softSkills = softSkillsText.split(/[\n,•●]/).map(s => s.trim()).filter(s => s.length > 2 && s.length < 50).join(', ');
    }

    // Languages
    const languagesText = findSectionContent(sections.languages);
    if (languagesText) {
      structuredData.languages = languagesText.split(/[\n,•●]/).map(s => s.trim()).filter(s => s.length > 2 && s.length < 20);
    }

    // Experience (Basic line parsing)
    const expText = findSectionContent(sections.experience);
    if (expText) {
      // Very basic parser: assumes job title or company might be at start of blocks. 
      // Realistically regex parsing of experience is very hard without LLM.
      // We will just put the whole blob as one entry description if we can't parse it well.
      structuredData.experience.push({
        jobTitle: "Extracted Experience",
        company: "See Description",
        startDate: "",
        endDate: "",
        description: expText.slice(0, 500) // Limit length
      });
    }

    // Education
    const eduText = findSectionContent(sections.education);
    if (eduText) {
      structuredData.education.push({
        degree: "Extracted Education",
        school: eduText.split('\n')[0] || "University",
        gradYear: "",
        gpa: ""
      });
    }

    // Extract name (improved logic - first substantial line without special chars)
    const firstLines = lines.slice(0, 8);
    for (const line of firstLines) {
      if (line.length >= 4 && line.length < 60 &&
        !line.includes('@') &&
        !line.match(/\d{3}[\s.-]?\d{3}[\s.-]?\d{4}/) &&
        !lowerText.includes('resume') &&
        !line.match(/^\d+$/) &&
        /^[a-zA-Z\s\.,'-]+$/.test(line) &&
        line.split(' ').length >= 2) {  // At least 2 words (first + last name)
        structuredData.personalInfo.fullName = line;
        break;
      }
    }

    // Extract address/location (look for city/state patterns)
    const locationMatch = rawText.match(/([A-Z][a-z]+,\s*[A-Z]{2})|([A-Z][a-z]+\s*\d{5})/);
    if (locationMatch) {
      structuredData.personalInfo.address = locationMatch[0];
    }

    // === SECTION EXTRACTION ===
    const experienceSection = extractSection(rawText, ['experience', 'work experience', 'work history', 'employment', 'professional experience']);
    const educationSection = extractSection(rawText, ['education', 'academic background', 'qualifications', 'academic']);
    const skillsSection = extractSection(rawText, ['skills', 'technical skills', 'core competencies', 'expertise', 'technologies']);
    const projectsSection = extractSection(rawText, ['projects', 'personal projects', 'key projects', 'portfolio']);
    const certificationsSection = extractSection(rawText, ['certifications', 'certificates', 'licenses', 'credentials']);
    const achievementsSection = extractSection(rawText, ['achievements', 'accomplishments', 'awards', 'honors']);

    // === SKILLS PARSING (improved) ===
    if (skillsSection) {
      // Split by common delimiters
      const skillLines = skillsSection.split(/[,;\n•\-\*\|]/)
        .map(s => s.trim())
        .filter(s => s.length > 1 && s.length < 50)
        .filter(s => !s.match(/^\d+$/));  // Remove pure numbers

      structuredData.skills = [...new Set(skillLines)].slice(0, 30); // Remove duplicates, limit to 30
    }

    // === EXPERIENCE PARSING (improved with date extraction) ===
    if (experienceSection) {
      const expLines = experienceSection.split('\n').filter(l => l.trim().length > 0);
      let currentExp = null;
      const datePattern = /(\d{4}|\w+\s+\d{4})\s*[-–—]\s*(\d{4}|\w+\s+\d{4}|present|current)/i;

      for (let i = 0; i < expLines.length; i++) {
        const line = expLines[i].trim();

        // Detect dates in the line
        const dateMatch = line.match(datePattern);

        // New job entry (typically bold/capitalized title)
        if (line.length > 5 && line.length < 120 &&
          (line === line.toUpperCase() || line.match(/^[A-Z][a-z\s]+/) || dateMatch)) {

          // Save previous experience
          if (currentExp && (currentExp.jobTitle || currentExp.company)) {
            structuredData.experience.push(currentExp);
          }

          currentExp = {
            jobTitle: dateMatch ? line.replace(datePattern, '').trim() : line,
            company: '',
            location: '',
            startDate: dateMatch ? dateMatch[1] : '',
            endDate: dateMatch ? dateMatch[2] : '',
            description: ''
          };

          // Next line might be company name
          if (i + 1 < expLines.length && !expLines[i + 1].startsWith('•') && !expLines[i + 1].startsWith('-')) {
            const nextLine = expLines[i + 1].trim();
            if (nextLine.length < 100 && !nextLine.match(datePattern)) {
              currentExp.company = nextLine;
              i++; // Skip next line
            }
          }
        }
        // Description (bullet points or paragraphs)
        else if (currentExp && line.length > 10) {
          const cleanLine = line.replace(/^[•\-\*]\s*/, ''); // Remove bullet points
          currentExp.description += (currentExp.description ? '\n• ' : '• ') + cleanLine;
        }
      }

      // Add last experience
      if (currentExp && (currentExp.jobTitle || currentExp.company)) {
        structuredData.experience.push(currentExp);
      }
    }

    // === EDUCATION PARSING (improved) ===
    if (educationSection) {
      const eduLines = educationSection.split('\n').filter(l => l.trim().length > 0);
      let currentEdu = null;
      const yearPattern = /\d{4}/g;
      const gpaPattern = /GPA:\s*(\d+\.?\d*)|(\d+\.?\d*)\s*GPA/i;

      for (let i = 0; i < eduLines.length; i++) {
        const line = eduLines[i].trim();

        // Check if line looks like a degree
        if (line.length > 5 && line.length < 150 &&
          (line.match(/bachelor|master|phd|b\.?s\.?|m\.?s\.?|b\.?tech|m\.?tech|degree/i) ||
            line.match(/\d{4}/))) {

          // Save previous education
          if (currentEdu && (currentEdu.degree || currentEdu.institution)) {
            structuredData.education.push(currentEdu);
          }

          currentEdu = {
            degree: line,
            institution: '',
            location: '',
            startDate: '',
            endDate: '',
            grade: ''
          };

          // Extract years
          const years = line.match(yearPattern);
          if (years) {
            currentEdu.startDate = years[0] || '';
            currentEdu.endDate = years[years.length - 1] || '';
          }

          // Extract GPA
          const gpaMatch = line.match(gpaPattern);
          if (gpaMatch) {
            currentEdu.grade = gpaMatch[1] || gpaMatch[2];
          }

          // Next line might be institution
          if (i + 1 < eduLines.length) {
            const nextLine = eduLines[i + 1].trim();
            if (nextLine.length > 5 && nextLine.length < 100 && !nextLine.match(/\d{4}.*\d{4}/)) {
              currentEdu.institution = nextLine;
              i++; // Skip next line
            }
          }
        }
      }

      // Add last education
      if (currentEdu && (currentEdu.degree || currentEdu.institution)) {
        structuredData.education.push(currentEdu);
      }
    }

    // === PROJECTS PARSING (improved) ===
    if (projectsSection) {
      const projectLines = projectsSection.split('\n').filter(l => l.trim().length > 0);
      let currentProject = null;

      for (const line of projectLines) {
        const trimmed = line.trim();

        // Project title (typically not a bullet point)
        if (trimmed.length > 5 && trimmed.length < 120 &&
          !trimmed.startsWith('•') && !trimmed.startsWith('-') && !trimmed.startsWith('*')) {

          // Save previous project
          if (currentProject && currentProject.title) {
            structuredData.projects.push(currentProject);
          }

          currentProject = {
            title: trimmed,
            description: '',
            technologies: []
          };
        }
        // Description or tech stack
        else if (currentProject && trimmed.length > 10) {
          const cleanLine = trimmed.replace(/^[•\-\*]\s*/, '');

          // Check if it's a tech stack line
          if (cleanLine.toLowerCase().includes('tech') || cleanLine.toLowerCase().includes('stack:')) {
            const techs = cleanLine.split(/[,;]/).map(t => t.trim()).filter(t => t.length > 1);
            currentProject.technologies = techs;
          } else {
            currentProject.description += (currentProject.description ? '\n' : '') + cleanLine;
          }
        }
      }

      // Add last project
      if (currentProject && currentProject.title) {
        structuredData.projects.push(currentProject);
      }
    }

    // Projects (Improved Extraction)
    const projectsText = findSectionContent(sections.projects);
    if (projectsText) {
      // heuristic: look for lines that look like titles (short, bold-ish) or split by double newlines
      // simple approach: split by double newline
      const projBlocks = projectsText.split(/\n\s*\n/);
      projBlocks.forEach(block => {
        const lines = block.split('\n').map(l => l.trim()).filter(l => l);
        if (lines.length > 0) {
          structuredData.projects.push({
            name: lines[0], // assume first line is title
            tech: "", // hard to extract specific tech without LLM
            description: lines.slice(1).join('\n'), // rest is description
            link: "",
            achievement: "",
            duration: ""
          });
        }
      });
    }

    // References (Improved Extraction)
    const refText = findSectionContent(['References', 'Referees']);
    if (refText) {
      // heuristic: try to find blocks of 2-4 lines
      const refBlocks = refText.split(/\n\s*\n/);
      refBlocks.forEach(block => {
        const lines = block.split('\n').map(l => l.trim()).filter(l => l);
        if (lines.length >= 2) {
          // try to find email/phone
          const email = lines.find(l => l.includes('@'));
          const phone = lines.find(l => l.match(/\d{10}|\+?\d[\d\s-]{8,}/));

          structuredData.references.push({
            name: lines[0],
            title: lines[1] || "Reference",
            company: lines.length > 2 && lines[2] !== email && lines[2] !== phone ? lines[2] : "",
            email: email || "",
            phone: phone || ""
          });
        }
      });
    }

    // Custom/Other Sections
    // Identify headers that were NOT matched by standard keys
    // This is complex in regex only, so we'll do a simple "Additional Info" catch-all if we can
    const additionalText = findSectionContent(['Additional Information', 'Volunteering', 'Publications', 'Awards']);
    if (additionalText) {
      structuredData.customSections = [{
        title: "Additional Information",
        items: [additionalText.trim()]
      }];
      // Also map to customDetails for the frontend
      structuredData.customDetails = [{
        heading: "Additional Information",
        content: additionalText.trim()
      }];
    }

    // Check if we didn't find *any* experience but have a "Work" section that failed keyword match
    if (structuredData.experience.length === 0) {
      // fallback catch-all
    }

    // === LOG EXTRACTION RESULTS ===
    logger.info('📊 Extraction summary:', {
      name: structuredData.personalInfo.fullName || 'Not found',
      email: structuredData.personalInfo.email || 'Not found',
      phone: structuredData.personalInfo.phone || 'Not found',
      experience: structuredData.experience.length + ' entries',
      education: structuredData.education.length + ' entries',
      skills: structuredData.skills.length + ' skills',
      projects: structuredData.projects.length + ' projects',
      references: structuredData.references.length + ' references'
    });

    return structuredData;

  } catch (error) {
    logger.error('Resume parsing error:', error);
    throw new Error('Failed to parse resume: ' + error.message);
  }
}

// Helper function to extract text sections
function extractSection(text, keywords) {
  const lowerText = text.toLowerCase();
  const lines = text.split('\n');

  for (const keyword of keywords) {
    const headerIndex = lowerText.indexOf(keyword);
    if (headerIndex !== -1) {
      // Find the line number
      let currentPos = 0;
      let startLine = 0;

      for (let i = 0; i < lines.length; i++) {
        currentPos += lines[i].length + 1; // +1 for newline
        if (currentPos > headerIndex) {
          startLine = i + 1;
          break;
        }
      }

      // Find next section (any other common header)
      const nextSectionKeywords = ['experience', 'education', 'skills', 'projects', 'certifications', 'achievements', 'languages', 'hobbies', 'references', 'interests'];
      let endLine = lines.length;

      for (let i = startLine; i < lines.length; i++) {
        const line = lines[i].toLowerCase();
        for (const nextKeyword of nextSectionKeywords) {
          if (line.includes(nextKeyword) && !keywords.includes(nextKeyword)) {
            endLine = i;
            break;
          }
        }
        if (endLine < lines.length) break;
      }

      return lines.slice(startLine, endLine).join('\n');
    }
  }

  return null;
}

// Disable caching for API responses
app.use((req, res, next) => {
  res.set({
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
    'Surrogate-Control': 'no-store'
  });
  next();
});

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
// Serve template preview images under /templates/previews
app.use('/templates/previews', express.static(path.join(__dirname, 'templates', 'previews')));


// Test endpoint to verify backend is accessible
app.get('/api/test', (req, res) => {
  res.json({
    message: 'Backend is working!',
    timestamp: new Date().toISOString()
  });
});

// Simple in-memory user storage for testing (replace with MongoDB in production)
const users = new Map();

// Authentication endpoints
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, password, and name are required' });
    }

    if (users.has(email)) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = Date.now().toString();

    users.set(email, {
      id: userId,
      email,
      password: hashedPassword,
      name,
      createdAt: new Date()
    });

    const token = jwt.sign({ userId, email }, process.env.JWT_SECRET, { expiresIn: '24h' });

    res.json({
      success: true,
      token,
      user: { id: userId, email, name }
    });
  } catch (error) {
    logger.error('Signup error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = users.get(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ userId: user.id, email }, process.env.JWT_SECRET, { expiresIn: '24h' });

    res.json({
      success: true,
      token,
      user: { id: user.id, email: user.email, name: user.name }
    });
  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create demo user for testing
app.post('/api/auth/demo', (req, res) => {
  const demoUser = {
    id: 'demo-user',
    email: 'demo@example.com',
    name: 'Demo User'
  };

  const token = jwt.sign({ userId: demoUser.id, email: demoUser.email }, process.env.JWT_SECRET, { expiresIn: '24h' });

  res.json({
    success: true,
    token,
    user: demoUser
  });
});

// API Routes
app.use('/api/resume', resumeRoutes);
app.use('/api/analysis', analysisRoutes);
app.use('/api', reviewRoutes);  // Review and Admin routes

// ✨ NEW ENDPOINT: Resume Import (upload old resume → auto-fill form)
app.post('/api/resume/import', upload.single('resume'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No resume file uploaded' });
    }

    logger.info(`📄 Resume import started: ${req.file.originalname} (${req.file.mimetype})`);
    const filePath = req.file.path;

    try {
      let rawText = '';
      const mime = req.file.mimetype || '';
      const ext = (req.file.originalname || '').toLowerCase();

      // Prefer mimetype, fallback to extension
      if (mime.includes('pdf') || ext.endsWith('.pdf')) {
        logger.info('🔍 Extracting text from PDF...');
        rawText = await extractTextFromPdf(filePath);
      } else if (mime.includes('word') || mime.includes('msword') || mime.includes('officedocument') || ext.endsWith('.docx') || ext.endsWith('.doc')) {
        logger.info('🔍 Extracting text from DOC/DOCX...');

        // Explicit check for .doc (binary Word 97-2003) which mammoth does NOT support
        if (ext.endsWith('.doc') && !ext.endsWith('.docx')) {
          throw new Error('Old Word format (.doc) is not supported. Please save as .docx or PDF and try again.');
        }

        try {
          // Lazy import mammoth to keep startup fast
          const mammoth = (await import('mammoth')).default;
          const result = await mammoth.extractRawText({ path: filePath });
          rawText = result.value || '';
        } catch (docErr) {
          logger.warn('DOCX extraction failed:', docErr.message);
          throw new Error('Failed to read DOCX file. Please check if it is corrupted.');
        }
      } else if (mime.startsWith('image/') || ext.match(/\.(png|jpg|jpeg|bmp|tiff)$/)) {
        logger.info('🔍 Running OCR on image...');
        try {
          const { createWorker } = await import('tesseract.js');
          const worker = await createWorker();
          await worker.loadLanguage('eng');
          await worker.initialize('eng');
          const { data: { text } } = await worker.recognize(filePath);
          rawText = text || '';
          await worker.terminate();
        } catch (ocrErr) {
          logger.error('OCR error:', ocrErr);
          throw new Error('Failed to run OCR on image');
        }
      } else {
        logger.info('ℹ️ Unknown file type, attempting binary read and LLM parse');
        try {
          rawText = fs.readFileSync(filePath, 'utf8');
        } catch { }
      }

      if (!rawText || rawText.trim().length === 0) {
        logger.warn('⚠️ No text extracted from file');
        return res.status(400).json({
          error: 'Unable to extract text from this resume file.',
          details: 'This may be because:\n• The PDF is scanned/image-based (no selectable text)\n• The file is corrupted or password-protected\n• The file format is not supported\n\nPlease try:\n• Converting the PDF to a text-based format\n• Uploading a different version of your resume\n• Or manually fill the form instead',
          tip: 'Click "No, I\'ll Fill It Manually" to enter your information directly.'
        });
      }

      logger.info(`✅ Extracted ${rawText.length} characters from input`);

      // 2. Parse with LLM
      logger.info('🤖 Parsing resume with LLM...');
      const structuredData = await mapResumeToFormFields(rawText);
      logger.info('✅ LLM parsing complete');

      // 3. Normalize the data
      const normalized = normalizeResumeData(structuredData);
      logger.info('✅ Data normalized');

      // 4. Clean up temp file
      try {
        fs.unlinkSync(filePath);
        logger.info('🗑️  Temp file cleaned up');
      } catch (cleanupErr) {
        logger.warn('⚠️ Could not delete temp file:', cleanupErr.message);
      }

      // 5. Return structured JSON
      return res.json({ success: true, data: normalized });

    } catch (processingError) {
      try { fs.unlinkSync(filePath); } catch { }
      logger.error('Resume processing error:', processingError);
      return res.status(500).json({ error: processingError.message || 'Failed to process resume' });
    }

  } catch (error) {
    logger.error('Resume import endpoint error:', error);
    return res.status(500).json({ error: error.message || 'Failed to import resume' });
  }
});

// Resume Builder Direct Endpoints (for frontend compatibility)
// These endpoints provide a simpler API for the resume builder form
import * as resumeController from './controllers/resumeController.js';
import { generateUnifiedResume } from './utils/unifiedTemplates.js';

// ⚡ FAST UNIFIED RESUME GENERATION
// Uses PDFKit directly instead of LaTeX for instant generation
app.post('/generate-resume', async (req, res) => {
  try {
    const { template, personalInfo, experience, education, ...rest } = req.body;

    let resumeData = {
      template: template || 'classic',
      personalInfo: personalInfo || {},
      experience: experience || [],
      education: education || [],
      ...rest
    };

    // Normalize data for unified PDF generator
    resumeData = normalizeResumeData(resumeData);

    logger.info(`⚡ Generating resume with template: ${resumeData.template}`);

    // Generate unique filename
    const timestamp = Date.now();
    const safeName = (resumeData.personalInfo?.fullName || resumeData.personalInfo?.name || 'resume').replace(/[^a-zA-Z0-9]/g, '_');
    const fileName = `resume_${safeName}_${timestamp}.pdf`;
    const filePath = path.join('/tmp', fileName);

    // Generate PDF directly with PDFKit unified templates
    await generateUnifiedResume(resumeData, resumeData.template, filePath);

    logger.info(`✅ Resume generated successfully: ${fileName}`);
    res.json({ success: true, message: 'Resume generated', file: fileName });

  } catch (error) {
    logger.error('Resume generation error:', error);
    res.status(500).json({ error: error.message || 'Resume generation failed' });
  }
});

app.post('/download-resume', async (req, res) => {
  try {
    const { template, personalInfo, experience, education, ...rest } = req.body;

    // 🔍 DEBUG: Log FULL incoming data to console
    console.log('\n🔍 ==================== DOWNLOAD RESUME REQUEST ====================');
    console.log('📦 FULL REQUEST BODY:', JSON.stringify(req.body, null, 2));
    console.log('👤 personalInfo.fullName:', personalInfo?.fullName);
    console.log('📧 personalInfo.email:', personalInfo?.email);
    console.log('📞 personalInfo.phone:', personalInfo?.phone);
    console.log('📜 certifications (raw):', rest.certifications);
    console.log('🎯 skills (raw):', rest.skills);
    console.log('==================================================================\n');

    // 🔍 DEBUG: Log incoming data
    logger.info('📥 Received request body:', JSON.stringify({
      template,
      personalInfo,
      hasExperience: experience?.length > 0,
      hasEducation: education?.length > 0,
      otherFields: Object.keys(rest)
    }, null, 2));

    let resumeData = {
      template: template || 'classic',
      personalInfo: personalInfo || {},
      experience: experience || [],
      education: education || [],
      ...rest
    };

    // Normalize data (convert strings to arrays where needed)
    resumeData = normalizeResumeData(resumeData);
    logger.info(`⚡ Generating resume for download with template: ${resumeData.template}`);
    logger.info(`📋 Resume data after normalization:`, JSON.stringify({
      name: resumeData.personalInfo?.fullName,
      email: resumeData.personalInfo?.email,
      phone: resumeData.personalInfo?.phone,
      certifications: resumeData.certifications,
      skills: resumeData.skills
    }, null, 2));

    // Generate unique filename
    const timestamp = Date.now();
    const safeName = (resumeData.personalInfo?.fullName || resumeData.personalInfo?.name || 'resume').replace(/[^a-zA-Z0-9]/g, '_');
    const fileName = `${safeName}_${resumeData.template}_resume.pdf`;
    const filePath = path.join('/tmp', fileName);

    // Generate PDF directly with PDFKit unified templates
    await generateUnifiedResume(resumeData, resumeData.template, filePath);

    // Send file for download
    res.download(filePath, fileName, (err) => {
      if (err) logger.error('Download error:', err);
      // Clean up temp file
      try {
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      } catch (cleanupErr) {
        logger.warn('Cleanup error:', cleanupErr);
      }
    });

  } catch (error) {
    logger.error('Resume download error:', error);
    res.status(500).json({ error: error.message || 'Resume download failed' });
  }
});


// Create necessary folders
// if (!fs.existsSync('/tmp')) fs.mkdirSync('/tmp', { recursive: true }); // /tmp usually exists
if (!fs.existsSync('./templates')) fs.mkdirSync('./templates', { recursive: true });

const PORT = process.env.PORT || 5003;

// In-memory storage for resumes (for demo; replace with MongoDB models in production)
const userResumes = new Map();

// Connect MongoDB - Optional for resume generation
if (process.env.MONGODB_URI && process.env.MONGODB_URI.includes('mongodb')) {
  mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
      logger.info('MongoDB connected');
    })
    .catch((err) => {
      logger.error('MongoDB connection error:', err);
      logger.info('Continuing without MongoDB for resume generation testing...');
    });
}

// DOCX Download Endpoint (HTML-based)
app.post('/api/resume/download-docx', (req, res) => {
  try {
    const data = req.body;

    // Simple HTML generation for Word
    const htmlContent = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.5; font-size: 11pt; }
          h1 { text-align: center; font-size: 18pt; margin-bottom: 5px; }
          .contact { text-align: center; font-size: 10pt; margin-bottom: 20px; color: #555; }
          h2 { border-bottom: 1px solid #000; padding-bottom: 3px; margin-top: 15px; font-size: 14pt; text-transform: uppercase; }
          .job-header { display: flex; justify-content: space-between; font-weight: bold; margin-top: 10px; }
          .company { font-style: italic; }
          ul { margin-top: 5px; padding-left: 20px; }
          li { margin-bottom: 3px; }
        </style>
      </head>
      <body>
        <h1>${data.personalInfo?.fullName || 'Resume'}</h1>
        <div class="contact">
          ${[
        data.personalInfo?.email,
        data.personalInfo?.phone,
        data.personalInfo?.address,
        data.personalInfo?.linkedin
      ].filter(Boolean).join(' | ')}
        </div>
        
        ${data.summary ? `<h2>Professional Summary</h2><p>${data.summary}</p>` : ''}
        
        ${data.experience && data.experience.length ? `<h2>Work Experience</h2>${data.experience.map(exp => `
          <div>
            <div style="display:flex; justify-content:space-between;">
              <strong>${exp.jobTitle || ''}</strong>
              <span>${exp.startDate || ''} - ${exp.endDate || 'Present'}</span>
            </div>
            <div class="company">${exp.company || ''}</div>
            <ul>${(exp.description || '').split('\n').filter(d => d.trim()).map(d => `<li>${d.replace(/^[•-]\s*/, '')}</li>`).join('')}</ul>
          </div>
        `).join('')}` : ''}
        
        ${data.education && data.education.length ? `<h2>Education</h2>${data.education.map(edu => `
          <div>
            <div style="display:flex; justify-content:space-between;">
              <strong>${edu.school || ''}</strong>
              <span>${edu.gradYear || ''}</span>
            </div>
            <div>${edu.degree || ''} ${edu.gpa ? `(GPA: ${edu.gpa})` : ''}</div>
          </div>
        `).join('')}` : ''}
        
        ${data.technicalSkills ? `<h2>Technical Skills</h2><p>${data.technicalSkills}</p>` : ''}
        ${data.softSkills ? `<h2>Soft Skills</h2><p>${data.softSkills}</p>` : ''}
        
        ${data.projects && data.projects.length ? `<h2>Projects</h2>${data.projects.map(p => `
          <div style="margin-bottom: 10px;">
            <strong>${p.name || ''}</strong> ${p.tech ? `| <em>${p.tech}</em>` : ''}
            <p>${p.description || ''}</p>
            ${p.link ? `<a href="${p.link}">${p.link}</a>` : ''}
          </div>
        `).join('')}` : ''}

        ${data.certifications && data.certifications.length ? `<h2>Certifications</h2><ul>${(Array.isArray(data.certifications) ? data.certifications : []).map(c => `<li>${c}</li>`).join('')}</ul>` : ''}
        
      </body>
      </html>
    `;

    res.setHeader('Content-Type', 'application/msword');
    res.setHeader('Content-Disposition', 'attachment; filename=resume.doc');
    res.send(htmlContent);
  } catch (error) {
    console.error('DOCX generation error:', error);
    res.status(500).json({ error: 'Failed to generate DOCX' });
  }
});

// Start server regardless of MongoDB connection
app.listen(PORT, () => logger.info(`🚀 Server running on port ${PORT}`));

// DEPRECATED - Resume routes, moved to routes/resumeRoutes.js
// app.post('/resume/start', ...);
// ...

// Chatbot API endpoint - This might be refactored or moved later
app.post('/api/ask', async (req, res) => {
  const { question, skill } = req.body;
  if (!question || !skill) {
    return res.status(400).json({ error: 'Missing question or skill' });
  }

  const prompt = `You are a coding tutor. The user is learning "${skill}". Answer their question in a helpful, concise way. Question: ${question}`;

  try {
    const routerRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'mistralai/mistral-7b-instruct',
        messages: [
          { role: "system", content: "You are a helpful coding tutor." },
          { role: "user", content: prompt }
        ]
      })
    });
    const result = await routerRes.json();
    if (result.choices && result.choices[0]?.message?.content) {
      res.json({ answer: result.choices[0].message.content });
    } else {
      res.json({ answer: "Sorry, I couldn't get an answer from the AI right now." });
    }
  } catch (error) {
    logger.error('OpenRouter error:', error);
    res.status(500).json({ error: 'OpenRouter failed.' });
  }
});

// DEPRECATED - Test video API endpoint, logic is now in hiero analysis part
// app.get('/api/videos', ...);

// Error handler
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    res.status(400).json({ success: false, message: 'Invalid JSON in request body' });
  } else {
    logger.error('Server error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ========== PUBLIC RESUME ENDPOINTS FOR STATIC BUILDER ==========
// These are unauthenticated aliases that the static resume-builder.html can call.
// They simply forward to the existing controller logic behind /resume/* routes.

// Use the same router but mount it under /resume for the main app
app.use('/resume', resumeRoutes);

// Public wrappers that reuse the same controller functions but do NOT require auth.
// NOTE: resumeController is already imported above; do not re-import it here.



app.post('/preview-resume', async (req, res) => {
  try {
    const resumeData = req.body;
    const templateId = resumeData.template || 'classic';

    logger.info(`✨ Instant HTML preview generated for template: ${templateId}`);

    // Normalize data (convert strings to arrays where needed)
    const normalizedData = normalizeResumeData(resumeData);

    // Generate HTML using the centralized template generator
    const html = generateTemplateHTML(templateId, normalizedData);

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  } catch (err) {
    logger.error('Preview resume error:', err);
    res.status(500).json({ error: 'Failed to generate preview' });
  }
});
