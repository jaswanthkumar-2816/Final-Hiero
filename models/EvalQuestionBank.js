const mongoose = require('mongoose');

const quizItemSchema = new mongoose.Schema({
    id: String,
    question: String,
    options: [String],
    correctIndex: Number,
    subTopic: String,
    difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'], default: 'Easy' }
}, { _id: false });

const codingItemSchema = new mongoose.Schema({
    id: String,
    prompt: String,
    starterCode: String,
    functionName: String,
    testCases: [{
        name: String,
        args: mongoose.Schema.Types.Mixed,
        expected: mongoose.Schema.Types.Mixed
    }],
    timeLimitSec: { type: Number, default: 8 },
    subTopic: String,
    difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'], default: 'Easy' }
}, { _id: false });

const evalQuestionBankSchema = new mongoose.Schema({
    skillId: { type: String, required: true, lowercase: true, trim: true },
    skillName: String,
    level: { type: Number, required: true, min: 1, max: 3 },
    quizPool: [quizItemSchema],
    codingPool: [codingItemSchema],
    source: { type: String, enum: ['ai_generated', 'fallback'], default: 'ai_generated' },
    generatedAt: { type: Date, default: Date.now },
    cachedUntil: { type: Date, default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) }
});

evalQuestionBankSchema.index({ skillId: 1, level: 1 }, { unique: true });

module.exports = mongoose.model('EvalQuestionBank', evalQuestionBankSchema);
