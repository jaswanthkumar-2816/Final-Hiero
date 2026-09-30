const mongoose = require('mongoose');

const evalAttemptSchema = new mongoose.Schema({
    userId: { type: String, required: true, index: true },
    skillId: { type: String, required: true, lowercase: true, trim: true },
    skillName: String,
    level: { type: Number, required: true, min: 1, max: 3 },
    questionIds: [String],
    codingQuestionIds: [String],
    quizItems: [{
        id: String,
        question: String,
        options: [String],
        correctIndex: Number,
        subTopic: String
    }],
    codingItems: [{
        id: String,
        prompt: String,
        starterCode: String,
        functionName: String,
        testCases: [mongoose.Schema.Types.Mixed],
        subTopic: String
    }],
    answers: [Number],
    codingSubmissions: [{
        questionId: String,
        code: String,
        passedTests: Number,
        totalTests: Number,
        score: Number
    }],
    score: { type: Number, default: 0 },
    passed: { type: Boolean, default: false },
    timeTakenSec: { type: Number, default: 0 },
    timeLimitSec: Number,
    passThreshold: Number,
    tabSwitches: { type: Number, default: 0 },
    copyPasteEvents: { type: Number, default: 0 },
    proctorConsentedAt: Date,
    proctorCameraOn: { type: Boolean, default: false },
    proctorCameraDenied: { type: Boolean, default: false },
    proctorWarningCount: { type: Number, default: 0 },
    flaggedForReview: { type: Boolean, default: false },
    endedForProctor: { type: Boolean, default: false },
    proctorFlags: [{
        type: { type: String },
        at: { type: Date, default: Date.now },
        durationSec: { type: Number, default: 0 },
        note: String
    }],
    weakSubTopics: [String],
    status: { type: String, enum: ['in_progress', 'submitted', 'expired'], default: 'in_progress' },
    startedAt: { type: Date, default: Date.now },
    submittedAt: Date,
    candidateName: { type: String, default: '' }
});

evalAttemptSchema.index({ userId: 1, skillId: 1, startedAt: -1 });

module.exports = mongoose.model('EvalAttempt', evalAttemptSchema);
