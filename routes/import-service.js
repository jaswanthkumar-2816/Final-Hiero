const express = require('express');
const axios = require('axios');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

function getPdfParse() {
    return require('pdf-parse');
}
function getMammoth() {
    return require('mammoth');
}
function getTesseract() {
    return require('tesseract.js');
}

const router = express.Router();
const os = require('os');

const upload = multer({
    dest: os.tmpdir(),
    limits: { fileSize: 15 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowedTypes = [
            'application/pdf',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/msword',
            'application/octet-stream',
            'image/png',
            'image/jpeg',
            'image/jpg',
            'image/webp'
        ];
        const ext = path.extname(file.originalname || '').toLowerCase();
        const allowedExts = ['.pdf', '.doc', '.docx', '.png', '.jpg', '.jpeg', '.webp'];
        if (allowedTypes.includes(file.mimetype) || allowedExts.includes(ext)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Please upload a PDF, Word document, or image.'));
        }
    }
});

function normalizeText(text) {
    if (!text) return '';
    return text.replace(/[•►▪■●·–—*]/g, '-').replace(/\u00A0/g, ' ').replace(/\r\n/g, '\n').replace(/\n{2,}/g, '\n').replace(/[ ]{2,}/g, ' ').trim();
}

function extractRawPdfTextFallback(dataBuffer) {
    try {
        const str = dataBuffer.toString('latin1');
        const matches = [];
        const tjRegex = /\(([^)]+)\)\s*Tj/g;
        let m;
        while ((m = tjRegex.exec(str)) !== null) {
            if (m[1] && m[1].length > 1) matches.push(m[1]);
        }
        const arrayTjRegex = /\[([^\]]+)\]\s*TJ/g;
        while ((m = arrayTjRegex.exec(str)) !== null) {
            const inner = m[1].match(/\(([^)]+)\)/g);
            if (inner) {
                inner.forEach(s => {
                    const clean = s.slice(1, -1);
                    if (clean.length > 0) matches.push(clean);
                });
            }
        }
        return matches.join(' ').replace(/\\([()\\])/g, '$1').trim();
    } catch (e) {
        return '';
    }
}

async function extractTextFromPdf(filePath) {
    const dataBuffer = fs.readFileSync(filePath);
    let text = '';

    // Primary: pdf-parse with Node 20/22/24 Uint8Array slice fix
    try {
        const cleanUint8 = new Uint8Array(
            dataBuffer.buffer.slice(dataBuffer.byteOffset, dataBuffer.byteOffset + dataBuffer.byteLength)
        );
        const data = await getPdfParse()(cleanUint8);
        text = data.text || '';
    } catch (pdfErr) {
        console.warn('pdf-parse primary extraction failed:', pdfErr.message);
    }

    // Fallback: raw stream text regex
    if (!text || text.trim().length < 50) {
        const rawText = extractRawPdfTextFallback(dataBuffer);
        if (rawText && rawText.trim().length > (text ? text.trim().length : 0)) {
            text = (text ? text + '\n' : '') + rawText;
        }
    }

    if (!text || text.trim().length < 10) {
        throw new Error('Unable to extract text from resume. Please ensure the file is not empty or password protected.');
    }
    return text;
}

async function extractFromDocx(filePath) {
    try {
        const result = await getMammoth().extractRawText({ path: filePath });
        const text = result.value || '';
        if (!text || text.trim().length < 10) {
            throw new Error('Unable to extract text from DOCX resume.');
        }
        return text;
    } catch (error) { throw new Error(error.message || 'Failed to extract DOCX text.'); }
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
    if (sections.skills.length > 0) data.technicalSkills = sections.skills.map(s => s.replace(/^[\s•\-\+\*#>]+\s*/, '').trim()).join('\n');
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
 * 🔗 Normalize all links in parsed data — ensure they start with https://
 */
function normalizeParsedLinks(data) {
    const ensureHttps = (url) => {
        if (!url || typeof url !== 'string') return url;
        url = url.trim();
        if (!url) return url;
        // Already has a protocol
        if (url.startsWith('http://') || url.startsWith('https://')) return url;
        // Looks like a real URL (contains a dot and no spaces)
        if (url.includes('.') && !url.includes(' ')) return 'https://' + url;
        return url;
    };

    if (data.personalInfo) {
        data.personalInfo.linkedin = ensureHttps(data.personalInfo.linkedin);
        data.personalInfo.github   = ensureHttps(data.personalInfo.github);
        data.personalInfo.website  = ensureHttps(data.personalInfo.website);
    }
    // Also handle flat-level links
    if (data.linkedin) data.linkedin = ensureHttps(data.linkedin);
    if (data.github)   data.github   = ensureHttps(data.github);
    if (data.website)  data.website  = ensureHttps(data.website);

    // Fix project links
    if (Array.isArray(data.projects)) {
        data.projects = data.projects.map(p => ({
            ...p,
            link: ensureHttps(p.link)
        }));
    }
    return data;
}

/**
 * Post-process AI output so form + templates match the source resume exactly.
 * - No invented titles/summaries
 * - Education: university + college, marks as % (not GPA/100)
 * - Map seminars / resource-person roles into form fields
 */
function normalizeExactResumeData(data = {}) {
    if (!data || typeof data !== 'object') return data;
    data = JSON.parse(JSON.stringify(data));
    data.personalInfo = data.personalInfo || {};

    // Prefer real job title over invented "Professional Candidate"
    const firstJob = Array.isArray(data.experience) && data.experience[0];
    if (!data.personalInfo.professionalTitle || /professional candidate/i.test(data.personalInfo.professionalTitle)) {
        if (firstJob && firstJob.jobTitle) {
            data.personalInfo.professionalTitle = firstJob.jobTitle;
        }
    }
    if (firstJob && /assistant professor/i.test(firstJob.jobTitle || '')) {
        const skills = String(data.technicalSkills || '');
        const looksCS = /computer applications|java|python|c\+\+|software engineering|computer networks/i.test(
            `${firstJob.company || ''} ${skills} ${firstJob.description || ''}`
        );
        if (looksCS) {
            data.personalInfo.professionalTitle = 'Assistant Professor, Computer Applications';
            if (firstJob.company && !/computer applications/i.test(firstJob.company)) {
                firstJob.company = `${firstJob.company} — Dept. of Computer Applications`;
            }
        }
    }
    data.personalInfo.roleTitle = data.personalInfo.professionalTitle || data.personalInfo.roleTitle || '';

    // Strip invented length claims if summary was AI-expanded (keep source objective when short)
    if (typeof data.summary === 'string') {
        data.summary = data.summary
            .replace(/\b\d+\+?\s*years?\b/gi, '')
            .replace(/\s{2,}/g, ' ')
            .trim();
    }

    // Education: build school as "University — College", normalize marks to %
    if (Array.isArray(data.education)) {
        data.education = data.education.map((edu) => {
            const university = (edu.university || '').trim();
            const college = (edu.college || edu.school || edu.institution || '').trim();
            let school = college;
            if (university && college && !college.toLowerCase().includes(university.toLowerCase().slice(0, 12))) {
                school = `${university} — ${college}`;
            } else if (university && !college) {
                school = university;
            } else if (edu.school) {
                school = edu.school;
            }

            let marks = (edu.marks || edu.gpa || edu.percentage || edu.grade || '').toString().trim();
            if (marks) {
                marks = marks.replace(/^GPA:\s*/i, '').trim();
                // "57/100" → "57%"
                if (/\/\s*100\b/i.test(marks)) {
                    const m = marks.match(/(\d+(?:\.\d+)?)/);
                    marks = m ? `${m[1]}%` : marks;
                } else if (/^\d+(\.\d+)?$/.test(marks) && parseFloat(marks) > 4) {
                    // Bare percentage number (Indian marksheets), not a 4.0 GPA
                    marks = `${marks}%`;
                }
            }

            return {
                ...edu,
                degree: edu.degree || '',
                university,
                college: college || edu.college || '',
                school,
                institution: school,
                gradYear: edu.gradYear || edu.year || edu.years || '',
                gpa: marks,
                marks
            };
        });
    }

    // Achievements: prefer real achievements array; drop invented fluff phrases
    const inventPattern = /recognized for successful|industry collaborations|curriculum development/i;
    if (typeof data.achievements === 'string' && inventPattern.test(data.achievements)) {
        data.achievements = data.achievements
            .split(/\n|•/)
            .map((s) => s.trim())
            .filter((s) => s && !inventPattern.test(s))
            .join('\n');
    }

    // Seminars / conferences → extraCurricular (form field) + customDetails
    const seminarLines = [];
    if (Array.isArray(data.seminarsConferences)) {
        data.seminarsConferences.forEach((s) => {
            if (typeof s === 'string') seminarLines.push(s);
            else if (s && (s.title || s.name)) {
                const place = s.venue || s.place || s.organization || '';
                seminarLines.push(place ? `${s.title || s.name} — ${place}` : (s.title || s.name));
            }
        });
    }
    if (seminarLines.length) {
        const existing = Array.isArray(data.extraCurricular)
            ? data.extraCurricular
            : (data.extraCurricular ? String(data.extraCurricular).split('\n') : []);
        data.extraCurricular = [...existing, ...seminarLines].filter(Boolean);
        data.customDetails = Array.isArray(data.customDetails) ? data.customDetails : [];
        if (!data.customDetails.some((c) => /seminar|conference|workshop/i.test(c.heading || ''))) {
            data.customDetails.push({
                heading: 'Seminar / Conference / Workshop / Guest Lecture',
                content: seminarLines.map((l) => `• ${l}`).join('\n')
            });
        }
    }

    // Resource person / jury → achievements
    if (Array.isArray(data.resourcePersonRoles) && data.resourcePersonRoles.length) {
        const roleLines = data.resourcePersonRoles.map((r) => {
            if (typeof r === 'string') return r;
            const title = r.title || r.role || '';
            const place = r.venue || r.place || r.organization || '';
            const year = r.year || r.years || '';
            return [title, place, year].filter(Boolean).join(' — ');
        }).filter(Boolean);
        const ach = typeof data.achievements === 'string' ? data.achievements : '';
        const merged = [ach, ...roleLines].filter(Boolean).join('\n');
        data.achievements = merged;
    }

    // Soft skills / strengths — keep sincerity if present in source skills text
    if (Array.isArray(data.languages)) {
        data.languages = data.languages.map((l) => (typeof l === 'string' ? l : (l.name || ''))).filter(Boolean);
    }

    // Technical skills: subjects taught often land here for faculty CVs
    if (typeof data.technicalSkills === 'string') {
        data.technicalSkills = data.technicalSkills.replace(/^Subjects?\s*Taught:\s*/i, '').trim();
    }

    return data;
}

/**
 * 👑 Faithful Extraction Engine (V17) — Groq-first, exact match to source resume
 */
async function parseResumeText(rawText) {
    const textToParse = rawText.slice(0, 24000);
    const systemPrompt = `You are a FAITHFUL resume parser. Extract ONLY what appears in the resume text. Never invent, never improve, never invent years of experience, never invent achievements, never invent headlines.

CRITICAL RULES:
1. Do NOT rewrite the summary/objective. Copy it almost verbatim from OBJECTIVES / Summary / Profile.
2. Do NOT invent a professional title like "Professional Candidate". Use the real job title (e.g. "Assistant Professor, Computer Applications") if present; otherwise leave professionalTitle as the job title from experience.
3. Do NOT invent metrics, "15+ years", "curriculum development", "industry collaborations", or "recognized for..." unless those exact words appear.
4. Education MUST keep BOTH university AND college when both appear. Example: university="Bharathiar University", college="Kongu Arts and Science College".
5. Marks: if the resume says % MARKS or a percentage, put it in "marks" as "57%" (with % sign). NEVER label as GPA and NEVER convert to "57/100".
6. Include school-level rows (Higher Secondary, S.S.L.C) when present.
7. Include EVERY bullet under responsibilities / experience with years intact (e.g. "from 2024 till date", "autonomous", "theory and practical").
8. Put seminars/conferences/workshops/guest lectures into seminarsConferences (full list).
9. Put Chief Guest / Jury / Resource Person items into resourcePersonRoles (these are real achievements).
10. Languages and hobbies go into languages and hobbies.
11. Soft skills / strengths: include every strength listed (e.g. Sincerity, Integrity, Hardworking, Communication, Presentation).
12. Return strict JSON only.

JSON shape:
{
  "personalInfo": {
    "fullName": "",
    "email": "",
    "phone": "",
    "address": "",
    "linkedin": "",
    "github": "",
    "website": "",
    "professionalTitle": "",
    "professionalHeadline": "",
    "dateOfBirth": "",
    "fatherName": "",
    "nationality": "",
    "gender": ""
  },
  "summary": "",
  "technicalSkills": "comma-separated subjects/skills exactly as taught or listed",
  "softSkills": "comma-separated strengths exactly as listed",
  "experience": [
    {
      "jobTitle": "",
      "company": "",
      "location": "",
      "startDate": "",
      "endDate": "Present",
      "description": "• bullet 1\\n• bullet 2"
    }
  ],
  "education": [
    {
      "degree": "",
      "university": "",
      "college": "",
      "school": "University — College",
      "gradYear": "2013 or Pursuing",
      "marks": "57%"
    }
  ],
  "seminarsConferences": ["full item text with venue"],
  "resourcePersonRoles": ["full item text with venue/year"],
  "projects": [],
  "certifications": [],
  "languages": ["English", "Tamil"],
  "achievements": "paper presentation and guest lecture lines only if listed as such",
  "hobbies": "Listening Music, Reading Newspapers",
  "extraCurricular": [],
  "publications": "",
  "customDetails": [
    { "heading": "Seminar / Conference / Workshop / Guest Lecture", "content": "• ..." }
  ]
}`;

    const tryGroq = async (model) => {
        const { data: response } = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
            model,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: `Extract this resume EXACTLY. Do not invent anything.\n\n${textToParse}` }
            ],
            temperature: 0,
            response_format: { type: 'json_object' }
        }, {
            headers: {
                Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
                'Content-Type': 'application/json'
            },
            timeout: 90000
        });
        return JSON.parse(response.choices[0].message.content);
    };

    if (process.env.GROQ_API_KEY) {
        const models = [
            'llama-3.1-8b-instant',
            'openai/gpt-oss-120b',
            'mixtral-8x7b-32768'
        ];
        for (const model of models) {
            try {
                console.log(`⚡ Groq faithful extract via ${model}...`);
                const parsed = normalizeExactResumeData(normalizeParsedLinks(await tryGroq(model)));
                console.log('✅ Groq Extraction Complete.');
                return parsed;
            } catch (err) {
                console.error(`⚠️ Groq ${model} failed:`, err.response?.data?.error?.message || err.message);
            }
        }
    }

    if (process.env.OPENROUTER_API_KEY) {
        try {
            console.log('🤖 Trying OpenRouter faithful extraction...');
            const { data: response } = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
                model: 'openai/gpt-4o-mini',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: `Extract this resume EXACTLY. Do not invent anything.\n\n${textToParse}` }
                ],
                temperature: 0,
                response_format: { type: 'json_object' }
            }, {
                headers: {
                    Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
                    'Content-Type': 'application/json',
                    'HTTP-Referer': 'http://localhost:2816'
                },
                timeout: 90000
            });
            console.log('✅ OpenRouter Extraction Complete.');
            return normalizeExactResumeData(normalizeParsedLinks(JSON.parse(response.choices[0].message.content)));
        } catch (err) {
            console.error('⚠️ OpenRouter failed:', err.message);
        }
    }

    console.warn('📌 All AI Providers failed. Falling back to Rule-Based Parse.');
    return normalizeExactResumeData(parseResumeTextRuleBased(rawText));
}

const handleImportRequest = (req, res) => {
    upload.single('resume')(req, res, async (err) => {
        if (err || !req.file) {
            return res.status(400).json({ success: false, error: err?.message || 'No resume file uploaded' });
        }
        try {
            const jd = req.body.jobDescription || '';
            const ext = path.extname(req.file.originalname || '').toLowerCase();
            let text = '';

            try {
                const { parseDocument } = require('../extraction/src/services/documentParser');
                const parsedDoc = await parseDocument(req.file.path, req.file.originalname);
                text = parsedDoc.text;
            } catch (docErr) {
                console.warn('Advanced documentParser fallback in import-service:', docErr.message);
                if (ext === '.pdf') {
                    text = await extractTextFromPdf(req.file.path);
                } else if (ext === '.docx' || ext === '.doc') {
                    text = await extractFromDocx(req.file.path);
                } else if (['.png', '.jpg', '.jpeg', '.webp'].includes(ext) || (req.file.mimetype && req.file.mimetype.startsWith('image/'))) {
                    try {
                        const { data: { text: ocrText } } = await getTesseract().recognize(req.file.path, 'eng');
                        text = ocrText;
                    } catch (imgErr) {
                        throw new Error('Failed to extract text from image: ' + imgErr.message);
                    }
                } else {
                    try {
                        text = await extractTextFromPdf(req.file.path);
                    } catch (pdfErr) {
                        text = await extractFromDocx(req.file.path);
                    }
                }
            }

            if (!text || text.trim().length < 10) {
                return res.status(400).json({
                    success: false,
                    error: 'Unable to extract text from resume. Please ensure the file is not empty or password protected.'
                });
            }

            // Use new Groq Extraction Engine architecture (Port 4040 engine)
            let parsedData;
            let qualityAnalysis;
            try {
                const { processResumeExtraction } = require('../extraction/src/controllers/extractController');
                const extractionResult = await processResumeExtraction(text, req.file.originalname);
                parsedData = extractionResult.data;
                qualityAnalysis = extractionResult.atsAnalytics || analyzeResumeQuality(parsedData, text);
                if (qualityAnalysis) {
                    const resolvedScore = qualityAnalysis.overallAtsScore ?? qualityAnalysis.overallScore ?? qualityAnalysis.score ?? 75;
                    qualityAnalysis.overallScore = resolvedScore;
                    // The frontend analysis popup reads `score`; older scorers
                    // only returned `overallAtsScore`, which rendered "undefined%".
                    qualityAnalysis.score = resolvedScore;
                    if (!Array.isArray(qualityAnalysis.suggestions)) qualityAnalysis.suggestions = [];
                }
                console.log('✅ Extracted using new Groq Extraction Engine (120B) with dynamic novel sections.');
            } catch (newEngineErr) {
                console.warn('⚠️ New Groq Engine fallback in import-service:', newEngineErr.message);
                parsedData = await parseResumeText(text);
                qualityAnalysis = analyzeResumeQuality(parsedData, text);
            }

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

            res.json({
                success: true,
                data: parsedData,
                analysis: qualityAnalysis,
                meta: { parsedWith: 'Groq-AI-Extraction-Engine-120B' }
            });
        } catch (e) {
            console.error('Import processing error:', e);
            res.status(500).json({ success: false, error: e.message || 'Error processing resume file.' });
        } finally {
            if (req.file && fs.existsSync(req.file.path)) {
                try { fs.unlinkSync(req.file.path); } catch (ign) {}
            }
        }
    });
};

router.post('/import', handleImportRequest);
router.post('/', handleImportRequest);

module.exports = router;
module.exports.parseResumeText = parseResumeText;
module.exports.parseResumeTextRuleBased = parseResumeTextRuleBased;
