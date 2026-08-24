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
// const puppeteer = require('puppeteer');

const pdfParse = require('pdf-parse');
const axios = require('axios');
// Load environment variables if not already loaded (e.g., when running standalone)
if (!process.env.GOOGLE_CLIENT_ID) {
    dotenv.config();
    // Try subfolder if running from root but env is in login-system
    if (!process.env.GOOGLE_CLIENT_ID) {
        dotenv.config({ path: path.join(__dirname, '..', 'login-system', '.env') });
    }
}

const router = express.Router();

console.log('🔑 Auth Routes initialized:');
console.log('   GOOGLE_CLIENT_ID       =', process.env.GOOGLE_CLIENT_ID ? '✅ Loaded' : '❌ Missing');

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

const JWT_SECRET = process.env.JWT_SECRET || 'hiero_jwt_super_secret_key_2026';

// JWT middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : (authHeader || req.query.token);
    if (!token) return res.status(401).json({ error: 'Access denied. Token missing.' });

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) return res.status(403).json({ error: 'Invalid or expired token' });
        req.user = decoded;
        next();
    });
};

// -----------------------------------------------------
// SIGNUP ROUTE
// -----------------------------------------------------
router.post('/signup', async (req, res) => {
    try {
        const { name, username, email, password } = req.body;
        const cleanName = (name || username || '').trim();
        const cleanEmail = (email || '').trim().toLowerCase();
        const cleanPassword = (password || '').trim();

        if (!cleanEmail || !cleanPassword) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        const displayName = cleanName || cleanEmail.split('@')[0];

        // Check in-memory store
        const existingInMemory = users.find(u => u.email && u.email.trim().toLowerCase() === cleanEmail);
        if (existingInMemory) {
            return res.status(400).json({ error: 'An account with this email already exists' });
        }

        // Check MongoDB if connected
        const User = require('../models/User');
        try {
            const existingInDb = await User.findOne({ email: cleanEmail });
            if (existingInDb) {
                return res.status(400).json({ error: 'An account with this email already exists' });
            }
        } catch (e) { }

        const hashedPassword = await bcrypt.hash(cleanPassword, 10);
        const newUserId = String(userIdCounter++);

        const newUser = {
            id: newUserId,
            name: displayName,
            email: cleanEmail,
            password: hashedPassword,
            emailVerified: true,
            signupMethod: 'email',
            createdAt: new Date().toISOString()
        };

        users.push(newUser);
        saveUsers();

        // Save to MongoDB asynchronously
        try {
            await User.create({
                username: displayName,
                email: cleanEmail,
                password: hashedPassword,
                isPro: false
            });
        } catch (e) { }

        const token = jwt.sign(
            { userId: newUser.id, name: newUser.name, email: newUser.email },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.status(201).json({
            success: true,
            message: 'Account created successfully!',
            token,
            user: { id: newUser.id, name: newUser.name, email: newUser.email }
        });

    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({ error: 'Failed to create account. Please try again.' });
    }
});

// -----------------------------------------------------
// VERIFY EMAIL ROUTE
// -----------------------------------------------------
router.get('/verify-email', (req, res) => {
    const { token } = req.query;
    try {
        const { email, userId } = jwt.verify(token, JWT_SECRET);
        const user = users.find(u => u.id === userId && u.email === email);
        if (!user) return res.status(400).json({ error: 'Invalid token' });
        user.emailVerified = true;
        saveUsers();
        res.redirect('/login.html?verified=true');
    } catch {
        res.status(400).json({ error: 'Invalid or expired token' });
    }
});

// -----------------------------------------------------
// LOGIN ROUTE
// -----------------------------------------------------
router.post('/login', async (req, res) => {
    try {
        const { email, name, username, password } = req.body;
        const identifier = (email || name || username || '').trim().toLowerCase();
        const cleanPassword = (password || '').trim();

        if (!identifier || !cleanPassword) {
            return res.status(400).json({ error: 'Please enter your email/username and password' });
        }

        // Search in-memory users array by email, username, or name
        let user = users.find(u => {
            const uEmail = (u.email || '').trim().toLowerCase();
            const uName = (u.name || u.username || '').trim().toLowerCase();
            return uEmail === identifier || uName === identifier;
        });

        // Fallback to MongoDB if not found in memory
        if (!user) {
            const User = require('../models/User');
            try {
                const dbUser = await User.findOne({
                    $or: [
                        { email: identifier },
                        { username: identifier }
                    ]
                });

                if (dbUser) {
                    user = {
                        id: dbUser._id.toString(),
                        name: dbUser.username,
                        email: dbUser.email,
                        password: dbUser.password
                    };
                    // Cache in memory array
                    if (!users.some(u => u.email === dbUser.email)) {
                        users.push(user);
                    }
                }
            } catch (e) { }
        }

        if (!user || !user.password) {
            return res.status(400).json({ error: 'No account found with these credentials' });
        }

        const match = await bcrypt.compare(cleanPassword, user.password);
        if (!match) {
            return res.status(400).json({ error: 'Incorrect password. Please try again.' });
        }

        const token = jwt.sign(
            { userId: user.id, name: user.name, email: user.email },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            success: true,
            token,
            user: { id: user.id, name: user.name, email: user.email, picture: user.picture }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed due to a server error' });
    }
});

// OAuth callbacks
router.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'], prompt: 'select_account' }));
router.get('/auth/google/callback', passport.authenticate('google', { session: false }), (req, res) => {
    const user = { id: req.user.id, name: req.user.name, email: req.user.email, picture: req.user.picture };
    const token = jwt.sign({ userId: user.id, name: user.name, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    const userJson = encodeURIComponent(JSON.stringify(user));
    res.redirect(`/index.html?token=${token}&user=${userJson}`);
});

router.get('/auth/github', passport.authenticate('github', { scope: ['user:email'] }));
router.get('/auth/github/callback', passport.authenticate('github', { session: false }), (req, res) => {
    const user = { id: req.user.id, name: req.user.name, email: req.user.email, picture: req.user.picture };
    const token = jwt.sign({ userId: user.id, name: user.name, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    const userJson = encodeURIComponent(JSON.stringify(user));
    res.redirect(`/index.html?token=${token}&user=${userJson}`);
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

router.post('/logout', (req, res) => {
    res.json({ message: 'Logged out', action: 'clear_token' });
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
