const express = require('express');
const router  = express.Router();
const mongoose = require('mongoose');
const crypto  = require('crypto');

const User          = require('../models/User');
const LoginTracking = require('../models/LoginTracking');
const Resume        = require('../models/Resume');

// ─── PageView MODEL ───────────────────────────────────────────────────────────
const pageViewSchema = new mongoose.Schema({
    page:      { type: String, default: 'unknown' },
    source:    { type: String, default: 'direct' }, // 'qr' | 'direct'
    ip:        { type: String },
    userAgent: { type: String },
    timestamp: { type: Date, default: Date.now }
});
pageViewSchema.index({ timestamp: -1 });
pageViewSchema.index({ page: 1 });
pageViewSchema.index({ source: 1 });
const PageView = mongoose.models.PageView || mongoose.model('PageView', pageViewSchema);

// ─── IN-MEMORY SESSION STORE (localhost only, no need for DB) ─────────────────
const sessions = new Map(); // token → expiry timestamp

function createSession() {
    const token = crypto.randomBytes(32).toString('hex');
    sessions.set(token, Date.now() + 8 * 60 * 60 * 1000); // 8 hour session
    return token;
}

function isValidSession(token) {
    if (!token) return false;
    const expiry = sessions.get(token);
    if (!expiry) return false;
    if (Date.now() > expiry) { sessions.delete(token); return false; }
    return true;
}

// ─── MIDDLEWARE: localhost only ───────────────────────────────────────────────
function localOnly(req, res, next) {
    const host = req.hostname;
    const ok   = host === 'localhost' || host === '127.0.0.1' || host === '::1';
    if (!ok) return res.status(403).json({ error: 'Forbidden — localhost only.' });
    next();
}

// ─── MIDDLEWARE: require valid session token ──────────────────────────────────
function requireSession(req, res, next) {
    const token = req.headers['x-admin-token'] || req.query.token;
    if (!isValidSession(token)) {
        return res.status(401).json({ error: 'Unauthorized — invalid or expired session.' });
    }
    next();
}

// ─── POST /api/admin/login ────────────────────────────────────────────────────
router.post('/login', localOnly, (req, res) => {
    const { password } = req.body;
    const ADMIN_PASS   = process.env.ADMIN_PASSWORD || 'hiero@admin2816';

    if (!password || password !== ADMIN_PASS) {
        return res.status(401).json({ error: 'Wrong password.' });
    }
    const token = createSession();
    res.json({ success: true, token });
});

// ─── POST /api/admin/logout ────────────────────────────────────────────────────
router.post('/logout', (req, res) => {
    const token = req.headers['x-admin-token'];
    if (token) sessions.delete(token);
    res.json({ success: true });
});

// ─── DELETE /api/admin/reset ──────────────────────────────────────────────────
// Wipes the PageView collection so tracking starts fresh from zero.
router.delete('/reset', localOnly, requireSession, async (req, res) => {
    try {
        const result = await PageView.deleteMany({});
        console.log(`[Admin] Analytics reset — deleted ${result.deletedCount} page view records.`);
        res.json({ success: true, deleted: result.deletedCount });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ─── HELPER ───────────────────────────────────────────────────────────────────
function daysAgo(n) {
    const d = new Date();
    d.setDate(d.getDate() - n);
    d.setHours(0, 0, 0, 0);
    return d;
}

// ─── GET /api/admin/stats ─────────────────────────────────────────────────────
router.get('/stats', localOnly, requireSession, async (req, res) => {
    try {
        const totalUsers          = await User.countDocuments();
        const totalLogins         = await LoginTracking.countDocuments();
        const totalResumes        = await Resume.countDocuments();
        const qrScans             = await PageView.countDocuments({ source: 'qr' }).catch(() => 0);
        // Exclude 'admin' page from site-wide view counts so self-visits don't pollute stats
        const totalPageViews      = await PageView.countDocuments({ page: { $ne: 'admin' } }).catch(() => 0);
        const mockInterviewVisits = await PageView.countDocuments({ page: 'mock-interview' }).catch(() => 0);
        const newUsersWeek        = await User.countDocuments({ createdAt: { $gte: daysAgo(7) } });

        // Analysis avg score
        const scoreAgg = await User.aggregate([
            { $unwind: '$analysisHistory' },
            { $group: { _id: null, avg: { $avg: '$analysisHistory.score' } } }
        ]);
        const avgAnalysisScore = scoreAgg[0]?.avg ? Number(scoreAgg[0].avg).toFixed(1) : 'N/A';

        // Daily logins last 30d
        const loginsByDay = await LoginTracking.aggregate([
            { $match: { loginTimestamp: { $gte: daysAgo(30) } } },
            { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$loginTimestamp' } }, count: { $sum: 1 } } },
            { $sort: { _id: 1 } }
        ]);

        // Daily QR scans last 30d
        const qrScansByDay = await PageView.aggregate([
            { $match: { source: 'qr', timestamp: { $gte: daysAgo(30) } } },
            { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } }, count: { $sum: 1 } } },
            { $sort: { _id: 1 } }
        ]).catch(() => []);

        // Daily signups last 30d (kept for reference)
        const signupsByDay = await User.aggregate([
            { $match: { createdAt: { $gte: daysAgo(30) } } },
            { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
            { $sort: { _id: 1 } }
        ]);

        // Page views breakdown
        const pageBreakdown = await PageView.aggregate([
            { $match: { timestamp: { $gte: daysAgo(30) } } },
            { $group: { _id: '$page', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]).catch(() => []);

        // Top 10 most active users
        const topUsers = await LoginTracking.aggregate([
            { $group: { _id: '$userEmail', name: { $last: '$userName' }, loginCount: { $sum: 1 }, lastSeen: { $max: '$loginTimestamp' } } },
            { $sort: { loginCount: -1 } },
            { $limit: 10 }
        ]);

        // Recent signups
        const recentUsers = await User.find({}, 'username email createdAt picture')
            .sort({ createdAt: -1 }).limit(8).lean();

        res.json({
            totals: { totalUsers, totalLogins, totalResumes, qrScans, totalPageViews, mockInterviewVisits, newUsersWeek, avgAnalysisScore },
            charts: { loginsByDay, qrScansByDay, signupsByDay },
            pageBreakdown,
            topUsers,
            recentUsers
        });
    } catch (err) {
        console.error('[Analytics] Stats error:', err);
        res.status(500).json({ error: err.message });
    }
});

// ─── POST /api/admin/pageview ─────────────────────────────────────────────────
// Called by the tracking snippet injected into every page.
// No auth required — this is a lightweight write-only ping.
router.post('/pageview', async (req, res) => {
    try {
        const { page, source } = req.body;
        await PageView.create({
            page:      page   || 'unknown',
            source:    source || 'direct',
            ip:        req.ip,
            userAgent: req.headers['user-agent'],
            timestamp: new Date()
        });
        res.json({ ok: true });
    } catch {
        res.json({ ok: false }); // silent fail — never break the user page
    }
});

module.exports = { router, PageView };
