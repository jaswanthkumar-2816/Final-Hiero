// ============================================================
// Connect — recruiter authentication
// ============================================================
// Company-side sign-in for the Connect portal. Separate from the student
// auth in routes/auth.js on purpose: a recruiter reads other people's
// data, so their token says which company they are and every Connect
// query is scoped to it.
//
// There is no signup route here. Accounts are created by
// scripts/create-recruiter.js, so a company can only reach Connect
// because somebody deliberately put them there.
// ============================================================

const express = require('express');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

const router = express.Router();
const RecruiterAccount = require('../models/RecruiterAccount');

const JWT_SECRET = process.env.JWT_SECRET || 'hiero_jwt_super_secret_key_2026';
const TOKEN_TTL = '7d';

// A student token and a recruiter token are both signed with the same secret,
// so the payload has to say which kind it is. Without this, a student's token
// would authenticate against recruiter routes.
const TOKEN_KIND = 'connect-recruiter';

function issueRecruiterToken(account) {
    return jwt.sign(
        {
            kind: TOKEN_KIND,
            recruiterId: account._id.toString(),
            email: account.email,
            name: account.name,
            companyId: account.companyId,
            companyName: account.companyName,
            industry: account.industry || 'general',
            role: account.role
        },
        JWT_SECRET,
        { expiresIn: TOKEN_TTL }
    );
}

function readToken(req) {
    const header = req.headers['authorization'] || '';
    if (header.startsWith('Bearer ')) return header.slice(7);
    return null;
}

// Middleware for any route that serves company-scoped data. Puts the verified
// recruiter on req.recruiter; routes read companyId from there and never from
// the query string.
function requireRecruiter(req, res, next) {
    const token = readToken(req);
    if (!token) {
        return res.status(401).json({ success: false, error: 'Sign in to continue.' });
    }
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        if (decoded.kind !== TOKEN_KIND) {
            return res.status(403).json({ success: false, error: 'This token is not a Connect recruiter token.' });
        }
        req.recruiter = decoded;
        return next();
    } catch (e) {
        return res.status(401).json({ success: false, error: 'Your session has expired. Sign in again.' });
    }
}

// Slow down password guessing. In-memory and per-process, so it is a speed
// bump rather than a guarantee — put a real rate limiter in front in
// production.
const attempts = new Map();
const MAX_ATTEMPTS = 8;
const WINDOW_MS = 10 * 60 * 1000;

function tooManyAttempts(key) {
    const now = Date.now();
    const entry = attempts.get(key);
    if (!entry || now - entry.first > WINDOW_MS) return false;
    return entry.count >= MAX_ATTEMPTS;
}

function recordFailure(key) {
    const now = Date.now();
    const entry = attempts.get(key);
    if (!entry || now - entry.first > WINDOW_MS) attempts.set(key, { first: now, count: 1 });
    else entry.count += 1;
}

router.post('/login', async (req, res) => {
    try {
        const email = String((req.body && req.body.email) || '').trim().toLowerCase();
        const password = String((req.body && req.body.password) || '');

        if (!email || !password) {
            return res.status(400).json({ success: false, error: 'Enter your work email and password.' });
        }

        if (mongoose.connection.readyState !== 1) {
            return res.status(503).json({ success: false, error: 'Sign-in is unavailable right now. Try again shortly.' });
        }

        const throttleKey = email;
        if (tooManyAttempts(throttleKey)) {
            return res.status(429).json({ success: false, error: 'Too many attempts. Wait a few minutes and try again.' });
        }

        const account = await RecruiterAccount.findOne({ email });

        // One message for "no such account" and "wrong password" alike: saying
        // which is which tells an attacker whose email is registered.
        const deny = () => {
            recordFailure(throttleKey);
            return res.status(401).json({ success: false, error: 'Email or password is incorrect.' });
        };

        if (!account || !account.passwordHash) return deny();
        if (account.status !== 'active') {
            return res.status(403).json({ success: false, error: 'This account has been disabled. Contact HIERO.' });
        }

        const ok = await bcrypt.compare(password, account.passwordHash);
        if (!ok) return deny();

        attempts.delete(throttleKey);
        account.lastLoginAt = new Date();
        await account.save();

        res.json({
            success: true,
            token: issueRecruiterToken(account),
            user: account.toSafeJSON()
        });
    } catch (e) {
        console.error('[Connect Auth] login failed:', e.message);
        res.status(500).json({ success: false, error: 'Sign-in failed. Try again.' });
    }
});

// Confirms a stored token is still good and returns the current account.
// The portal calls this on load so a revoked or disabled account cannot keep
// working off a token saved in the browser.
router.get('/me', requireRecruiter, async (req, res) => {
    try {
        if (mongoose.connection.readyState !== 1) {
            return res.status(503).json({ success: false, error: 'Unavailable right now.' });
        }
        const account = await RecruiterAccount.findById(req.recruiter.recruiterId);
        if (!account || account.status !== 'active') {
            return res.status(401).json({ success: false, error: 'This account is no longer active.' });
        }
        res.json({ success: true, user: account.toSafeJSON() });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

router.post('/change-password', requireRecruiter, async (req, res) => {
    try {
        const currentPassword = String((req.body && req.body.currentPassword) || '');
        const newPassword = String((req.body && req.body.newPassword) || '');

        if (newPassword.length < 10) {
            return res.status(400).json({ success: false, error: 'Use at least 10 characters.' });
        }

        const account = await RecruiterAccount.findById(req.recruiter.recruiterId);
        if (!account) return res.status(401).json({ success: false, error: 'Sign in again.' });

        const ok = await bcrypt.compare(currentPassword, account.passwordHash || '');
        if (!ok) return res.status(401).json({ success: false, error: 'Current password is incorrect.' });

        account.passwordHash = await bcrypt.hash(newPassword, 12);
        account.mustChangePassword = false;
        await account.save();

        res.json({ success: true, token: issueRecruiterToken(account), user: account.toSafeJSON() });
    } catch (e) {
        console.error('[Connect Auth] change-password failed:', e.message);
        res.status(500).json({ success: false, error: 'Could not change the password.' });
    }
});

// ============================================================
// Admin sign-in by PIN
// ============================================================
// The HIERO admin types one PIN, no email and no password. There is exactly
// one admin area and one person who opens it, so a username was a field that
// only ever held the same value.
//
// What that costs, stated plainly: a short PIN is guessable by brute force in
// a way a password is not — 2816 is one of ten thousand. The lockout below is
// what makes it survivable, so treat it as load-bearing rather than as
// boilerplate, and raise ADMIN_PIN to something longer if this area ever
// decides more than who gets a Connect account.

const ADMIN_PIN = String(process.env.ADMIN_PIN || '2816');

// Deliberately tighter than the password throttle: five tries, then half an
// hour of nothing, keyed on the caller's address. At that rate ten thousand
// PINs take about a year.
const PIN_MAX_ATTEMPTS = 5;
const PIN_LOCKOUT_MS = 30 * 60 * 1000;
const pinAttempts = new Map();

function callerKey(req) {
    const forwarded = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim();
    return forwarded || req.ip || req.connection?.remoteAddress || 'unknown';
}

function pinLockedUntil(key) {
    const entry = pinAttempts.get(key);
    if (!entry) return 0;
    if (Date.now() - entry.first > PIN_LOCKOUT_MS) {
        pinAttempts.delete(key);
        return 0;
    }
    if (entry.count < PIN_MAX_ATTEMPTS) return 0;
    return entry.first + PIN_LOCKOUT_MS;
}

function recordPinFailure(key) {
    const now = Date.now();
    const entry = pinAttempts.get(key);
    if (!entry || now - entry.first > PIN_LOCKOUT_MS) pinAttempts.set(key, { first: now, count: 1 });
    else entry.count += 1;
}

// Constant time, so the server does not leak how much of the PIN was right
// by how fast it said no.
function pinMatches(given) {
    const a = Buffer.from(String(given));
    const b = Buffer.from(ADMIN_PIN);
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
}

router.post('/admin-pin', async (req, res) => {
    try {
        const pin = String((req.body && req.body.pin) || '').trim();
        const key = callerKey(req);

        const lockedUntil = pinLockedUntil(key);
        if (lockedUntil) {
            const minutes = Math.max(1, Math.ceil((lockedUntil - Date.now()) / 60000));
            return res.status(429).json({
                success: false,
                error: `Too many wrong PINs. Try again in ${minutes} minute${minutes === 1 ? '' : 's'}.`
            });
        }

        if (!pin) {
            return res.status(400).json({ success: false, error: 'Enter the PIN.' });
        }

        if (!pinMatches(pin)) {
            recordPinFailure(key);
            const left = PIN_MAX_ATTEMPTS - (pinAttempts.get(key)?.count || 0);
            return res.status(401).json({
                success: false,
                error: left > 0 ? `That PIN is not right. ${left} ${left === 1 ? 'try' : 'tries'} left.` : 'That PIN is not right.'
            });
        }

        if (mongoose.connection.readyState !== 1) {
            return res.status(503).json({ success: false, error: 'Sign-in is unavailable right now. Try again shortly.' });
        }

        // The PIN proves who is at the keyboard; the account still comes from
        // the database, so the token carries a real identity and every admin
        // action remains attributable to it.
        const wanted = String(process.env.ADMIN_EMAIL || '').trim().toLowerCase();
        const account = wanted
            ? await RecruiterAccount.findOne({ email: wanted, role: 'admin', status: 'active' })
            : await RecruiterAccount.findOne({ role: 'admin', status: 'active' }).sort({ createdAt: 1 });

        if (!account) {
            return res.status(500).json({ success: false, error: 'No admin account is set up yet.' });
        }

        pinAttempts.delete(key);
        account.lastLoginAt = new Date();
        await account.save();

        // mustChangePassword is about the emailed temporary password. Someone
        // signing in by PIN never typed one, so holding them at a change-password
        // screen would lock the admin area behind a password they do not have.
        const user = account.toSafeJSON();
        res.json({
            success: true,
            token: issueRecruiterToken(account),
            user: { ...user, mustChangePassword: false }
        });
    } catch (e) {
        console.error('[Connect Auth] admin pin sign-in failed:', e.message);
        res.status(500).json({ success: false, error: 'Sign-in failed. Try again.' });
    }
});

module.exports = router;
module.exports.requireRecruiter = requireRecruiter;
module.exports.TOKEN_KIND = TOKEN_KIND;
