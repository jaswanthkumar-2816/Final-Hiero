const mongoose = require('mongoose');

const practiceAttemptSchema = new mongoose.Schema({
    topicId: String,
    passedTests: Number,
    totalTests: Number,
    score: Number,
    at: { type: Date, default: Date.now }
}, { _id: false });

const assessmentAttemptSchema = new mongoose.Schema({
    topicId: String,
    answers: [Number],
    score: Number,
    passed: Boolean,
    weakSubConcepts: [String],
    at: { type: Date, default: Date.now }
}, { _id: false });

const studentProgressSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    skillName: { type: String, required: true, lowercase: true, trim: true },
    topicId: { type: String, default: null },           // current active topic
    state: {
        type: String,
        enum: ['NOT_STARTED', 'LEARNING', 'PRACTICING', 'ASSESSING', 'MASTERED'],
        default: 'NOT_STARTED'
    },
    masteryPct: { type: Number, default: 0, min: 0, max: 100 },
    track: { type: String, default: null }, // 'beginner' | 'intermediate'
    lastAssessedAt: Date,
    weakSubConcepts: [String],
    startingTopicId: String,                            // set by placement quiz
    practiceAttempts: [practiceAttemptSchema],
    assessmentAttempts: [assessmentAttemptSchema],
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

// Compound index: one progress record per user per skill
studentProgressSchema.index({ userId: 1, skillName: 1 }, { unique: true });

module.exports = mongoose.model('StudentProgress', studentProgressSchema);
