// routes/reviewRoutes.js
import express from 'express';
import Review from '../models/Review.js';
import LoginTracking from '../models/LoginTracking.js';
import User from '../models/User.js';
import jwt from 'jsonwebtoken';

const router = express.Router();

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// ⭐ POST /api/review - Add Review (Strictly one per user)
router.post('/review', authenticateToken, async (req, res) => {
  try {
    const { rating, reviewText } = req.body;
    // Normalize email to ensure consistency
    const userEmail = req.user.email ? req.user.email.toLowerCase().trim() : null;
    const userId = req.user.userId;

    if (!userEmail) {
      return res.status(400).json({ error: 'User email is required' });
    }

    console.log('[Review] POST /api/review - email:', userEmail, 'userId:', userId);

    // Validation
    if (!rating || !reviewText) {
      return res.status(400).json({ error: 'Rating and review text are required' });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    if (reviewText.length > 1000) {
      return res.status(400).json({ error: 'Review text must be 1000 characters or less' });
    }

    // Get user info by email (more reliable than userId from token for Mongo lookup)
    console.log('[Review] Finding user by email:', userEmail);
    let user = await User.findOne({ email: userEmail });

    // If user doesn't exist in Mongo, create them
    if (!user) {
      console.log('[Review] User not found, creating new user:', userEmail);
      user = await User.create({
        email: userEmail,
        username: req.user.name || userEmail.split('@')[0],
        password: 'oauth-user-no-password' // OAuth users don't have password
      });
      console.log('[Review] User created:', user._id);
    }

    console.log('[Review] User found/created:', user.email, 'ID:', user._id);

    // Check if review already exists - PREVENT multiple reviews
    let review = await Review.findOne({ userId: user._id });

    if (review) {
      // Review already exists - do not allow another one
      console.log('[Review] User already submitted a review');
      return res.status(400).json({
        success: false,
        error: 'You have already submitted a review. Only one review per user is allowed.',
        existingReview: {
          rating: review.rating,
          reviewText: review.reviewText,
          createdAt: review.createdAt
        }
      });
    }

    // Create new review (first time only)
    review = new Review({
      userId: user._id, // Use MongoDB _id
      userEmail: user.email,
      userName: user.username || user.email,
      rating,
      reviewText
    });

    try {
      await review.save();
    } catch (saveError) {
      // Handle race condition where duplicate unique key error occurs
      if (saveError.code === 11000) {
        console.log('[Review] Race condition detected: duplicate review prevented');
        // Fetch the review that beat us to it
        const existing = await Review.findOne({ userId: user._id });
        return res.status(400).json({
          success: false,
          error: 'You have already submitted a review. Only one review per user is allowed.',
          existingReview: {
            rating: existing?.rating,
            reviewText: existing?.reviewText,
            createdAt: existing?.createdAt
          }
        });
      }
      throw saveError; // Recheck other errors
    }

    console.log('[Review] Review created successfully');
    return res.status(201).json({
      success: true,
      message: 'Review submitted successfully',
      review: {
        rating: review.rating,
        reviewText: review.reviewText,
        createdAt: review.createdAt,
        updatedAt: review.updatedAt
      }
    });
  } catch (error) {
    console.error('Review submission error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      error: 'Failed to submit review',
      message: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// 📖 GET /api/review/my-review - Get user's own review (alternative endpoint)
router.get('/review/my-review', authenticateToken, async (req, res) => {
  try {
    const userEmail = req.user.email;
    console.log('[Review] GET /api/review/my-review - email:', userEmail);

    const user = await User.findOne({ email: userEmail });
    if (!user) {
      return res.status(404).json({ message: 'No review found' });
    }

    const review = await Review.findOne({ userId: user._id });

    if (!review) {
      return res.status(404).json({ message: 'No review found' });
    }

    res.json(review);
  } catch (error) {
    console.error('Get review error:', error);
    res.status(500).json({ error: 'Failed to fetch review' });
  }
});

// 📖 GET /api/review - Get user's own review
router.get('/review', authenticateToken, async (req, res) => {
  try {
    const userEmail = req.user.email; // Use email instead of userId

    console.log('[Review] GET /api/review - email:', userEmail);

    // Find user by email first
    const user = await User.findOne({ email: userEmail });

    if (!user) {
      console.log('[Review] User not found in database:', userEmail);
      return res.json({
        success: true,
        hasReview: false,
        review: null
      });
    }

    // Find review by MongoDB _id
    const review = await Review.findOne({ userId: user._id });

    if (!review) {
      console.log('[Review] No review found for user:', userEmail);
      return res.json({
        success: true,
        hasReview: false,
        review: null
      });
    }

    console.log('[Review] Review found for user:', userEmail);
    res.json({
      success: true,
      hasReview: true,
      review: {
        rating: review.rating,
        reviewText: review.reviewText,
        createdAt: review.createdAt,
        updatedAt: review.updatedAt
      }
    });
  } catch (error) {
    console.error('Get review error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      error: 'Failed to fetch review',
      message: error.message
    });
  }
});

// 📊 POST /api/login-track - Track user login
router.post('/login-track', authenticateToken, async (req, res) => {
  try {
    const userEmail = req.user.email; // Use email instead of userId
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'];

    console.log('[Login Track] email:', userEmail);

    // Get user info by email
    let user = await User.findOne({ email: userEmail });

    // If user doesn't exist, create them
    if (!user) {
      console.log('[Login Track] User not found, creating new user:', userEmail);
      user = await User.create({
        email: userEmail,
        username: req.user.name || userEmail.split('@')[0],
        password: 'oauth-user-no-password' // OAuth users don't have password
      });
      console.log('[Login Track] User created:', user._id);
    }

    console.log('[Login Track] User found/created:', user.email);

    // Create login tracking record using MongoDB _id
    const loginRecord = new LoginTracking({
      userId: user._id, // Use MongoDB _id
      userEmail: user.email,
      userName: user.username || user.email,
      loginTimestamp: Date.now(),
      ipAddress,
      userAgent
    });

    await loginRecord.save();
    console.log('[Login Track] Login recorded successfully');

    res.json({
      success: true,
      message: 'Login tracked successfully'
    });
  } catch (error) {
    console.error('Login tracking error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      error: 'Failed to track login',
      message: error.message
    });
  }
});

// 🧑‍💻 GET /api/admin/dashboard - Admin Dashboard Data (No Auth Required - Protected by PIN in frontend)
router.get('/admin/dashboard', async (req, res) => {
  try {
    // No authentication required - frontend has 4-digit PIN protection

    // Get statistics
    const totalUsers = await User.countDocuments();
    const totalVisits = await LoginTracking.countDocuments();

    // Get unique users who logged in
    const uniqueLoginUsers = await LoginTracking.distinct('userId');
    const uniqueUsersCount = uniqueLoginUsers.length;

    // Get all users with their last login
    const usersWithLastLogin = await User.aggregate([
      {
        $lookup: {
          from: 'logintrackings',
          localField: '_id',
          foreignField: 'userId',
          as: 'logins'
        }
      },
      {
        $project: {
          email: 1,
          username: 1,
          createdAt: 1,
          lastLogin: {
            $max: '$logins.loginTimestamp'
          },
          loginCount: { $size: '$logins' }
        }
      },
      {
        $sort: { lastLogin: -1 }
      }
    ]);

    // Get all reviews
    const allReviews = await Review.find()
      .sort({ createdAt: -1 })
      .select('userEmail userName rating reviewText createdAt updatedAt');

    // Calculate average rating
    const avgRating = allReviews.length > 0
      ? (allReviews.reduce((sum, review) => sum + review.rating, 0) / allReviews.length).toFixed(2)
      : 0;

    res.json({
      success: true,
      analytics: {
        totalUsers,
        totalVisits,
        uniqueUsersCount,
        averageRating: parseFloat(avgRating),
        totalReviews: allReviews.length
      },
      users: usersWithLastLogin,
      reviews: allReviews
    });
  } catch (error) {
    console.error('Admin dashboard error:', error);
    res.status(500).json({ error: 'Failed to fetch admin dashboard data' });
  }
});

// 🔍 GET /api/admin/check - Check if user is admin
router.get('/admin/check', authenticateToken, async (req, res) => {
  try {
    const userEmail = req.user.email; // Use email directly from JWT

    console.log('[Admin Check] email:', userEmail);

    const ADMIN_EMAILS = [
      process.env.ADMIN_EMAIL,
      'jaswanthkumar@example.com',
      'admin@hiero.com'
    ];

    const isAdmin = ADMIN_EMAILS.includes(userEmail);

    console.log('[Admin Check] isAdmin:', isAdmin);

    res.json({
      success: true,
      isAdmin
    });
  } catch (error) {
    console.error('Admin check error:', error);
    res.status(500).json({ error: 'Failed to check admin status' });
  }
});

export default router;
