const express = require('express');
const cors = require('cors');
const passport = require('passport');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
const path = require('path');
const mongoose = require('mongoose');
const compression = require('compression');
const axios = require('axios');
const { createProxyMiddleware } = require('http-proxy-middleware');

const { execSync } = require('child_process');
dotenv.config();

// Auto-fix EADDRINUSE (Fixes "address already in use" errors)
const PORT = process.env.PORT || 2816;
if (process.env.NODE_ENV !== 'production' && process.platform === 'win32') {
    try {
        const checkPortOutput = execSync(`netstat -ano | findstr :${PORT}`).toString();
        const pids = [...new Set(checkPortOutput.split('\n')
            .map(line => line.trim().split(/\s+/).pop())
            .filter(pid => pid && pid !== process.pid.toString() && !isNaN(pid)))];
            
        pids.forEach(pid => {
            console.log(`🧹 Auto-clearing port ${PORT} (Terminating process ${pid})...`);
            execSync(`taskkill /F /PID ${pid} /T 2>NUL`);
        });
    } catch (e) { /* Port is free */ }
}

// Backup: Try to load from login-system/.env if root .env didn't provide critical variables
if (!process.env.GOOGLE_CLIENT_ID) {
    dotenv.config({ path: path.join(__dirname, 'login-system', '.env') });
}

const app = express();


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
app.use(cookieParser());

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
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch(err => console.error("❌ MongoDB Connection Error:", err));

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
app.use('/api/resume', importRouter);

const resumeRouter = require('./routes/resume');
app.use('/api/resume', resumeRouter);

// 🚀 Projects Portal API (Groq-powered)
const projectsRouter = require('./routes/projects');
app.use('/api/projects', projectsRouter);


// Support templates and preview folder sharing
app.use('/templates/previews', express.static(path.join(__dirname, 'hiero-backend', 'templates', 'previews')));
app.use('/dashboard/previews', express.static(path.join(__dirname, 'hiero-backend', 'templates', 'previews')));


// Reviews & Admin API (Integrated - No Proxy!)
const reviewRouter = require('./routes/review');
app.use('/api', reviewRouter); // Handles /api/review, /api/login-track, /api/admin/*

// Analysis API (Integrated)
const analysisRouter = require('./routes/analysis');
app.use('/api/analysis', analysisRouter); // Supports /api/analysis/analyze

// Scoring & Project Outcomes API (New!)
const scoringRouter = require('./routes/scoring');
app.use('/api/scoring', scoringRouter); // Handles /api/scoring/project-complete

// AI Photo Formalizer API (New!)
const aiPhotoRouter = require('./routes/ai-photo');
app.use('/api', aiPhotoRouter); // Handles /api/generate-executive-photo

// Orbit Neural Assistant Chat API (New!)
const chatRouter = require('./routes/chat');
app.use('/api', chatRouter); // Handles /api/chat

// Python Code Execution API (New!)
const runRouter = require('./routes/run');
app.use('/api', runRouter); // Handles /api/run

// QR Tracking + Link Hub (New!)
const qrRoutes = require('./hiero-backend/modules/qr-hub/routes/qr.routes.cjs');
app.use('/q', qrRoutes); // Handles /q, /q/go/*, /q/admin/*

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

app.get(['/mock-interview', '/mock-interview.html'], (req, res) => res.sendFile(path.join(resumeBuilderPath, 'mock-interview.html')));
app.get('/sitemap.xml', (req, res) => res.sendFile(path.join(landingDirPath, 'sitemap.xml')));
app.get('/robots.txt', (req, res) => res.sendFile(path.join(landingDirPath, 'robots.txt')));

app.get(['/learn', '/learn.html'], (req, res) => res.sendFile(path.join(resumeBuilderPath, 'learn.html')));
app.get(['/solve', '/solve.html'], (req, res) => res.sendFile(path.join(resumeBuilderPath, 'solve.html')));
app.get(['/resume-builder', '/resume-builder.html', '/dashboard/resume-builder'], (req, res) => res.sendFile(path.join(resumeBuilderPath, 'resume-builder.html')));
app.get(['/resume-form', '/resume-form.html'], (req, res) => res.sendFile(path.join(resumeBuilderPath, 'resume-form.html')));
app.get(['/project', '/project.html', '/dashboard/project.html'], (req, res) => res.sendFile(path.join(resumeBuilderPath, 'coming-soon.html')));
app.get(['/interview', '/interview.html', '/mock-interview', '/mock-interview.html', '/dashboard/mock-interview.html'], (req, res) => res.sendFile(path.join(resumeBuilderPath, 'mock-interview.html')));


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

// --- Groq AI Interview Chat ---
app.post('/api/interview/chat', async (req, res) => {
    try {
        const { messages } = req.body;
        if (!process.env.GROQ_API_KEY) {
            return res.status(500).json({ error: 'Groq API Key not configured' });
        }

        const response = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
            model: process.env.AI_MODEL || 'grok-beta',
            messages: messages,
            temperature: 0.7,
            max_tokens: 150
        }, {
            headers: {
                'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        res.json(response.data);
    } catch (error) {
        console.error('Groq API Error:', error.response ? error.response.data : error.message);
        res.status(500).json({
            error: 'AI service error',
            details: error.response ? error.response.data : error.message
        });
    }
});

// ======================
// START SERVER
// ======================
const server = app.listen(PORT, () => {
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
      - /q                → QR Hub & Tracking [NEW]

`);
}).on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`\n❌ Error: Port ${PORT} is already in use.`);
        console.error(`💡 Hiero Auto-Fix: We attempted to clear the port, but it's still busy.`);
        console.error(`👉 Solution: Please wait a moment or manually close any open Hiero terminals.\n`);
        process.exit(1);
    } else {
        throw err;
    }
});
