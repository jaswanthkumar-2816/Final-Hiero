const express = require('express');
const axios = require('axios');
const multer = require('multer');
const fs = require('fs');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const Tesseract = require('tesseract.js');
const path = require('path');

const router = express.Router();

const upload = multer({
    dest: '/tmp',
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword'];
        if (allowedTypes.includes(file.mimetype)) cb(null, true);
        else cb(new Error('Invalid file type.'));
    }
});

function normalizeText(text) {
    if (!text) return '';
    return text.replace(/[•►▪■●·–—*]/g, '-').replace(/\u00A0/g, ' ').replace(/\r\n/g, '\n').replace(/\n{2,}/g, '\n').replace(/[ ]{2,}/g, ' ').trim();
}

async function extractTextFromPdf(filePath) {
    try {
        const dataBuffer = fs.readFileSync(filePath);
        const data = await pdfParse(dataBuffer);
        let text = data.text || '';
        if (text.trim().length < 50) {
            const { data: { text: ocrText } } = await Tesseract.recognize(filePath, 'eng');
            text = ocrText;
        }
        return text;
    } catch (error) { throw new Error('Failed to extract PDF text.'); }
}

async function extractFromDocx(filePath) {
    try {
        const result = await mammoth.extractRawText({ path: filePath });
        return result.value || '';
    } catch (error) { throw new Error('Failed to extract DOCX text.'); }
}

/**
 * 🎯 ATS Scoring & Suggestions Engine
 */
function analyzeResumeQuality(data, text) {
    const analysis = { score: 0, suggestions: [], atsKeywords: [] };
    if (data.personalInfo.fullName) analysis.score += 15;
    else analysis.suggestions.push("Add your full name clearly at the top.");
    if (data.personalInfo.email && data.personalInfo.phone) analysis.score += 10;
    else analysis.suggestions.push("Ensure both email and phone are present.");
    if (data.summary && data.summary.length > 50) analysis.score += 10;
    else analysis.suggestions.push("Craft a strong professional summary (2-3 sentences).");
    if (data.experience.length > 0) analysis.score += 25;
    else analysis.suggestions.push("List your work history with clear job titles.");
    if (data.technicalSkills && data.technicalSkills.length > 20) analysis.score += 15;
    else analysis.suggestions.push("Expand your technical skills section with relevant tools.");
    if (data.education.length > 0) analysis.score += 10;
    else analysis.suggestions.push("Include your academic background.");
    if (text.length > 1000 && text.length < 5000) analysis.score += 10;
    if (analysis.score > 100) analysis.score = 100;
    const keywords = ["leadership", "development", "management", "agile", "cloud", "api", "database", "ui/ux", "optimization", "collaboration", "strategy"];
    keywords.forEach(kw => { if (text.toLowerCase().includes(kw)) analysis.atsKeywords.push(kw); });
    return analysis;
}

/**
 * 🧠 Rule-Based Resume Parser (V14: Smart Fallback Engine)
 */
function parseResumeTextRuleBased(rawText) {
    const text = normalizeText(rawText);
    const data = {
        personalInfo: { fullName: '', email: '', phone: '', address: '', linkedin: '', website: '' },
        summary: '', experience: [], education: [], projects: [], references: [],
        technicalSkills: '', softSkills: '', certifications: [], achievements: '',
        languages: [], hobbies: '', customSectionContent: '', customDetails: []
    };
    if (!text) return data;
    const cleanLines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);

    const emailMatch = text.match(/[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}/);
    if (emailMatch) data.personalInfo.email = emailMatch[0];
    const phoneMatch = text.match(/(?:\+?\d{1,3}[-.\s]?)?\(?\d{3,4}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
    if (phoneMatch) data.personalInfo.phone = phoneMatch[0];
    const linkedinMatch = text.match(/(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/[a-zA-Z0-9-]+/i);
    if (linkedinMatch) data.personalInfo.linkedin = linkedinMatch[0];

    const websiteMatch = text.match(/(?:https?:\/\/)?(?:www\.)?[\w-]+\.(?:com|org|net|io|me|dev|in)(?:\/[\w-]+)*/i);
    if (websiteMatch && !websiteMatch[0].includes('linkedin') && !websiteMatch[0].includes('gmail')) data.personalInfo.website = websiteMatch[0];

    const addressMatch = text.match(/(?:[A-Z][a-z]+\s?)+,\s*[A-Z]{2}(?:\s\d{5})?|(?:[A-Z][a-z]+\s?)+,\s*[A-Z][a-z]{2,}/);
    if (addressMatch) {
        const addr = addressMatch[0].trim();
        if (addr.length < 40 && !addr.toLowerCase().includes('using') && !addr.toLowerCase().includes('built')) data.personalInfo.address = addr;
    }

    for (let i = 0; i < Math.min(10, cleanLines.length); i++) {
        let line = cleanLines[i];
        if (line.includes('@') || line.match(/\d{4}/) || line.length < 3 || line.includes('|')) continue;

        let clean = line.replace(/^(whoami:?|name:?|resume:?|curriculum vitae:?|#|\$|>)\s*/i, '').replace(/^\W+/, '').trim();

        // Exclude lines that look like locations (City, State or City, Country)
        const isLocation = /^[A-Z][a-z]+,?\s+[A-Z][a-z]+(\s+[A-Z][a-z]+)?$/i.test(clean);
        const hasNumbers = /\d/.test(clean);

        if (clean.length > 2 && clean.length < 50 && !hasNumbers && !isLocation) {
            data.personalInfo.fullName = clean;
            break;
        }
    }

    const sections = { experience: [], education: [], skills: [], projects: [], summary: [], certifications: [], achievements: [], languages: [], hobbies: [], references: [], fallback: [] };
    let currentSection = null;
    const hMap = {
        experience: /^(experience|employment|work history|professional background|career history|employment history|work experience)$/i,
        education: /^(education|academic|qualifications|academic background|studies)$/i,
        skills: /^(skills|technologies|technical stack|competencies|expertise|tools|tech stack|technical skills)$/i,
        projects: /^(projects|portfolio|personal projects|key projects)$/i,
        summary: /^(summary|profile|objective|about me|professional summary|professional profile|carrier objective)$/i,
        certifications: /^(certifications|credentials|licenses|courses|certificates)$/i,
        achievements: /^(achievements|awards|honors|extracurricular|academic achievements)$/i,
        languages: /^(languages)$/i,
        hobbies: /^(hobbies|interests)$/i,
        references: /^(references|referees)$/i
    };

    cleanLines.forEach(line => {
        const norm = line.replace(/[^a-zA-Z\s]/g, '').trim();
        let isHeader = false;
        for (const [key, pattern] of Object.entries(hMap)) {
            if (pattern.test(norm) && norm.length < 35 && norm.length > 2) { currentSection = key; isHeader = true; break; }
        }
        if (!isHeader) {
            if (currentSection) sections[currentSection].push(line);
            else {
                const isContact = line.includes('@') || line.match(/\d{3}[-.\s]?\d{3}/);
                const isNameCandidate = data.personalInfo.fullName && line.includes(data.personalInfo.fullName);
                if (!isContact && !isNameCandidate && line.length > 15) sections.summary.push(line);
                else sections.fallback.push(line);
            }
        }
    });

    data.summary = sections.summary.join(' ').slice(0, 1000).trim();
    if (sections.skills.length > 0) data.technicalSkills = sections.skills.map(s => s.replace(/^[\s•\-\+\*#>]+\s*/, '').trim()).join(', ');
    data.achievements = sections.achievements.join('\n').trim();
    data.hobbies = sections.hobbies.join(', ').trim();
    data.languages = sections.languages.map(s => s.replace(/^[\s•\-\+\*#>]+\s*/, '').trim()).filter(s => s.length > 1);
    data.certifications = sections.certifications.map(s => s.replace(/^[\s•\-\+\*#>]+\s*/, '').trim()).filter(s => s.length > 2);
    data.customSectionContent = sections.fallback.join('\n').trim();

    const jobTitleKeywords = /\b(engineer|developer|manager|lead|intern|analyst|specialist|consultant|architect|designer|programmer|coordinator|officer)\b/i;
    const degreeKeywords = /\b(bachelor|master|phd|diploma|degree|B\.S\.|M\.S\.|B\.Tech|M\.Tech|M\.B\.A\.)\b/i;
    const schoolKeywords = /\b(university|college|school|institute|polytechnic|academy)\b/i;
    const dateRegexStr = '(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\\.?[\\s\\/]?\\d{2,4}|\\d{1,2}\\/\\d{2,4}|\\d{4}(?:-\\d{2,4})?|Present|Current';
    const dateRangeRegex = new RegExp(`(${dateRegexStr})\\s*(?:-|to|–|—|through)\\s*(${dateRegexStr})`, 'i');

    let expItem = null;
    sections.experience.forEach(line => {
        const clean = line.replace(/^[\s•\-\+\*#>]+\s*/, '').trim();
        const dateMatch = clean.match(dateRangeRegex);
        const isActionLine = /^(working|built|managed|developed|led|created|responsible|involved|designed)/i.test(clean);
        const hasTitle = jobTitleKeywords.test(clean) && !isActionLine && !clean.match(/\b(team of|of \d+)\b/i);
        const isBullet = /^[\s•\-\+\*]/.test(line);

        if (!expItem || (hasTitle && expItem.jobTitle && expItem.jobTitle !== 'Professional Role')) {
            if (expItem) data.experience.push(expItem);
            let title = hasTitle ? clean.replace(dateRangeRegex, '').trim() : 'Professional Role';
            let titleParts = title.split(/[|–—:-]\s/);
            let finalTitle = titleParts[0].trim();
            let company = titleParts.length > 1 ? titleParts[1].trim() : '';
            expItem = { jobTitle: finalTitle.replace(/[|•-]/g, '').trim(), company: company.replace(/[|•-]/g, '').trim(), startDate: dateMatch ? dateMatch[1] : '', endDate: dateMatch ? dateMatch[2] : '', description: '' };
        } else {
            if (dateMatch && !expItem.startDate) { expItem.startDate = dateMatch[1]; expItem.endDate = dateMatch[2]; }
            else if (hasTitle && expItem.jobTitle === 'Professional Role') { expItem.jobTitle = clean.replace(dateRangeRegex, '').replace(/[|•-]/g, '').trim(); }
            else if (!expItem.company && clean.length < 60 && !isBullet && !dateMatch && !clean.match(/[.,]/) && !isActionLine) { expItem.company = clean; }
            else { expItem.description += (expItem.description ? '\n' : '') + line.trim(); }
        }
    });
    if (expItem) data.experience.push(expItem);

    let eduItem = null;
    sections.education.forEach(line => {
        const clean = line.replace(/^[\s•\-\+\*#>]+\s*/, '').trim();
        const hasDegree = degreeKeywords.test(clean);
        const hasSchool = schoolKeywords.test(clean);
        const hasYear = clean.match(/\d{4}/);
        const shouldStartNew = !eduItem || (hasDegree && eduItem.degree && eduItem.school !== 'Educational Institution') || (hasSchool && eduItem.school !== 'Educational Institution');
        if (shouldStartNew) {
            if (eduItem) data.education.push(eduItem);
            eduItem = { school: hasSchool ? clean.replace(/\d{4}.*/g, '').replace(/[()]|graduated/gi, '').trim() : 'Educational Institution', degree: hasDegree ? clean.replace(/\d{4}.*/g, '').trim() : '', gradYear: hasYear ? hasYear[0] : '', gpa: clean.match(/GPA:\s*(\d\.\d+)/i)?.[1] || '' };
        } else {
            if (hasDegree && !eduItem.degree) eduItem.degree = clean.replace(/\d{4}.*/g, '').trim();
            if (hasSchool && (eduItem.school === 'Educational Institution' || eduItem.school.length < clean.length)) eduItem.school = clean.replace(/\d{4}.*/g, '').replace(/[()]|graduated/gi, '').trim();
            if (hasYear && !eduItem.gradYear) eduItem.gradYear = hasYear[0];
            const gpaMatch = clean.match(/GPA:\s*(\d\.\d+)/i);
            if (gpaMatch) eduItem.gpa = gpaMatch[1];
        }
    });
    if (eduItem) data.education.push(eduItem);

    let projItem = null;
    sections.projects.forEach(line => {
        const clean = line.replace(/^[\s•\-\+\*#>]+\s*/, '').trim();
        const isBullet = /^[\s•\-\+\*]/.test(line);
        if (!projItem || (clean.length < 65 && !isBullet && !clean.match(/[.,]/))) {
            if (projItem) data.projects.push(projItem);
            projItem = { name: clean, description: '', tech: '', duration: '', achievement: '', link: '' };
        } else { projItem.description += (projItem.description ? '\n' : '') + clean; }
    });
    if (projItem) data.projects.push(projItem);

    let refItem = null;
    sections.references.forEach(line => {
        const clean = line.replace(/^[\s•\-\+\*#>]+\s*/, '').trim();
        const hasEmail = clean.includes('@');
        const hasPhone = clean.match(/\d{3}[-.\s]?\d{3}[-.\s]?\d{4}/);
        if (!refItem || (clean.length < 40 && !hasEmail && !hasPhone)) {
            if (refItem) data.references.push(refItem);
            refItem = { name: clean, title: '', company: '', phone: '', email: '' };
        } else {
            if (hasEmail) refItem.email = clean;
            else if (hasPhone) refItem.phone = clean;
            else if (!refItem.title) refItem.title = clean;
            else if (!refItem.company) refItem.company = clean;
        }
    });
    if (refItem) data.references.push(refItem);
    return data;
}

/**
 * 👑 Perfect Extraction Engine (V16: Multi-AI Integrated)
 */
async function parseResumeText(rawText) {
    const textToParse = rawText.slice(0, 15000);
    const systemPrompt = `You are a High-Performance ATS Optimizer and Resume Parser. 
    Your goal is to extract data AND improve its quality to reach an 85+ ATS score.

    1. EXTRACTION RULES (CRITICAL):
       - Extract ALL Details: Personal Info, Experience, Education, Projects, Skills, Certifications.
       - Use "Present" for current roles.
       - REMOVE PDF headings like "Contact", "Address", "Portfolio", "Website". Do NOT include these literal words inside the extracted values (e.g. if the PDF says "Address\\nBengaluru", extract ONLY "Bengaluru").
       - Capture full GitHub/LinkedIn/Portfolio links clearly as valid URLs (e.g. "https://example.com" instead of just "example.com").
       - Do NOT prepend made-up job titles (like "RETAIL PROFESSIONAL") to the summary.

    2. OPTIMIZATION RULES:
       - SUMMARY: If no summary exists, write a professional 2-3 sentence summary based on their experience. Do NOT prepend job titles in all-caps to the summary.
       - SKILL GROUPING: Convert flat skill lists (e.g. Python, Java, SQL) into grouped technical skills (e.g. "Languages: Python, Java; Databases: SQL").
       - PROJECTS/EXPERIENCE: Ensure descriptions start with strong action verbs (Built, Led, Developed). If metrics are missing, structure the text so the user can easily add them (e.g. "Optimized X system resulting in [insert %] improvement").
       - FORMAT: Return a strict JSON object.

    Structure MUST match this exactly:
    {
      "personalInfo": { "fullName": "", "email": "", "phone": "", "address": "", "linkedin": "", "website": "" },
      "summary": "Data Science professional with experience in predictive modeling...",
      "technicalSkills": "Programming: Python, Java; Web: HTML, CSS; Tools: Git",
      "softSkills": "Leadership, Communication, Team Management",
      "experience": [ { "jobTitle": "", "company": "", "startDate": "YYYY-MM", "endDate": "YYYY-MM or Present", "description": "• Led team of 5\\n• Managed SQL Databases" } ],
      "education": [ { "degree": "B.Sc Computer Science", "school": "University of X", "gradYear": "2023", "gpa": "3.8/4.0" } ],
      "projects": [ { "name": "", "tech": "Python, Flask", "description": "Built EMS handling 500+ users. Improved efficiency by 20%.", "link": "https://github.com/...", "achievement": "Improved performance by 30%", "duration": "" } ],
      "certifications": ["AWS Certified Solutions Architect"],
      "languages": ["English", "Spanish"],
      "achievements": "Recipient of Dean's List for 4 semesters",
      "hobbies": "Coding, Chess, Hiking",
      "extraCurricular": ["Co-Organized Nirmitee 2017", "Attended workshop on Autodesk Revit"],
      "references": [ { "name": "", "title": "", "company": "", "phone": "", "email": "" } ],
      "customDetails": [ { "heading": "Publications", "content": "Research paper on ML published in JSR" } ]
    }`;

    if (process.env.GROQ_API_KEY) {
        try {
            console.log('⚡ Initializing Groq Perfect Extraction...');
            const { data: response } = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
                model: 'llama-3.3-70b-versatile',
                messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: `Parse this resume:\n\n${textToParse}` }],
                temperature: 0.1, response_format: { type: "json_object" }
            }, { headers: { 'Authorization': `Bearer ${process.env.GROQ_API_KEY}`, 'Content-Type': 'application/json' } });
            console.log('✅ Groq Extraction Complete.');
            return JSON.parse(response.choices[0].message.content);
        } catch (err) { console.error('⚠️ Groq failed:', err.message); }
    }

    if (process.env.OPENROUTER_API_KEY) {
        try {
            console.log('🤖 Trying OpenRouter Perfect Extraction...');
            const { data: response } = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
                model: 'openai/gpt-4o-mini',
                messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: `Parse this resume:\n\n${textToParse}` }],
                temperature: 0.1, response_format: { type: "json_object" }
            }, { headers: { 'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`, 'Content-Type': 'application/json', 'HTTP-Referer': 'http://localhost:2816' } });
            console.log('✅ OpenRouter Extraction Complete.');
            return JSON.parse(response.choices[0].message.content);
        } catch (err) { console.error('⚠️ OpenRouter failed:', err.message); }
    }

    console.warn('📌 All AI Providers failed. Falling back to Rule-Based Parse.');
    return parseResumeTextRuleBased(rawText);
}

router.post('/import', (req, res) => {
    upload.single('resume')(req, res, async (err) => {
        if (err || !req.file) return res.status(400).json({ success: false, error: err?.message || 'No file' });
        try {
            const jd = req.body.jobDescription || '';
            const ext = path.extname(req.file.originalname).toLowerCase();
            let text = (ext === '.pdf') ? await extractTextFromPdf(req.file.path) : await extractFromDocx(req.file.path);
            const parsedData = await parseResumeText(text);
            const qualityAnalysis = analyzeResumeQuality(parsedData, text);
            if (jd) {
                const jdKeywords = jd.toLowerCase().split(/\W+/).filter(w => w.length > 4);
                const resumeText = text.toLowerCase();
                let matches = 0; const matchFound = [];
                const uniqueJdKeywords = [...new Set(jdKeywords)];
                uniqueJdKeywords.forEach(kw => { if (resumeText.includes(kw)) { matches++; matchFound.push(kw); } });
                const matchScore = Math.round((matches / Math.max(uniqueJdKeywords.length / 2, 5)) * 100);
                qualityAnalysis.matchingScore = Math.min(matchScore, 100);
                qualityAnalysis.matchKeywords = matchFound.slice(0, 10);
            }
            if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
            res.json({ success: true, data: parsedData, analysis: qualityAnalysis, meta: { parsedWith: 'Hiero-Perfect-Extraction-V16' } });
        } catch (e) { res.status(500).json({ success: false, error: e.message }); }
    });
});

module.exports = router;
