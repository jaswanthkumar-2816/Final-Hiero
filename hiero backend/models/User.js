// models/User.js
import mongoose from 'mongoose';

const urlValidator = (url) => !url || /^(https?:\/\/)?([\w-]+\.)+[\w-]+(\/[\w- ./?%&=]*)?$/i.test(url);

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  social: {
    linkedin: { type: String, default: '', validate: [urlValidator, 'Invalid LinkedIn URL'] },
    github: { type: String, default: '', validate: [urlValidator, 'Invalid GitHub URL'] },
    instagram: { type: String, default: '', validate: [urlValidator, 'Invalid Instagram URL'] },
    portfolio: { type: String, default: '', validate: [urlValidator, 'Invalid Portfolio URL'] }
  },
  // Add scoring system
  scores: {
    totalPoints: { type: Number, default: 0 },
    skillPoints: { type: Number, default: 0 },
    projectPoints: { type: Number, default: 0 },
    level: { type: Number, default: 1 },
    badges: [{ type: String }]
  },
  // Track completed skills and projects
  completedSkills: [{
    skillName: { type: String, required: true },
    completedDays: { type: Number, default: 0 },
    totalDays: { type: Number, default: 7 },
    pointsEarned: { type: Number, default: 0 },
    completedAt: { type: Date }
  }],
  completedProjects: [{
    projectName: { type: String, required: true },
    difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },
    pointsEarned: { type: Number, default: 0 },
    completedAt: { type: Date, default: Date.now }
  }],
  analysisHistory: [{
    score: { type: Number },
    missingSkills: [{ type: String }],
    analyzedAt: { type: Date },
    isReAnalysis: { type: Boolean }
  }],
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('User', userSchema);