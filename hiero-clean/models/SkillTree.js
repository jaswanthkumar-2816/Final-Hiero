const mongoose = require('mongoose');

const resourceSchema = new mongoose.Schema({
    type: { type: String, enum: ['video', 'article', 'interactive'], default: 'video' },
    url: String,
    title: String,
    duration: String,
    level: { type: String, enum: ['beginner', 'intermediate', 'advanced'], default: 'beginner' },
    language: { type: String, default: 'english' }
}, { _id: false });

const diagnosticQuestionSchema = new mongoose.Schema({
    question: String,
    options: [String],
    correctIndex: Number,
    subConcept: String
}, { _id: false });

const topicSchema = new mongoose.Schema({
    id: String,
    name: String,
    order: Number,
    prerequisites: [String],
    roleRelevance: { type: Map, of: Number },
    diagnosticQuestions: [diagnosticQuestionSchema],
    resources: {
        primary: resourceSchema,
        alternates: [resourceSchema]
    },
    problemIds: [Number],
    passThreshold: { type: Number, default: 75 }
}, { _id: false });

const skillTreeSchema = new mongoose.Schema({
    skillName: { type: String, required: true, unique: true, lowercase: true, trim: true },
    source: { type: String, enum: ['hardcoded', 'pattern_matched', 'ai_generated'], default: 'ai_generated' },
    topics: [topicSchema],
    generatedAt: { type: Date, default: Date.now },
    cachedUntil: { type: Date, default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) }
});

module.exports = mongoose.model('SkillTree', skillTreeSchema);
