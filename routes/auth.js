const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const GitHubStrategy = require('passport-github2').Strategy;
const nodemailer = require('nodemailer');
const multer = require('multer');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const puppeteer = require('puppeteer');

const pdfParse = require('pdf-parse');
const axios = require('axios');
dotenv.config();

const router = express.Router();

// Public URL for redirects (gateway URL)
const PUBLIC_URL = process.env.PUBLIC_URL || 'http://localhost:2816';

// No global browser instance - launch per request to avoid crashes

// Users store (Persistence added to prevent losing data on restart)
const USERS_FILE = path.join(__dirname, '..', 'users.json');
// ✨ Helper: Extract text from PDF file
async function extractTextFromPdf(filePath) {
    try {
        const dataBuffer = fs.readFileSync(filePath);
        const data = await pdfParse(dataBuffer);
        const text = data.text || '';
        if (!text.trim()) {
            console.warn('⚠️ PDF appears to be empty or image-based');
            return '';
        }
        return text;
    } catch (error) {
        console.error('PDF extraction error:', error);
        return '';
    }
}

const { generateTemplateHTML } = require('./templates');

// ✨ Helper: Extract sections by keywords
function extractSection(text, keywords) {
    const lowerText = text.toLowerCase();
    const lines = text.split('\n');
    for (const keyword of keywords) {
        const headerIndex = lowerText.indexOf(keyword);
        if (headerIndex !== -1) {
            let currentPos = 0;
            let startLine = 0;
            for (let i = 0; i < lines.length; i++) {
                currentPos += lines[i].length + 1;
                if (currentPos > headerIndex) {
                    startLine = i + 1;
                    break;
                }
            }
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

// ✨ Helper: Smart Regex Extraction
function extractBlock(text, keywords) {
    const lines = text.split('\n');
    const startIdx = lines.findIndex(l => keywords.some(k => l.trim().toLowerCase() === k || l.trim().toLowerCase().startsWith(k + ' ')));
    if (startIdx === -1) return [];

    // Find next section header
    const nextSectionIdx = lines.slice(startIdx + 1).findIndex(l => {
        const line = l.trim().toLowerCase();
        return ['experience', 'education', 'skills', 'projects', 'certifications', 'references', 'languages'].some(k => line === k || line.startsWith(k + ' '));
    });

    const endIdx = nextSectionIdx === -1 ? lines.length : (startIdx + 1 + nextSectionIdx);
    return lines.slice(startIdx + 1, endIdx).filter(l => l.trim().length > 0);
}

async function mapResumeToFormFields(rawText) {
    const cleanText = rawText.replace(/\r/g, '\n').replace(/\t/g, ' ');
    const lines = cleanText.split('\n').map(l => l.trim()).filter(l => l);

    // 1. Contact Info
    const email = (cleanText.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4})/)?.[0]) || '';
    const phone = (cleanText.match(/(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/)?.[0]) || '';
    const linkedin = (cleanText.match(/linkedin\.com\/in\/([a-zA-Z0-9-]+)/)?.[0]) || '';

    // Name Heuristic: First line that isn't a contact label
    let fullName = '';
    for (let i = 0; i < 5; i++) {
        if (lines[i] && !lines[i].includes('@') && lines[i].length > 3 && !lines[i].match(/\d/) && lines[i].split(' ').length < 5) {
            fullName = lines[i];
            break;
        }
    }

    // 2. Experience
    const expLines = extractBlock(cleanText, ['experience', 'work experience', 'employment']);
    const experience = [];
    if (expLines.length > 0) {
        // Naive parser: Assume first line is role/company, rest is desc
        // Better: look for date patterns
        let currentExp = null;
        for (const line of expLines) {
            // Check for date pattern like "Jan 2020 - Present" or "2019-2022"
            const isDate = line.match(/\d{4}/) && (line.includes('-') || line.toLowerCase().includes('present'));

            if (isDate || !currentExp) {
                if (currentExp) experience.push(currentExp);
                currentExp = {
                    jobTitle: isDate ? "Role/Title" : line, // Fallback title
                    company: isDate ? "Company" : "",       // Placeholder
                    startDate: isDate ? line : "",
                    endDate: "",
                    description: ""
                };
            } else {
                currentExp.description += line + '\n';
            }
        }
        if (currentExp) experience.push(currentExp);
    }

    // 3. Education
    const eduLines = extractBlock(cleanText, ['education', 'academic']);
    const education = eduLines.map(line => {
        if (line.match(/university|college|institute/i)) return { school: line, degree: "", gradYear: "" };
        if (line.match(/bachelor|master|phd|diploma|degree/i)) return { degree: line, school: "", gradYear: "" };
        return null;
    }).filter(e => e) || [];
    // Merge adjacent edu lines (simple heuristic)
    if (education.length === 0 && eduLines.length > 0) {
        education.push({ school: eduLines[0], degree: eduLines[1] || '', gradYear: '' });
    }

    // 4. Skills
    const skillLines = extractBlock(cleanText, ['skills', 'technical skills', 'technologies']);
    const skills = skillLines.join(', ');

    return {
        personalInfo: { fullName, email, phone, linkedin, address: '' },
        summary: cleanText.slice(0, 300).replace(/\n/g, ' '), // First few chars as summary fallback
        technicalSkills: skills,
        softSkills: '',
        experience: experience.length ? experience : [],
        education: education.length ? education : [],
        projects: [],
        certifications: [],
        languages: [],
        achievements: [],
        hobbies: []
    };
}

let users = [];
try {
    if (fs.existsSync(USERS_FILE)) {
        users = JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
        console.log(`✅ Loaded ${users.length} users from persistence`);
    }
} catch (err) {
    console.error('❌ Error loading users file:', err.message);
}

function saveUsers() {
    try {
        fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
    } catch (err) {
        console.error('❌ Error saving users file:', err.message);
    }
}

let userIdCounter = users.length > 0 ? Math.max(...users.map(u => u.id || 0)) + 1 : 1;

// Multer upload config
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});
const upload = multer({ storage });
if (!fs.existsSync('uploads')) fs.mkdirSync('uploads', { recursive: true });

// Email Configuration
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

// Google Auth
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID || 'dummy',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'dummy',
    callbackURL: process.env.LOCAL_GOOGLE_CALLBACK_URL || process.env.GOOGLE_CALLBACK_URL || `${PUBLIC_URL}/auth/google/callback`,
}, (accessToken, refreshToken, profile, done) => {
    let user = users.find(u => u.googleId === profile.id);
    const email = profile.emails?.[0]?.value || 'default@example.com';
    if (!user) {
        user = {
            id: userIdCounter++,
            googleId: profile.id,
            email,
            name: profile.displayName,
            emailVerified: true,
            signupMethod: 'google',
            picture: profile.photos?.[0]?.value || null,
        };
        users.push(user);
        saveUsers();
    } else {
        // Update picture if it's a returning user
        user.picture = profile.photos?.[0]?.value || user.picture;
        saveUsers();
    }
    return done(null, user);
}));

// GitHub Auth
passport.use(new GitHubStrategy({
    clientID: process.env.LOCAL_GITHUB_CLIENT_ID || process.env.GITHUB_CLIENT_ID || 'dummy',
    clientSecret: process.env.LOCAL_GITHUB_CLIENT_SECRET || process.env.GITHUB_CLIENT_SECRET || 'dummy',
    callbackURL: process.env.LOCAL_GITHUB_CALLBACK_URL || process.env.GITHUB_CALLBACK_URL || `${PUBLIC_URL}/auth/github/callback`,
}, (accessToken, refreshToken, profile, done) => {
    let user = users.find(u => u.githubId === profile.id);
    const email = profile.emails?.[0]?.value || 'default@example.com';
    if (!user) {
        user = {
            id: userIdCounter++,
            githubId: profile.id,
            email,
            name: profile.displayName || profile.username,
            emailVerified: true,
            signupMethod: 'github',
            picture: profile.photos?.[0]?.value || null,
        };
        users.push(user);
        saveUsers();
    } else {
        // Update picture if it's a returning user
        user.picture = profile.photos?.[0]?.value || user.picture;
        saveUsers();
    }
    return done(null, user);
}));

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser((id, done) => {
    const user = users.find(u => u.id === id);
    done(null, user);
});

// JWT middleware
const authenticateToken = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Access denied' });

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) return res.status(403).json({ error: 'Invalid token' });
        req.user = decoded; // Pass full payload (contains email, name, userId)
        next();
    });
};

// Signup Route
router.post('/signup', async (req, res) => {
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: 'All fields required' });

    const existingUser = users.find(u => u.email === email.trim().toLowerCase());
    if (existingUser) return res.status(400).json({ error: 'User already exists' });

    const hashedPassword = await bcrypt.hash(password.trim(), 10);
    const user = {
        id: userIdCounter++,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password: hashedPassword,
        emailVerified: false,
        signupMethod: 'email',
    };
    users.push(user);
    saveUsers();

    const token = jwt.sign({ email: user.email, userId: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    const link = `${PUBLIC_URL}/verify-email?token=${token}`;

    try {
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: user.email,
            subject: `Verify Your Hiero Account`,
            html: `<p>Please <a href="${link}">click here</a> to verify your account.</p>`
        });
        res.status(201).json({ message: 'Account created! Check your email.' });
    } catch (err) {
        res.status(201).json({ message: 'Account created! (Email sending failed)', verificationLink: link });
    }
});

// Verify Email
router.get('/verify-email', (req, res) => {
    const { token } = req.query;
    try {
        const { email, userId } = jwt.verify(token, process.env.JWT_SECRET);
        const user = users.find(u => u.id === userId && u.email === email);
        if (!user) return res.status(400).json({ error: 'Invalid token' });
        user.emailVerified = true;
        res.redirect('/login?verified=true');
    } catch {
        res.status(400).json({ error: 'Invalid or expired token' });
    }
});

// Login
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    const user = users.find(u => u.email && u.email.trim().toLowerCase() === email.trim().toLowerCase());
    if (!user || !user.password) return res.status(400).json({ error: 'Invalid credentials' });

    const match = await bcrypt.compare(password.trim(), user.password);
    if (!match) return res.status(400).json({ error: 'Incorrect password' });

    if (!user.emailVerified) return res.status(400).json({ error: 'Email not verified' });

    const token = jwt.sign({ userId: user.id, name: user.name, email: user.email }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, picture: user.picture } });
});

// OAuth callbacks
router.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get('/auth/google/callback', passport.authenticate('google', { session: false }), (req, res) => {
    const user = { id: req.user.id, name: req.user.name, email: req.user.email, picture: req.user.picture };
    const token = jwt.sign({ userId: user.id, name: user.name, email: user.email }, process.env.JWT_SECRET, { expiresIn: '7d' });
    const userJson = encodeURIComponent(JSON.stringify(user));
    res.redirect(`/public/index.html?token=${token}&user=${userJson}`);
});

router.get('/auth/github', passport.authenticate('github', { scope: ['user:email'] }));
router.get('/auth/github/callback', passport.authenticate('github', { session: false }), (req, res) => {
    const user = { id: req.user.id, name: req.user.name, email: req.user.email, picture: req.user.picture };
    const token = jwt.sign({ userId: user.id, name: user.name, email: user.email }, process.env.JWT_SECRET, { expiresIn: '7d' });
    const userJson = encodeURIComponent(JSON.stringify(user));
    res.redirect(`/public/index.html?token=${token}&user=${userJson}`);
});

// User info
router.get('/me', authenticateToken, (req, res) => {
    const user = users.find(u => u.id === req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ id: user.id, name: user.name, email: user.email });
});

// ======================
// RESUME TEMPLATES
// ======================
// DELETED OLD GENERATOR - MOVED TO TOP

// ======================
// RESUME ROUTES
// ======================

router.post('/api/resume/import', upload.single('resume'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ success: false, error: 'No file uploaded' });

        console.log('📄 Resume import request received:', req.file.originalname);
        const text = await extractTextFromPdf(req.file.path);
        const extractedData = await mapResumeToFormFields(text);

        // Clean up temp file
        if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);

        res.json({ success: true, data: extractedData });
    } catch (error) {
        console.error('Import error:', error);
        res.status(500).json({ success: false, error: 'Failed to parse resume', details: error.message });
    }
});

router.post('/generate-resume', async (req, res) => {
    res.json({ success: true, message: 'Resume ready', template: req.body.template });
});

const { generateUnifiedResume } = require('./unifiedTemplates');

// Helper to normalize data for PDFKit templates
function normalizeDataForPdf(data) {
    // Basic normalization to ensure fields exist
    return {
        ...data,
        personalInfo: {
            fullName: data.personalInfo?.fullName || '',
            email: data.personalInfo?.email || '',
            phone: data.personalInfo?.phone || '',
            address: data.personalInfo?.address || '',
            linkedin: data.personalInfo?.linkedin || '',
            github: data.personalInfo?.github || '',
            website: data.personalInfo?.website || ''
        },
        experience: Array.isArray(data.experience) ? data.experience : [],
        education: Array.isArray(data.education) ? data.education : [],
        projects: Array.isArray(data.projects) ? data.projects : [],
        technicalSkills: data.technicalSkills || '',
        softSkills: data.softSkills || '',
        certifications: data.certifications || [],
        achievements: data.achievements || [],
        languages: data.languages || '',
        hobbies: data.hobbies || '',
        references: Array.isArray(data.references) ? data.references : [],
        customDetails: Array.isArray(data.customDetails) ? data.customDetails : []
    };
}

router.post('/download-resume', async (req, res) => {
    try {
        const resumeData = normalizeDataForPdf(req.body);
        const template = resumeData.template || 'classic';
        const filename = (resumeData.personalInfo?.fullName || 'resume').replace(/[^a-z0-9]/gi, '_');

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}.pdf"`);

        // Generate and pipe directly to response
        await generateUnifiedResume(resumeData, template, res);

    } catch (error) {
        console.error('PDF Generation Error:', error);
        if (!res.headersSent) {
            res.status(500).json({ error: 'Failed to generate PDF', details: error.message });
        }
    }
});

router.post('/preview-resume', async (req, res) => {
    try {
        console.log('🔍 Preview request for template:', req.body.template);
        const html = generateTemplateHTML(req.body.template || 'classic', req.body);
        res.setHeader('Content-Type', 'text/html');
        res.send(html);
    } catch (error) {
        console.error('❌ Preview error:', error);
        res.status(500).json({ error: 'Failed to preview', details: error.message });
    }
});

router.post('/logout', (req, res) => {
    res.json({ message: 'Logged out', action: 'clear_token' });
});

router.get('/health', (req, res) => res.json({ status: 'ok', service: 'auth-integrated' }));

module.exports = {
    router,
    users,
    authenticateToken
};
