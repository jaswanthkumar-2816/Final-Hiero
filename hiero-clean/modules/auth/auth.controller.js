/**
 * HIERO — Auth Controller
 * Request handlers for authentication endpoints.
 */

const authService = require('./auth.service');

async function signup(req, res) {
    try {
        const { name, username, email, password } = req.body;
        const cleanName = (name || username || '').trim();
        const cleanEmail = (email || '').trim().toLowerCase();
        const cleanPassword = (password || '').trim();

        if (!cleanEmail || !cleanPassword) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        // Check in-memory store
        if (authService.findUserByEmail(cleanEmail)) {
            return res.status(400).json({ error: 'An account with this email already exists' });
        }

        // Check MongoDB if connected
        try {
            const User = require('../../models/User');
            const existing = await User.findOne({ email: cleanEmail });
            if (existing) {
                return res.status(400).json({ error: 'An account with this email already exists' });
            }
        } catch (e) { /* MongoDB not available */ }

        const displayName = cleanName || cleanEmail.split('@')[0];
        const newUser = authService.createUser({ name: displayName, email: cleanEmail, password: cleanPassword });

        // Save to MongoDB asynchronously
        try {
            const User = require('../../models/User');
            await User.create({ username: displayName, email: cleanEmail, password: newUser.password, isPro: false });
        } catch (e) { /* MongoDB not available */ }

        const token = authService.generateToken(newUser);
        res.status(201).json({
            success: true,
            message: 'Account created successfully!',
            token,
            user: { id: newUser.id, name: newUser.name, email: newUser.email },
        });
    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({ error: 'Failed to create account' });
    }
}

async function login(req, res) {
    try {
        const { email, name, username, password } = req.body;
        const identifier = (email || name || username || '').trim().toLowerCase();
        const cleanPassword = (password || '').trim();

        if (!identifier || !cleanPassword) {
            return res.status(400).json({ error: 'Please enter your email/username and password' });
        }

        // Search in-memory
        let user = authService.findUserByIdentifier(identifier);

        // Fallback to MongoDB
        if (!user) {
            try {
                const User = require('../../models/User');
                const dbUser = await User.findOne({ $or: [{ email: identifier }, { username: identifier }] });
                if (dbUser) {
                    user = { id: dbUser._id.toString(), name: dbUser.username, email: dbUser.email, password: dbUser.password };
                }
            } catch (e) { /* MongoDB not available */ }
        }

        if (!user || !user.password) {
            return res.status(400).json({ error: 'No account found with these credentials' });
        }

        const match = await authService.verifyPassword(cleanPassword, user.password);
        if (!match) {
            return res.status(400).json({ error: 'Incorrect password' });
        }

        const token = authService.generateToken(user);
        res.json({
            success: true,
            token,
            user: { id: user.id, name: user.name, email: user.email, picture: user.picture },
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
}

async function verifyEmail(req, res) {
    try {
        const { token } = req.query;
        const decoded = authService.verifyToken(token);
        const user = authService.findUserById(decoded.userId);
        if (!user) return res.status(400).json({ error: 'Invalid token' });
        user.emailVerified = true;
        res.json({ message: 'Email verified successfully!' });
    } catch (error) {
        res.status(400).json({ error: 'Invalid or expired verification link' });
    }
}

function getProfile(req, res) {
    const user = authService.findUserById(req.user.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ id: user.id, name: user.name, email: user.email, picture: user.picture });
}

module.exports = { signup, login, verifyEmail, getProfile };
