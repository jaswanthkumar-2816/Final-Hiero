const mongoose = require('mongoose');

const skillMicroQuizSchema = new mongoose.Schema({
    skillId: { type: String, required: true, index: true },
    sourceTier: { 
        type: String, 
        required: true, 
        enum: ['foundational', 'core', 'advanced'] 
    },
    targetTier: { 
        type: String, 
        required: true, 
        enum: ['core', 'advanced', 'masterclass'] 
    },
    languageCode: { type: String, default: 'en' },
    passingScore: { type: Number, default: 70 }, // 70% to level up
    questions: [{
        id: { type: Number },
        question: { type: String, required: true },
        options: [{ type: String }],
        correctIndex: { type: Number, required: true },
        explanation: { type: String }
    }],
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('SkillMicroQuiz', skillMicroQuizSchema);
