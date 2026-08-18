const mongoose = require('mongoose');

const userSkillSchema = new mongoose.Schema({
    userId: { type: String, required: true, index: true },
    skillId: { type: String, required: true }, // e.g. 'react', 'python', 'system_design', 'aws'
    skillName: { type: String },
    proficiencyLevel: { 
        type: String, 
        enum: ['foundational', 'core', 'advanced', 'masterclass'],
        default: 'foundational' 
    },
    score: { type: Number, default: 0, min: 0, max: 100 },
    status: { type: String, enum: ['learning', 'validated', 'mastered'], default: 'learning' },
    lastAttemptAt: { type: Date },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

userSkillSchema.index({ userId: 1, skillId: 1 }, { unique: true });

module.exports = mongoose.model('UserSkill', userSkillSchema);
