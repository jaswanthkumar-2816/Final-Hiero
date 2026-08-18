const express = require('express');
const cors = require('cors');
const passport = require('passport');
const dotenv = require('dotenv');
const path = require('path');
const mongoose = require('mongoose');
const compression = require('compression');
const axios = require('axios');
const multer = require('multer');
const { createProxyMiddleware } = require('http-proxy-middleware');

// ✅ FIXED: Always load login-system/.env FIRST (it has JWT_SECRET, EMAIL_USER, etc.)
// Then load root .env which has RAZORPAY and MONGODB_URI overrides
dotenv.config({ path: path.join(__dirname, 'login-system', '.env') });
dotenv.config(); // root .env — existing vars are NOT overwritten, so login-system wins

const app = express();
const PORT = process.env.PORT || 2816;

console.log('🔐 Gateway Startup Logic:');
console.log('   GOOGLE_CLIENT_ID       =', process.env.GOOGLE_CLIENT_ID ? '✅ Loaded' : '❌ Missing');
console.log('   PORT                   =', PORT);

// ======================
// CONFIG & PATHS
// ======================
// ======================
// CONFIG & PATHS
// ======================
const fs = require('fs');
const landingDirPath = path.join(__dirname, 'hiero-prototype', 'jss', 'hiero', 'hiero-last');
const resumeBuilderPath = path.join(landingDirPath, 'public');
const STARTED_HTML = path.join(landingDirPath, 'started.html');

// Debug check for directory existence (Critical for Render/Linux)
console.log('--- Path Verification ---');
console.log('Current Dir:', __dirname);
console.log('Landing Path:', landingDirPath, fs.existsSync(landingDirPath) ? '✅' : '❌');
console.log('Public Path:', resumeBuilderPath, fs.existsSync(resumeBuilderPath) ? '✅' : '❌');
console.log('Started HTML:', STARTED_HTML, fs.existsSync(STARTED_HTML) ? '✅' : '❌');
console.log('------------------------');

app.set('trust proxy', 1);
app.use(compression());
app.use(express.json({ limit: '20mb' }));

// Debug log for all routes
app.use((req, res, next) => {
    console.log(`[GW DEBUG] ${req.method} ${req.path}`);
    next();
});

const PUBLIC_URL = process.env.PUBLIC_URL || 'http://localhost:2816';
function originOf(u) { try { return new URL(u).origin; } catch { return undefined; } }

const allowedOrigins = [
    'http://localhost:8080',
    'http://localhost:8082',
    'http://localhost:8085',
    'http://localhost:5001',
    'http://localhost:5003',
    'http://localhost:2816',
    'http://127.0.0.1:8080',
    'http://127.0.0.1:8082',
    'http://127.0.0.1:8085',
    'http://127.0.0.1:5504',
    'http://127.0.0.1:5001',
    'http://127.0.0.1:5003',
    'http://127.0.0.1:2816',
    'http://localhost:5504',
    'https://85692af7a6b1.ngrok-free.app',
    originOf(PUBLIC_URL),
    ...(process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',').map(s => s.trim()) : [])
].filter(Boolean);

app.use(cors({
    origin: function (origin, callback) {
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) return callback(null, true);
        callback(null, true); // Fallback to true if in development or testing
    },
    credentials: true
}));

app.use(passport.initialize());

// ======================
// DATABASE CONNECTION
// ======================
if (process.env.MONGODB_URI) {
    console.log('⏳ Connecting to MongoDB...');
    mongoose.set('bufferCommands', true);

    // Safe debug: Check first few chars and total length (don't log secrets)
    const uri = process.env.MONGODB_URI;
    console.log(`[DB Debug] URI starts with: "${uri.substring(0, 5)}...", Total length: ${uri.length}`);

    mongoose.connect(process.env.MONGODB_URI)
        .then(() => console.log('✅ MongoDB connected successfully'))
        .catch(err => {
            console.error('❌ MongoDB connection error:', err.message);
            console.error('Check your MONGODB_URI environment variable on Render.');
        });
} else {
    console.warn('⚠️ MONGODB_URI is not defined. Database features will fail!');
}

// ======================
// AUTH ROUTER (Integrated)
// ======================
const authObj = require('./routes/auth');
app.use('/', authObj.router);

// ======================
// PROXIES & INTEGRATED ROUTES
// ======================

// Dashboard Static Serving (Replaces non-functional localhost proxy)
// This ensures that links like /dashboard/styles.css work correctly.
app.use('/dashboard', express.static(resumeBuilderPath));
app.use('/dashboard', express.static(landingDirPath));
app.use('/public/dashboard', express.static(resumeBuilderPath)); // Fix for nested paths

// Profile endpoint (Integrated)
app.get('/api/me', authObj.authenticateToken, (req, res) => {
    const user = authObj.users.find(u => u.id === req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ id: user.id, name: user.name, email: user.email, picture: user.picture });
});

// Legacy API (for frontend compat)
app.get('/dashboard', authObj.authenticateToken, (req, res, next) => {
    // If request accepts JSON, handle as API. If not, it's probably a navigation (allow static to take over)
    if (req.accepts('json')) {
        const user = authObj.users.find(u => u.id === req.user.id);
        if (!user) return res.status(404).json({ error: 'User not found' });
        return res.json({ id: user.id, name: user.name, email: user.email, picture: user.picture });
    }
    next();
});


// 📄 Resume API (Integrated!)
// Mount Import Service FIRST to handle /import requests effectively
const importRouter = require('./routes/import-service');
const resumeRouter = require('./routes/resume');
app.use('/api/resume', resumeRouter);

// Support templates and preview folder sharing
app.use('/templates/previews', express.static(path.join(__dirname, 'hiero-backend', 'templates', 'previews')));
app.use('/dashboard/previews', express.static(path.join(__dirname, 'hiero-backend', 'templates', 'previews')));


// Reviews & Admin API (Integrated - No Proxy!)
const reviewRouter = require('./routes/review');
app.use('/api', reviewRouter); // Handles /api/review, /api/login-track, /api/admin/*

// Analysis API (Integrated)
const analysisRouter = require('./routes/analysis');
app.use('/api/analysis', analysisRouter); // Supports /api/analysis/analyze

// Projects API (Integrated)
const projectsRouter = require('./routes/projects');
app.use('/api/projects', projectsRouter); // Supports /youtube, /github, /docs, /chat

// Scoring API (Integrated)
const scoringRouter = require('./routes/scoring');
app.use('/api/scoring', scoringRouter); // Supports /user-stats, /project-complete

// Chat API (Integrated)
const chatRouter = require('./routes/chat');
app.use('/api/chat', chatRouter);

// Reel API (Integrated)
const reelRouter = require('./routes/reel');
app.use('/api/reel', reelRouter);

// Run API (Integrated)
const runRouter = require('./routes/run');
app.use('/api/run', runRouter);

// Mastery Engine API (Integrated)
const masteryRouter = require('./routes/mastery');
app.use('/api/mastery', masteryRouter);

// Targeted Multilingual Micro-Curriculum Engine API (New!)
const learningRouter = require('./routes/learning');
app.use('/api/learning', learningRouter);

// AI Photo Formalizer API (New!)
const aiPhotoRouter = require('./routes/ai-photo');
app.use('/api', aiPhotoRouter); // Handles /api/generate-executive-photo

// Payment API (Integrated)
const paymentRouter = require('./routes/payment');
app.use('/api/payment', paymentRouter);

// Support legacy shortened paths
app.use('/auth/signup', (req, res) => res.redirect(307, '/signup'));
app.use('/auth/login', (req, res) => res.redirect(307, '/login'));
app.use('/auth/verify-email', (req, res) => res.redirect(307, '/verify-email'));

// Root UI
app.get('/', (req, res) => {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.sendFile(STARTED_HTML);
});

// Explicit UI Routes
app.get(['/login', '/login.html'], (req, res) => res.sendFile(path.join(landingDirPath, 'login.html')));
app.get(['/signup', '/signup.html'], (req, res) => res.sendFile(path.join(landingDirPath, 'signup.html')));
app.get(['/index', '/index.html'], (req, res) => {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.sendFile(path.join(resumeBuilderPath, 'index.html'));
});

app.get(['/dashboard', '/dashboard.html'], (req, res) => {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.sendFile(path.join(resumeBuilderPath, 'dashboard.html'));
});

// Route /get-started to the role selection page
app.get('/get-started', (req, res) => {
    res.sendFile(path.join(landingDirPath, 'role-selection.html'));
});

app.get(['/mock-interview', '/mock-interview.html'], (req, res) => res.sendFile(path.join(__dirname, 'mock-interview.html')));
app.get(['/result', '/result.html'], (req, res) => res.sendFile(path.join(__dirname, 'result.html')));
app.get(['/companies', '/companies.html'], (req, res) => res.sendFile(path.join(__dirname, 'companies.html')));
app.get(['/company', '/company.html'], (req, res) => res.sendFile(path.join(__dirname, 'company.html')));
app.get(['/job_success', '/job_success.html'], (req, res) => res.sendFile(path.join(__dirname, 'job_success.html')));
app.get(['/success', '/success.html'], (req, res) => res.sendFile(path.join(resumeBuilderPath, 'success.html')));
app.get('/sitemap.xml', (req, res) => res.sendFile(path.join(landingDirPath, 'sitemap.xml')));
app.get('/robots.txt', (req, res) => res.sendFile(path.join(landingDirPath, 'robots.txt')));

app.get(['/learn', '/learn.html'], (req, res) => res.sendFile(path.join(resumeBuilderPath, 'learn.html')));
app.get(['/quiz', '/quiz.html'], (req, res) => res.sendFile(path.join(resumeBuilderPath, 'quiz.html')));
app.get(['/solve', '/solve.html'], (req, res) => res.sendFile(path.join(__dirname, 'solve.html')));
app.get(['/resume-builder', '/resume-builder.html', '/dashboard/resume-builder'], (req, res) => {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.sendFile(path.join(resumeBuilderPath, 'resume-builder.html'));
});
app.get(['/resume-form', '/resume-form.html'], (req, res) => {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.sendFile(path.join(resumeBuilderPath, 'resume-form.html'));
});
app.get(['/pricing', '/pricing.html'], (req, res) => res.sendFile(path.join(__dirname, 'pricing.html')));
app.get(['/template-verifier', '/template-verifier.html'], (req, res) => res.sendFile(path.join(__dirname, 'template-verifier.html')));
app.get(['/feedback', '/feedback.html'], (req, res) => res.sendFile(path.join(__dirname, 'feedback.html')));
app.get(['/design-tester', '/design-tester.html'], (req, res) => res.sendFile(path.join(__dirname, 'design-tester.html')));
app.get(['/project', '/project.html'], (req, res) => res.sendFile(path.join(__dirname, 'project.html')));
app.get(['/analysis', '/analysis.html'], (req, res) => res.sendFile(path.join(resumeBuilderPath, 'analysis.html')));
app.get(['/companies', '/companies.html'], (req, res) => res.sendFile(path.join(resumeBuilderPath, 'companies.html')));
app.get(['/ai-photo-formalizer', '/ai-photo-formalizer.html'], (req, res) => res.sendFile(path.join(resumeBuilderPath, 'ai-photo-formalizer.html')));

// ======================
// STATIC FILES
// ======================
app.use(express.static(__dirname, { index: false }));           // ← root SVGs (microsoft.svg, google.svg etc.)
app.use(express.static(landingDirPath, { index: false }));
app.use(express.static(resumeBuilderPath, { index: false }));
app.use('/public', express.static(resumeBuilderPath));
app.use(express.static(path.join(__dirname, 'login-system'), { index: false }));
app.use('/Admin', express.static(path.join(__dirname, 'Admin'), { index: false }));
app.use('/Admin folder', express.static(path.join(__dirname, 'Admin folder'), { index: false }));

// ======================
// SPA FALLBACK & FINAL ANALYSIS FALLBACK
// ======================
app.get('*', (req, res, next) => {
    if (path.extname(req.path) !== '') return next();
    if (!req.path.startsWith('/api') && !req.path.startsWith('/auth') && !req.path.startsWith('/dashboard')) {
        return res.sendFile(STARTED_HTML);
    }
    next();
});

// Final fallback for legacy /api/analyze if not caught by reviewRouter
app.use('/api', analysisRouter);

// --- Interview Router Module ---
const interviewRouter = require('./routes/interview');
app.use('/api/interview', interviewRouter);

// --- Problems Router Module ---
const problemsRouter = require('./routes/problems');
app.use('/api/problems', problemsRouter);

// --- Adaptive Mastery Skill Graph Module ---
const adaptiveRouter = require('./routes/adaptive-mastery');
app.use('/api/adaptive', adaptiveRouter);

// ======================
// START SERVER
// ======================
app.listen(PORT, () => {
    console.log(`
🚀 Unified Gateway LIVE at http://localhost:${PORT}
   📁 Landing UI         → Integrated (Port ${PORT})
   🔐 Auth System        → Integrated (Port ${PORT})
   ⭐️ Review System       → Integrated (Port ${PORT}) [NEW]
   🧠 Analysis System     → Integrated (Port ${PORT})
   
   📊 Integrated Systems:
      - /dashboard        → Serves Static UI
      - /api/resume       → Native Controller
      - /api/analysis     → AI Engine
      - /api/review       → MongoDB Storage

`);
});
