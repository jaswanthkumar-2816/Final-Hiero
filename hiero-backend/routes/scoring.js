// routes/scoring.js
import express from 'express';
import User from '../models/User.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

// Points configuration
const POINTS_CONFIG = {
  SKILL_DAY_COMPLETION: 10,
  SKILL_FULL_COMPLETION: 50,
  PROJECT_EASY: 25,
  PROJECT_MEDIUM: 50,
  PROJECT_HARD: 100,
  QUIZ_CORRECT: 5,
  LEVEL_UP_THRESHOLD: 100
};

// Award points for completing a skill day
router.post('/skill-day-complete', authMiddleware, async (req, res) => {
  try {
    const { skillName, day, totalDays } = req.body;
    const userId = req.userId;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Find or create skill entry
    let skillEntry = user.completedSkills.find(s => s.skillName === skillName);
    if (!skillEntry) {
      skillEntry = {
        skillName,
        completedDays: 0,
        totalDays,
        pointsEarned: 0
      };
      user.completedSkills.push(skillEntry);
    }

    // Update completed days
    skillEntry.completedDays = Math.max(skillEntry.completedDays, day);
    
    // Calculate points for this day
    let pointsToAdd = POINTS_CONFIG.SKILL_DAY_COMPLETION;
    
    // Bonus points for completing entire skill
    if (skillEntry.completedDays === totalDays) {
      pointsToAdd += POINTS_CONFIG.SKILL_FULL_COMPLETION;
      skillEntry.completedAt = new Date();
      
      // Add skill completion badge
      const badgeName = `${skillName} Master`;
      if (!user.scores.badges.includes(badgeName)) {
        user.scores.badges.push(badgeName);
      }
    }

    // Update user scores
    user.scores.skillPoints += pointsToAdd;
    user.scores.totalPoints += pointsToAdd;
    skillEntry.pointsEarned += pointsToAdd;

    // Check for level up
    const newLevel = Math.floor(user.scores.totalPoints / POINTS_CONFIG.LEVEL_UP_THRESHOLD) + 1;
    const leveledUp = newLevel > user.scores.level;
    user.scores.level = newLevel;

    await user.save();

    res.json({
      success: true,
      message: `Day ${day} completed! +${pointsToAdd} points`,
      pointsEarned: pointsToAdd,
      totalPoints: user.scores.totalPoints,
      level: user.scores.level,
      leveledUp,
      skillCompleted: skillEntry.completedDays === totalDays,
      badges: user.scores.badges
    });

  } catch (error) {
    console.error('Skill completion error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Award points for completing a project
router.post('/project-complete', authMiddleware, async (req, res) => {
  try {
    const { projectName, difficulty = 'medium' } = req.body;
    const userId = req.userId;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if project already completed
    const existingProject = user.completedProjects.find(p => p.projectName === projectName);
    if (existingProject) {
      return res.status(400).json({ error: 'Project already completed' });
    }

    // Calculate points based on difficulty
    let pointsToAdd;
    switch (difficulty.toLowerCase()) {
      case 'easy':
        pointsToAdd = POINTS_CONFIG.PROJECT_EASY;
        break;
      case 'hard':
        pointsToAdd = POINTS_CONFIG.PROJECT_HARD;
        break;
      default:
        pointsToAdd = POINTS_CONFIG.PROJECT_MEDIUM;
    }

    // Add project to completed list
    user.completedProjects.push({
      projectName,
      difficulty,
      pointsEarned: pointsToAdd,
      completedAt: new Date()
    });

    // Update user scores
    user.scores.projectPoints += pointsToAdd;
    user.scores.totalPoints += pointsToAdd;

    // Add project completion badges
    const projectCount = user.completedProjects.length;
    if (projectCount === 1 && !user.scores.badges.includes('First Project')) {
      user.scores.badges.push('First Project');
    }
    if (projectCount === 5 && !user.scores.badges.includes('Project Enthusiast')) {
      user.scores.badges.push('Project Enthusiast');
    }
    if (projectCount === 10 && !user.scores.badges.includes('Project Master')) {
      user.scores.badges.push('Project Master');
    }

    // Check for level up
    const newLevel = Math.floor(user.scores.totalPoints / POINTS_CONFIG.LEVEL_UP_THRESHOLD) + 1;
    const leveledUp = newLevel > user.scores.level;
    user.scores.level = newLevel;

    await user.save();

    res.json({
      success: true,
      message: `Project completed! +${pointsToAdd} points`,
      pointsEarned: pointsToAdd,
      totalPoints: user.scores.totalPoints,
      level: user.scores.level,
      leveledUp,
      badges: user.scores.badges
    });

  } catch (error) {
    console.error('Project completion error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Award points for correct quiz answers
router.post('/quiz-correct', authMiddleware, async (req, res) => {
  try {
    const userId = req.userId;
    const pointsToAdd = POINTS_CONFIG.QUIZ_CORRECT;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Update user scores
    user.scores.skillPoints += pointsToAdd;
    user.scores.totalPoints += pointsToAdd;

    // Check for level up
    const newLevel = Math.floor(user.scores.totalPoints / POINTS_CONFIG.LEVEL_UP_THRESHOLD) + 1;
    const leveledUp = newLevel > user.scores.level;
    user.scores.level = newLevel;

    await user.save();

    res.json({
      success: true,
      pointsEarned: pointsToAdd,
      totalPoints: user.scores.totalPoints,
      level: user.scores.level,
      leveledUp
    });

  } catch (error) {
    console.error('Quiz points error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get user scores and progress
router.get('/user-stats', authMiddleware, async (req, res) => {
  try {
    const userId = req.userId;
    const user = await User.findById(userId).select('-password');
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      success: true,
      stats: {
        totalPoints: user.scores.totalPoints,
        skillPoints: user.scores.skillPoints,
        projectPoints: user.scores.projectPoints,
        level: user.scores.level,
        badges: user.scores.badges,
        completedSkills: user.completedSkills,
        completedProjects: user.completedProjects,
        skillsCount: user.completedSkills.length,
        projectsCount: user.completedProjects.length
      }
    });

  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get leaderboard
router.get('/leaderboard', authMiddleware, async (req, res) => {
  try {
    const topUsers = await User.find()
      .select('username scores.totalPoints scores.level')
      .sort({ 'scores.totalPoints': -1 })
      .limit(10);

    res.json({
      success: true,
      leaderboard: topUsers.map((user, index) => ({
        rank: index + 1,
        username: user.username,
        totalPoints: user.scores.totalPoints,
        level: user.scores.level
      }))
    });

  } catch (error) {
    console.error('Leaderboard error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
