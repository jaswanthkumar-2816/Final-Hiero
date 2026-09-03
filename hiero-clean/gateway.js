/**
 * HIERO — Clean Gateway
 * Pure orchestration: config → middleware → modules → listen.
 * This file should stay under 80 lines. All logic lives in modules/.
 */

// ─── 1. CONFIG ─────────────────────────────────────────
require('dotenv').config({ path: require('path').join(__dirname, '.env') });

const express = require('express');
const cors = require('cors');
const passport = require('passport');
const compression = require('compression');
const { connectDatabase } = require('./config/database');
const { configurePassport } = require('./config/passport');
const { PORT, PUBLIC_DIR, CORS_ORIGINS } = require('./config/constants');

const app = express();

// ─── 2. MIDDLEWARE ─────────────────────────────────────
app.use(compression());
app.use(express.json({ limit: '20mb' }));
app.use(cors({ origin: CORS_ORIGINS, credentials: true }));
app.use(passport.initialize());
configurePassport();

// ─── 3. STATIC FILES ───────────────────────────────────
app.use(express.static(PUBLIC_DIR));

// ─── 4. MODULES ────────────────────────────────────────
// Auth (mounts at root for /signup, /login, /auth/google, etc.)
app.use('/', require('./modules/auth/auth.routes'));

// API modules
app.use('/api/mastery', require('./modules/mastery/mastery.routes'));
app.use('/api/learning', require('./modules/learning/learning.routes'));
app.use('/api/analysis', require('./modules/analysis/analysis.routes'));
app.use('/api/problems', require('./modules/problems/problems.routes'));

// ─── 5. PAGE ROUTES ────────────────────────────────────
const send = (file) => (req, res) => res.sendFile(require('path').join(PUBLIC_DIR, file));
app.get(['/login', '/login.html'], send('auth/login.html'));
app.get(['/signup', '/signup.html'], send('auth/signup.html'));
app.get(['/index', '/index.html', '/'], send('index.html'));
app.get(['/dashboard', '/dashboard.html'], send('dashboard.html'));
app.get(['/learn', '/learn.html'], send('learn/index.html'));
app.get(['/quiz', '/quiz.html'], send('learn/quiz.html'));
app.get(['/solve', '/solve.html'], send('solve.html'));
app.get(['/analysis', '/analysis.html'], send('analysis/index.html'));

// ─── 6. ERROR HANDLING ─────────────────────────────────
const { notFound, errorHandler } = require('./middleware/errorHandler');
app.use(notFound);
app.use(errorHandler);

// ─── 7. START ──────────────────────────────────────────
(async () => {
    await connectDatabase();
    app.listen(PORT, () => {
        console.log(`\n🚀 HIERO Gateway LIVE at http://localhost:${PORT}`);
        console.log(`   📁 Public: ${PUBLIC_DIR}`);
        console.log(`   🔐 Auth:   /signup, /login, /auth/google`);
        console.log(`   🧠 Mastery: /api/mastery/*`);
        console.log(`   📚 Learning: /api/learning/*`);
        console.log(`   📊 Analysis: /api/analysis/*`);
        console.log(`   💻 Problems: /api/problems/*\n`);
    });
})();
