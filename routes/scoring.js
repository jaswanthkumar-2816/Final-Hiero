const express = require('express');
const fs = require('fs');
const path = require('path');
const { authenticateToken, users } = require('./auth');

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

// Ensure "Completed_Projects" directory exists
const COMPLETED_PROJECTS_DIR = path.join(__dirname, '..', 'Completed_Projects');
if (!fs.existsSync(COMPLETED_PROJECTS_DIR)) {
    fs.mkdirSync(COMPLETED_PROJECTS_DIR, { recursive: true });
}

// Award points for completing a project
router.post('/project-complete', authenticateToken, async (req, res) => {
  try {
    const { projectName, difficulty = 'medium', projectData } = req.body;
    const userId = req.user.userId || req.user.id;

    // Find user in persistence store (auth.js users)
    const user = users.find(u => u.id === userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Initialize completion tracking if not present
    if (!user.completedProjects) user.completedProjects = [];
    if (!user.scores) user.scores = { totalPoints: 0, level: 1, projectPoints: 0, skillPoints: 0, badges: [] };

    // Check if project already completed
    const existingProject = user.completedProjects.find(p => p.projectName === projectName);
    if (existingProject) {
      return res.status(400).json({ error: 'Project already completed' });
    }

    // Calculate points based on difficulty
    let pointsToAdd;
    switch (difficulty.toLowerCase()) {
      case 'easy': pointsToAdd = POINTS_CONFIG.PROJECT_EASY; break;
      case 'hard': pointsToAdd = POINTS_CONFIG.PROJECT_HARD; break;
      default: pointsToAdd = POINTS_CONFIG.PROJECT_MEDIUM;
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

    // Check for level up
    user.scores.level = Math.floor(user.scores.totalPoints / POINTS_CONFIG.LEVEL_UP_THRESHOLD) + 1;

    // --- AUTOMATED FOLDER CREATION (User Request) ---
    // Create a folder for the user if it doesn't exist
    const userProjectDir = path.join(COMPLETED_PROJECTS_DIR, `user_${userId}`);
    if (!fs.existsSync(userProjectDir)) {
        fs.mkdirSync(userProjectDir, { recursive: true });
    }

    // Save project outcome summary
    const safeProjectName = projectName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const filePath = path.join(userProjectDir, `${safeProjectName}.json`);
    
    const outcome = {
        projectName,
        difficulty,
        completedAt: new Date(),
        pointsEarned: pointsToAdd,
        projectData: projectData || {} // Documentation data if passed from frontend
    };

    fs.writeFileSync(filePath, JSON.stringify(outcome, null, 2));
    console.log(`[Scoring] Project outcome saved to: ${filePath}`);

    // Persist user changes (auth.js saveUsers is not exported, so we should really use a shared DB)
    // For now, we rely on the fact that 'users' is a reference. 
    // In a real app, this would be a DB call.
    
    res.json({
      success: true,
      message: `Project completed! +${pointsToAdd} points. Saved to your outcomes folder.`,
      pointsEarned: pointsToAdd,
      totalPoints: user.scores.totalPoints,
      level: user.scores.level,
      badges: user.scores.badges
    });

  } catch (error) {
    console.error('Project completion error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get user scores and progress
router.get('/user-stats', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    const user = users.find(u => u.id === userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!user.scores) user.scores = { totalPoints: 0, level: 1, projectPoints: 0, skillPoints: 0, badges: [] };
    if (!user.completedProjects) user.completedProjects = [];
    if (!user.completedSkills) user.completedSkills = [];

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

module.exports = router;
