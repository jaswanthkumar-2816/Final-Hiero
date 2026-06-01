const express = require('express');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');

const Review = require('../models/Review');
const LoginTracking = require('../models/LoginTracking');
const User = require('../models/User');

const router = express.Router();

const REVIEWS_FILE = path.join(__dirname, '..', 'reviews.json');
const LOGIN_TRACK_FILE = path.join(__dirname, '..', 'login_tracking.json');
const USERS_FILE = path.join(__dirname, '..', 'users.json');

// Reusable Nodemailer Transporter
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

// Helper function to send the Green-Branded Hiero Feedback Request Email
async function sendFeedbackRequestEmail(email, name) {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.warn('⚠️ SMTP credentials not found. Skipping email.');
        return;
    }

    const userName = name || email.split('@')[0];
    const appUrl = process.env.PUBLIC_URL || 'https://hiero.in';
    const feedbackUrl = `${appUrl}/feedback.html?email=${encodeURIComponent(email)}&name=${encodeURIComponent(userName)}`;

    const mailOptions = {
        from: `"Hiero Team" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: `Thank you for visiting Hiero! We'd love your feedback`,
        html: `
        <div style="font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; padding: 40px 20px; min-height: 100%; width: 100%; margin: 0;">
          <!-- Inline Web Font Import for compatible mail clients -->
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@600;800&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
            body, table, td, a { font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif !important; }
            .font-header { font-family: 'Outfit', -apple-system, BlinkMacSystemFont, sans-serif !important; }
          </style>
          
          <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 580px; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05); overflow: hidden; border-collapse: separate;">
            <!-- Brand Header with Slate and Emerald Accent -->
            <tr>
              <td style="background-color: #0f172a; padding: 32px 40px; text-align: left;">
                <table border="0" cellpadding="0" cellspacing="0" width="100%">
                  <tr>
                    <td>
                      <span class="font-header" style="font-size: 22px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px; text-transform: uppercase;">HIERO <span style="color: #10b981;">CAREER</span></span>
                    </td>
                    <td align="right">
                      <span style="display: inline-block; background-color: rgba(16, 185, 129, 0.15); border: 1px solid rgba(16, 185, 129, 0.3); color: #10b981; font-size: 11px; font-weight: 700; padding: 5px 12px; border-radius: 99px; text-transform: uppercase; letter-spacing: 0.5px; font-family: 'Plus Jakarta Sans', sans-serif;">User Appreciation</span>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            
            <!-- Beautiful Gradient Separator Bar -->
            <tr>
              <td height="4" style="background: linear-gradient(90deg, #10b981 0%, #059669 100%); line-height: 4px; font-size: 1px;">&nbsp;</td>
            </tr>
            
            <!-- Body Content -->
            <tr>
              <td style="padding: 44px 40px 36px; background-color: #ffffff;">
                <h2 class="font-header" style="color: #0f172a; font-size: 22px; font-weight: 700; margin: 0 0 18px; letter-spacing: -0.3px;">Hello ${userName},</h2>
                <p style="color: #475569; font-size: 15px; line-height: 1.6; margin: 0 0 20px; font-weight: 400;">
                  Thank you for visiting Hiero! We hope our AI career tools, resume builder, and mock interview modules were helpful in your professional journey.
                </p>
                <p style="color: #475569; font-size: 15px; line-height: 1.6; margin: 0 0 28px; font-weight: 400;">
                  Our team is committed to building the ultimate career companion. To help us make Hiero even better, we would be incredibly grateful if you could share your quick experience directly on your dashboard.
                </p>
                
                <!-- 5-Star Interactive Rating Row -->
                <table border="0" cellpadding="0" cellspacing="0" width="100%">
                  <tr>
                    <td align="center" style="padding: 10px 0 35px 0;">
                      <p style="font-size: 12px; font-weight: 700; color: #64748b; letter-spacing: 0.5px; text-transform: uppercase; margin: 0 0 16px 0; font-family: 'Plus Jakarta Sans', sans-serif;">Rate Your Experience Instantly</p>
                      <table border="0" cellpadding="0" cellspacing="0" style="margin: 0 auto;">
                        <tr>
                          <td style="padding: 0 6px;">
                            <a href="${feedbackUrl}&rating=1" style="font-size: 42px; text-decoration: none; color: #fbbf24; line-height: 1;" title="1 Star">&#9733;</a>
                          </td>
                          <td style="padding: 0 6px;">
                            <a href="${feedbackUrl}&rating=2" style="font-size: 42px; text-decoration: none; color: #fbbf24; line-height: 1;" title="2 Stars">&#9733;</a>
                          </td>
                          <td style="padding: 0 6px;">
                            <a href="${feedbackUrl}&rating=3" style="font-size: 42px; text-decoration: none; color: #fbbf24; line-height: 1;" title="3 Stars">&#9733;</a>
                          </td>
                          <td style="padding: 0 6px;">
                            <a href="${feedbackUrl}&rating=4" style="font-size: 42px; text-decoration: none; color: #fbbf24; line-height: 1;" title="4 Stars">&#9733;</a>
                          </td>
                          <td style="padding: 0 6px;">
                            <a href="${feedbackUrl}&rating=5" style="font-size: 42px; text-decoration: none; color: #fbbf24; line-height: 1;" title="5 Stars">&#9733;</a>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
                
                <p style="color: #475569; font-size: 14px; line-height: 1.5; margin: 0 0 10px; font-weight: 500;">
                  Best regards,<br>
                  <span style="color: #0f172a; font-weight: 700;">The Hiero Team</span>
                </p>
              </td>
            </tr>
            
            <!-- Footer Callout -->
            <tr>
              <td style="background-color: #f8fafc; padding: 26px 40px; border-top: 1px solid #e2e8f0; text-align: left;">
                <p style="color: #64748b; font-size: 11px; line-height: 1.6; margin: 0;">
                  You received this email because you recently accessed the Hiero platform. Your feedback directly impacts our software development, enabling us to make job preparation easier for job seekers worldwide.
                </p>
              </td>
            </tr>
          </table>
          
          <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 580px; margin-top: 24px; text-align: center;">
            <tr>
              <td style="color: #94a3b8; font-size: 11px; line-height: 1.4; font-family: 'Plus Jakarta Sans', sans-serif;">
                &copy; 2026 Hiero Career Platform. All rights reserved.
              </td>
            </tr>
          </table>
        </div>`
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`✉️ Feedback Request email successfully sent to: ${email}`);
    } catch (err) {
        console.error(`❌ Failed to send feedback request email to ${email}:`, err.message);
        throw err;
    }
}

// Helper to check if MongoDB is connected
function isMongoConnected() {
    return mongoose.connection && mongoose.connection.readyState === 1;
}

// Helpers for JSON-based fallback
function getLocalReviews() {
    try {
        if (fs.existsSync(REVIEWS_FILE)) {
            return JSON.parse(fs.readFileSync(REVIEWS_FILE, 'utf8'));
        }
    } catch (err) {
        console.error('Error reading local reviews:', err);
    }
    return [];
}

function saveLocalReviews(reviews) {
    try {
        fs.writeFileSync(REVIEWS_FILE, JSON.stringify(reviews, null, 2));
    } catch (err) {
        console.error('Error saving local reviews:', err);
    }
}

function getLocalLogins() {
    try {
        if (fs.existsSync(LOGIN_TRACK_FILE)) {
            return JSON.parse(fs.readFileSync(LOGIN_TRACK_FILE, 'utf8'));
        }
    } catch (err) {
        console.error('Error reading local logins:', err);
    }
    return [];
}

function saveLocalLogins(logins) {
    try {
        fs.writeFileSync(LOGIN_TRACK_FILE, JSON.stringify(logins, null, 2));
    } catch (err) {
        console.error('Error saving local logins:', err);
    }
}

function saveLocalUsers(users) {
    try {
        fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
    } catch (err) {
        console.error('Error saving local users:', err);
    }
}

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

// ⭐ POST /api/review - Add Review (Authenticated Dashboard Path)
router.post('/review', authenticateToken, async (req, res) => {
    try {
        const { rating, reviewText } = req.body;
        const userEmail = req.user.email ? req.user.email.toLowerCase().trim() : null;

        if (!userEmail) return res.status(400).json({ error: 'User email is required' });

        console.log('[Review] Authenticated POST /api/review - email:', userEmail);

        if (!rating || !reviewText) return res.status(400).json({ error: 'Rating and review text are required' });
        if (rating < 1 || rating > 5) return res.status(400).json({ error: 'Rating must be between 1 and 5' });
        if (reviewText.length > 1000) return res.status(400).json({ error: 'Review text must be 1000 characters or less' });

        if (isMongoConnected()) {
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
                // Update existing review
                review.rating = rating;
                review.reviewText = reviewText;
                review.updatedAt = Date.now();
                await review.save();
                return res.status(200).json({ success: true, message: 'Review updated successfully', review });
            }

            review = new Review({
                userId: user._id,
                userEmail: user.email,
                userName: user.username || user.email,
                rating,
                reviewText
            });

            await review.save();
            return res.status(201).json({ success: true, message: 'Review submitted successfully', review });
        } else {
            // Local persistence fallback
            const authObj = require('./auth');
            const localUsers = authObj.users || [];
            let user = localUsers.find(u => u.email && u.email.toLowerCase() === userEmail);
            if (!user) {
                user = {
                    id: localUsers.length > 0 ? Math.max(...localUsers.map(u => u.id || 0)) + 1 : 1,
                    email: userEmail,
                    name: req.user.name || userEmail.split('@')[0],
                    signupMethod: 'email',
                    emailVerified: true
                };
                localUsers.push(user);
                saveLocalUsers(localUsers);
            }

            const reviews = getLocalReviews();
            let reviewIdx = reviews.findIndex(r => r.userEmail && r.userEmail.toLowerCase() === userEmail);
            let review;

            if (reviewIdx !== -1) {
                reviews[reviewIdx].rating = rating;
                reviews[reviewIdx].reviewText = reviewText;
                reviews[reviewIdx].updatedAt = new Date().toISOString();
                review = reviews[reviewIdx];
            } else {
                review = {
                    id: reviews.length > 0 ? Math.max(...reviews.map(r => r.id || 0)) + 1 : 1,
                    userId: user.id,
                    userEmail: user.email,
                    userName: user.name || user.email,
                    rating,
                    reviewText,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                };
                reviews.push(review);
            }

            saveLocalReviews(reviews);
            return res.status(201).json({ success: true, message: 'Review submitted successfully (local)', review });
        }
    } catch (error) {
        console.error('Review submission error:', error);
        res.status(500).json({ error: 'Failed to submit review', message: error.message });
    }
});

// ⭐ POST /api/feedback/submit - Unauthenticated Feedback Submission (directly from Email Link)
router.post('/feedback/submit', async (req, res) => {
    try {
        const { rating, reviewText, email, name } = req.body;
        const userEmail = email ? email.toLowerCase().trim() : null;

        if (!userEmail) return res.status(400).json({ error: 'User email is required' });
        if (!rating || !reviewText) return res.status(400).json({ error: 'Rating and review text are required' });
        if (rating < 1 || rating > 5) return res.status(400).json({ error: 'Rating must be between 1 and 5' });
        if (reviewText.length > 1000) return res.status(400).json({ error: 'Review text must be 1000 characters or less' });

        console.log('[Feedback] Unauthenticated submit - email:', userEmail);

        if (isMongoConnected()) {
            let user = await User.findOne({ email: userEmail });
            if (!user) {
                user = await User.create({
                    email: userEmail,
                    username: name || userEmail.split('@')[0],
                    password: 'placeholder-password'
                });
            }

            let review = await Review.findOne({ userId: user._id });
            if (review) {
                // Update existing review
                review.rating = rating;
                review.reviewText = reviewText;
                review.updatedAt = Date.now();
                await review.save();
                return res.status(200).json({ success: true, message: 'Review updated successfully', review });
            }

            review = new Review({
                userId: user._id,
                userEmail: user.email,
                userName: user.username || user.email,
                rating,
                reviewText
            });

            await review.save();
            return res.status(201).json({ success: true, message: 'Review submitted successfully', review });
        } else {
            // Local persistence fallback
            const authObj = require('./auth');
            const localUsers = authObj.users || [];
            let user = localUsers.find(u => u.email && u.email.toLowerCase() === userEmail);
            if (!user) {
                user = {
                    id: localUsers.length > 0 ? Math.max(...localUsers.map(u => u.id || 0)) + 1 : 1,
                    email: userEmail,
                    name: name || userEmail.split('@')[0],
                    signupMethod: 'email',
                    emailVerified: true
                };
                localUsers.push(user);
                saveLocalUsers(localUsers);
            }

            const reviews = getLocalReviews();
            let reviewIdx = reviews.findIndex(r => r.userEmail && r.userEmail.toLowerCase() === userEmail);
            let review;

            if (reviewIdx !== -1) {
                reviews[reviewIdx].rating = rating;
                reviews[reviewIdx].reviewText = reviewText;
                reviews[reviewIdx].updatedAt = new Date().toISOString();
                review = reviews[reviewIdx];
            } else {
                review = {
                    id: reviews.length > 0 ? Math.max(...reviews.map(r => r.id || 0)) + 1 : 1,
                    userId: user.id,
                    userEmail: user.email,
                    userName: user.name || user.email,
                    rating,
                    reviewText,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                };
                reviews.push(review);
            }

            saveLocalReviews(reviews);
            return res.status(201).json({ success: true, message: 'Review submitted successfully (local)', review });
        }
    } catch (error) {
        console.error('Feedback submission error:', error);
        res.status(500).json({ error: 'Failed to submit feedback', message: error.message });
    }
});

// 📖 GET /api/review - Get user's own review
router.get('/review', authenticateToken, async (req, res) => {
    try {
        const userEmail = req.user.email ? req.user.email.toLowerCase().trim() : null;
        if (!userEmail) return res.json({ success: true, hasReview: false });

        if (isMongoConnected()) {
            const user = await User.findOne({ email: userEmail });
            if (!user) return res.json({ success: true, hasReview: false });

            const review = await Review.findOne({ userId: user._id });
            if (!review) return res.json({ success: true, hasReview: false });

            res.json({ success: true, hasReview: true, review });
        } else {
            // Local persistence fallback
            const reviews = getLocalReviews();
            const review = reviews.find(r => r.userEmail && r.userEmail.toLowerCase() === userEmail);
            if (!review) return res.json({ success: true, hasReview: false });

            res.json({ success: true, hasReview: true, review });
        }
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch review' });
    }
});

// 📊 POST /api/login-track - Integrated Login Tracking & Automatic Feedback Invitation Email
router.post('/login-track', authenticateToken, async (req, res) => {
    try {
        const userEmail = req.user.email;
        const ipAddress = req.ip || req.connection.remoteAddress;
        const userAgent = req.headers['user-agent'];

        if (isMongoConnected()) {
            let user = await User.findOne({ email: userEmail });
            if (!user) {
                user = await User.create({
                    email: userEmail,
                    username: req.user.name || userEmail.split('@')[0],
                    password: 'placeholder'
                });
            }

            // Check if user had another login record in the last 5 minutes to prevent spamming
            const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
            const recentLogin = await LoginTracking.findOne({
                userEmail: user.email,
                loginTimestamp: { $gte: fiveMinutesAgo }
            });

            const loginRecord = new LoginTracking({
                userId: user._id,
                userEmail: user.email,
                userName: user.username || user.email,
                loginTimestamp: Date.now(),
                ipAddress,
                userAgent
            });

            await loginRecord.save();

            // Send feedback request email if no recent login was recorded in the last 5 minutes
            if (!recentLogin) {
                sendFeedbackRequestEmail(user.email, user.username);
            }

            res.json({ success: true, message: 'Login tracked' });
        } else {
            // Local persistence fallback
            const authObj = require('./auth');
            const localUsers = authObj.users || [];
            let user = localUsers.find(u => u.email && u.email.toLowerCase() === userEmail.toLowerCase());

            if (!user) {
                user = {
                    id: localUsers.length > 0 ? Math.max(...localUsers.map(u => u.id || 0)) + 1 : 1,
                    email: userEmail.toLowerCase(),
                    name: req.user.name || userEmail.split('@')[0],
                    signupMethod: 'email',
                    emailVerified: true
                };
                localUsers.push(user);
            }

            // Update login statistics & check cooldown (5 mins)
            const lastLoginTime = user.lastLogin ? new Date(user.lastLogin).getTime() : 0;
            const isCooldownActive = (Date.now() - lastLoginTime) < (5 * 60 * 1000);

            user.loginCount = (user.loginCount || 0) + 1;
            user.lastLogin = new Date().toISOString();
            saveLocalUsers(localUsers);

            // Log entry
            const logins = getLocalLogins();
            const loginRecord = {
                id: logins.length > 0 ? Math.max(...logins.map(l => l.id || 0)) + 1 : 1,
                userId: user.id,
                userEmail: user.email,
                userName: user.name || user.email,
                loginTimestamp: new Date().toISOString(),
                ipAddress,
                userAgent
            };
            logins.push(loginRecord);
            saveLocalLogins(logins);

            // Send feedback request email if no recent login (cooldown inactive)
            if (!isCooldownActive) {
                sendFeedbackRequestEmail(user.email, user.name);
            }

            res.json({ success: true, message: 'Login tracked (local)', user });
        }
    } catch (error) {
        res.status(500).json({ error: 'Failed to track login' });
    }
});

// ✉️ POST /api/admin/send-feedback-email - Bulk send feedback request emails directly from Admin Dashboard controls
router.post('/admin/send-feedback-email', async (req, res) => {
    try {
        const { emails } = req.body;
        if (!emails || !Array.isArray(emails) || emails.length === 0) {
            return res.status(400).json({ error: 'Array of selected emails is required' });
        }

        console.log(`[Admin] Triggering parallel bulk feedback invitation email for ${emails.length} selected users.`);

        const authObj = require('./auth');
        const localUsers = authObj.users || [];

        // Instantly return success to the dashboard so the UI doesn't hang!
        res.json({ success: true, message: `Feedback invitations are being dispatched in the background.` });

        // Process email dispatching asynchronously in the background in parallel
        (async () => {
            const emailPromises = emails.map(async (email) => {
                try {
                    let user;
                    // Safe Mongoose read with timeout check
                    if (isMongoConnected()) {
                        user = await User.findOne({ email: email.toLowerCase() }).maxTimeMS(2000).catch(() => null);
                    }
                    
                    if (!user) {
                        user = localUsers.find(u => u.email && u.email.toLowerCase() === email.toLowerCase());
                    }

                    const username = user ? (user.username || user.name) : email.split('@')[0];
                    await sendFeedbackRequestEmail(email, username);
                    console.log(`✉️ Async background dispatch complete for: ${email}`);
                } catch (err) {
                    console.error(`❌ Background dispatch failed for ${email}:`, err.message);
                }
            });

            // Run all dispatches in parallel to maximize performance
            await Promise.all(emailPromises);
            console.log(`🚀 All background bulk feedback email dispatches completed.`);
        })().catch(err => {
            console.error('Fatal error in background email dispatch process:', err);
        });

    } catch (error) {
        console.error('Bulk email error:', error);
        if (!res.headersSent) {
            res.status(500).json({ error: 'Failed to dispatch emails' });
        }
    }
});

// Helper to serve local JSON fallback for Admin Dashboard
function serveLocalDashboard(res) {
    try {
        const authObj = require('./auth');
        const localUsers = authObj.users || [];
        
        const logins = getLocalLogins();
        const allReviews = getLocalReviews().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        
        // Map Mongoose User structure format for response compat
        const usersData = localUsers.map(u => ({
            id: u.id,
            username: u.name || u.email.split('@')[0],
            email: u.email,
            loginCount: u.loginCount || 1, // Fallback default to 1 if tracked
            lastLogin: u.lastLogin || new Date().toISOString()
        }));

        const totalUsers = localUsers.length;
        const totalVisits = logins.length > 0 ? logins.length : localUsers.reduce((sum, u) => sum + (u.loginCount || 1), 0);
        const avgRating = allReviews.length > 0 ? (allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length).toFixed(2) : 0.0;

        return res.json({
            success: true,
            analytics: { 
                totalUsers, 
                totalVisits, 
                averageRating: parseFloat(avgRating), 
                totalReviews: allReviews.length,
                uniqueUsersCount: totalUsers
            },
            users: usersData,
            reviews: allReviews
        });
    } catch (err) {
        console.error('Error in serveLocalDashboard:', err);
        return res.status(500).json({ error: 'Failed to fetch dashboard fallback data' });
    }
}

// 📊 GET /api/admin/dashboard - Integrated Admin Dashboard
router.get('/admin/dashboard', async (req, res) => {
    try {
        if (isMongoConnected()) {
            const totalUsers = await User.countDocuments();
            const totalVisits = await LoginTracking.countDocuments();
            const allReviews = await Review.find().sort({ createdAt: -1 });
            const avgRating = allReviews.length > 0 ? (allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length).toFixed(2) : 0;

            const allUsers = await User.find();
            const allLogins = await LoginTracking.find();
            
            const usersData = allUsers.map(u => {
                const userLogins = allLogins.filter(l => l.userEmail && l.userEmail.toLowerCase() === u.email.toLowerCase());
                const loginCount = userLogins.length;
                const lastLoginRecord = userLogins.sort((a, b) => new Date(b.loginTimestamp) - new Date(a.loginTimestamp))[0];
                return {
                    id: u._id,
                    username: u.username || u.email.split('@')[0],
                    email: u.email,
                    loginCount: loginCount || 1, // Fallback to 1
                    lastLogin: lastLoginRecord ? lastLoginRecord.loginTimestamp : u.createdAt
                };
            }).sort((a, b) => new Date(b.lastLogin) - new Date(a.lastLogin));

            return res.json({
                success: true,
                analytics: { 
                    totalUsers, 
                    totalVisits, 
                    averageRating: parseFloat(avgRating), 
                    totalReviews: allReviews.length,
                    uniqueUsersCount: totalUsers
                },
                users: usersData,
                reviews: allReviews
            });
        } else {
            return serveLocalDashboard(res);
        }
    } catch (error) {
        console.warn('⚠️ MongoDB Admin Dashboard query failed (falling back to JSON persistence):', error.message);
        return serveLocalDashboard(res);
    }
});

// 🔍 GET /api/admin/check - Integrated Admin Check
router.get('/api/admin/check', authenticateToken, async (req, res) => {
    try {
        const userEmail = req.user.email;
        const ADMIN_EMAILS = [process.env.ADMIN_EMAIL, 'jaswanthkumar@example.com', 'admin@hiero.com'];
        res.json({ success: true, isAdmin: ADMIN_EMAILS.includes(userEmail) });
    } catch (error) {
        res.status(500).json({ error: 'Admin check failed' });
    }
});

module.exports = router;
