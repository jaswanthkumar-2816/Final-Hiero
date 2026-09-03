/**
 * HIERO — Auth Routes
 * All authentication endpoints.
 */

const express = require('express');
const passport = require('passport');
const router = express.Router();
const authController = require('./auth.controller');
const { authenticateToken } = require('../../middleware/auth');
const { PUBLIC_URL } = require('../../config/constants');

// ─── EMAIL/AUTH ────────────────────────────────────────
router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.get('/verify-email', authController.verifyEmail);
router.get('/api/me', authenticateToken, authController.getProfile);

// ─── GOOGLE OAUTH ──────────────────────────────────────
router.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'], prompt: 'select_account' }));
router.get('/auth/google/callback',
    passport.authenticate('google', { session: false }),
    (req, res) => {
        const token = require('../../utils/ai'); // avoid circular — use auth service
        const { generateToken } = require('./auth.service');
        const t = generateToken(req.user);
        const userJson = encodeURIComponent(JSON.stringify(req.user));
        res.redirect(`/index.html?token=${t}&user=${userJson}`);
    }
);

// ─── GITHUB OAUTH ──────────────────────────────────────
router.get('/auth/github', passport.authenticate('github', { scope: ['user:email'] }));
router.get('/auth/github/callback',
    passport.authenticate('github', { session: false }),
    (req, res) => {
        const { generateToken } = require('./auth.service');
        const t = generateToken(req.user);
        const userJson = encodeURIComponent(JSON.stringify(req.user));
        res.redirect(`/index.html?token=${t}&user=${userJson}`);
    }
);

// ─── LEGACY REDIRECTS ──────────────────────────────────
router.use('/auth/signup', (req, res) => res.redirect(307, '/signup'));
router.use('/auth/login', (req, res) => res.redirect(307, '/login'));

module.exports = router;
