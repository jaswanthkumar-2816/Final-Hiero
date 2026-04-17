const mongoose = require('mongoose');

const urlValidator = (url) => !url || /^(https?:\/\/)?([\w-]+\.)+[\w-]+(\/[\w- ./?%&=]*)?$/i.test(url);

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    picture: { type: String, default: '' },
    social: {
        linkedin: { type: String, default: '', validate: [urlValidator, 'Invalid LinkedIn URL'] },
        github: { type: String, default: '', validate: [urlValidator, 'Invalid GitHub URL'] },
        instagram: { type: String, default: '', validate: [urlValidator, 'Invalid Instagram URL'] },
        portfolio: { type: String, default: '', validate: [urlValidator, 'Invalid Portfolio URL'] }
    },
    scores: {
        totalPoints: { type: Number, default: 0 },
        skillPoints: { type: Number, default: 0 },
        projectPoints: { type: Number, default: 0 },
        level: { type: Number, default: 1 },
        badges: [{ type: String }]
    },
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
    referralCode: { type: String, unique: true },
    referredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    referralCount: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now }
});

// Generate referral code before saving
userSchema.pre('save', function(next) {
    if (!this.referralCode && this.username) {
        this.referralCode = 'HIERO-' + this.username.substring(0, 4).toUpperCase() + Math.floor(1000 + Math.random() * 9000);
    }
    next();
});

module.exports = mongoose.model('User', userSchema);
