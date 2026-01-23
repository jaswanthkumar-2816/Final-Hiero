const express = require('express');
const jwt = require('jsonwebtoken');
const Review = require('../models/Review');
const LoginTracking = require('../models/LoginTracking');
const User = require('../models/User');

const router = express.Router();

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid or expired token' });
        }
        req.user = decoded;
        next();
    });
};

// ⭐ POST /api/review - Add Review
router.post('/review', authenticateToken, async (req, res) => {
    try {
        const { rating, reviewText } = req.body;
        const userEmail = req.user.email ? req.user.email.toLowerCase().trim() : null;

        if (!userEmail) return res.status(400).json({ error: 'User email is required' });

        console.log('[Review] Integrated POST /api/review - email:', userEmail);

        if (!rating || !reviewText) return res.status(400).json({ error: 'Rating and review text are required' });
        if (rating < 1 || rating > 5) return res.status(400).json({ error: 'Rating must be between 1 and 5' });
        if (reviewText.length > 1000) return res.status(400).json({ error: 'Review text must be 1000 characters or less' });

        let user = await User.findOne({ email: userEmail });
        if (!user) {
            user = await User.create({
                email: userEmail,
                username: req.user.name || userEmail.split('@')[0],
                password: 'placeholder-password'
            });
        }

        let review = await Review.findOne({ userId: user._id });
        if (review) {
            return res.status(400).json({
                success: false,
                error: 'You have already submitted a review.',
                existingReview: { rating: review.rating, reviewText: review.reviewText }
            });
        }

        review = new Review({
            userId: user._id,
            userEmail: user.email,
            userName: user.username || user.email,
            rating,
            reviewText
        });

        try {
            await review.save();
        } catch (saveError) {
            if (saveError.code === 11000) return res.status(400).json({ success: false, error: 'Review already exists' });
            throw saveError;
        }

        return res.status(201).json({ success: true, message: 'Review submitted successfully', review });
    } catch (error) {
        console.error('Review submission error:', error);
        res.status(500).json({ error: 'Failed to submit review', message: error.message });
    }
});

// 📖 GET /api/review - Get user's own review
router.get('/review', authenticateToken, async (req, res) => {
    try {
        const userEmail = req.user.email ? req.user.email.toLowerCase().trim() : null;
        if (!userEmail) return res.json({ success: true, hasReview: false });

        const user = await User.findOne({ email: userEmail });
        if (!user) return res.json({ success: true, hasReview: false });

        const review = await Review.findOne({ userId: user._id });
        if (!review) return res.json({ success: true, hasReview: false });

        res.json({ success: true, hasReview: true, review });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch review' });
    }
});

// 📊 POST /api/login-track - Integrated Login Tracking
router.post('/login-track', authenticateToken, async (req, res) => {
    try {
        const userEmail = req.user.email;
        const ipAddress = req.ip || req.connection.remoteAddress;
        const userAgent = req.headers['user-agent'];

        let user = await User.findOne({ email: userEmail });
        if (!user) {
            user = await User.create({
                email: userEmail,
                username: req.user.name || userEmail.split('@')[0],
                password: 'placeholder'
            });
        }

        const loginRecord = new LoginTracking({
            userId: user._id,
            userEmail: user.email,
            userName: user.username || user.email,
            loginTimestamp: Date.now(),
            ipAddress,
            userAgent
        });

        await loginRecord.save();
        res.json({ success: true, message: 'Login tracked' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to track login' });
    }
});

// 📊 GET /api/admin/dashboard - Integrated Admin Dashboard
router.get('/admin/dashboard', async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const totalVisits = await LoginTracking.countDocuments();
        const allReviews = await Review.find().sort({ createdAt: -1 });
        const avgRating = allReviews.length > 0 ? (allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length).toFixed(2) : 0;

        res.json({
            success: true,
            analytics: { totalUsers, totalVisits, averageRating: parseFloat(avgRating), totalReviews: allReviews.length },
            reviews: allReviews
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch dashboard data' });
    }
});

// 🔍 GET /api/admin/check - Integrated Admin Check
router.get('/admin/check', authenticateToken, async (req, res) => {
    try {
        const userEmail = req.user.email;
        const ADMIN_EMAILS = [process.env.ADMIN_EMAIL, 'jaswanthkumar@example.com', 'admin@hiero.com'];
        res.json({ success: true, isAdmin: ADMIN_EMAILS.includes(userEmail) });
    } catch (error) {
        res.status(500).json({ error: 'Admin check failed' });
    }
});

module.exports = router;
