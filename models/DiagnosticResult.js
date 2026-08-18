const mongoose = require('mongoose');

const diagnosticResultSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    skillName: { type: String, required: true, lowercase: true, trim: true },
    score: { type: Number, min: 0, max: 100 },
    startingTopicId: String,
    answers: [Number],
    takenAt: { type: Date, default: Date.now }
});

diagnosticResultSchema.index({ userId: 1, skillName: 1 });

module.exports = mongoose.model('DiagnosticResult', diagnosticResultSchema);
