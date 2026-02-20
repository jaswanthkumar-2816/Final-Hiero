const express = require('express');
const cors = require('cors');
const passport = require('passport');
const dotenv = require('dotenv');
const path = require('path');
const mongoose = require('mongoose');
const compression = require('compression');
const { createProxyMiddleware } = require('http-proxy-middleware');

dotenv.config();

// Backup: Try to load from login-system/.env if root .env didn't provide critical variables
if (!process.env.GOOGLE_CLIENT_ID) {
    dotenv.config({ path: path.join(__dirname, 'login-system', '.env') });
}

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

// Debug log for auth/OAuth routes
app.use((req, res, next) => {
    if (req.path.startsWith('/auth') || req.path.startsWith('/api')) {
        console.log(`[GW] ${req.method} ${req.originalUrl}`);
    }
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

// Profile endpoint
app.get('/dashboard', authObj.authenticateToken, (req, res) => {
    const user = authObj.users.find(u => u.id === req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ id: user.id, name: user.name, email: user.email, picture: user.picture });
});

// ======================
// PROXIES & INTEGRATED ROUTES
// ======================

// Dashboard Static Serving (Replaces non-functional localhost proxy)
// This ensures that links like /dashboard/styles.css work correctly.
app.use('/dashboard', express.static(resumeBuilderPath));
app.use('/dashboard', express.static(landingDirPath));
app.use('/public/dashboard', express.static(resumeBuilderPath)); // Fix for nested paths


// 📄 Resume API (Integrated!)
// Mount Import Service FIRST to handle /import requests effectively
const importRouter = require('./routes/import-service');
app.use('/api/resume', importRouter);

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

// AI Photo Formalizer API (New!)
const aiPhotoRouter = require('./routes/ai-photo');
app.use('/api', aiPhotoRouter); // Handles /api/generate-executive-photo

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
app.get('/dashboard.html', (req, res) => res.sendFile(path.join(resumeBuilderPath, 'dashboard.html')));

// Route /get-started to the role selection page
app.get('/get-started', (req, res) => {
    res.sendFile(path.join(landingDirPath, 'role-selection.html'));
});

app.get('/sitemap.xml', (req, res) => res.sendFile(path.join(landingDirPath, 'sitemap.xml')));
app.get('/robots.txt', (req, res) => res.sendFile(path.join(landingDirPath, 'robots.txt')));

app.get(['/learn', '/learn.html'], (req, res) => res.sendFile(path.join(resumeBuilderPath, 'learn.html')));
app.get(['/solve', '/solve.html'], (req, res) => res.sendFile(path.join(resumeBuilderPath, 'solve.html')));
app.get(['/resume-builder', '/resume-builder.html', '/dashboard/resume-builder'], (req, res) => res.sendFile(path.join(resumeBuilderPath, 'resume-builder.html')));
app.get(['/resume-form', '/resume-form.html'], (req, res) => res.sendFile(path.join(resumeBuilderPath, 'resume-form.html')));
app.get(['/project', '/project.html'], (req, res) => res.sendFile(path.join(resumeBuilderPath, 'project.html')));
app.get(['/analysis', '/analysis.html'], (req, res) => res.sendFile(path.join(resumeBuilderPath, 'analysis.html')));
app.get(['/ai-photo-formalizer', '/ai-photo-formalizer.html'], (req, res) => res.sendFile(path.join(resumeBuilderPath, 'ai-photo-formalizer.html')));

// ======================
// STATIC FILES
// ======================
app.use(express.static(landingDirPath, { index: false }));
app.use(express.static(resumeBuilderPath, { index: false }));
app.use('/public', express.static(resumeBuilderPath));
app.use(express.static(path.join(__dirname, 'login-system'), { index: false }));

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
