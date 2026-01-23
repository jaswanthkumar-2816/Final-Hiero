// routes/profile.js
import express from 'express';
import User from '../models/User.js';
import authMiddleware from '../middleware/auth.js';
const router = express.Router();

// POST /profile/social - Save social links
router.post('/social', authMiddleware, async (req, res) => {
  try {
    const { linkedin, github, instagram, portfolio } = req.body;

    // Use req.userId for ES module auth middleware
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    user.social = {
      linkedin: linkedin || user.social.linkedin || '',
      github: github || user.social.github || '',
      instagram: instagram || user.social.instagram || '',
      portfolio: portfolio || user.social.portfolio || ''
    };

    await user.save();
    res.json({ message: 'Social profile updated', social: user.social });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /profile/me - Fetch user profile
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;