const mongoose = require('mongoose');

/**
 * Feedback from the tester round — friends trying Hiero before a wider release.
 * Deliberately permissive: every field is optional except the one question that
 * matters (fixFirst), so a half-finished form still tells us something rather
 * than being rejected and lost.
 */
const testerFeedbackSchema = new mongoose.Schema({
    // Who (optional — anonymous responses are welcome and common)
    name: { type: String, trim: true, maxlength: 120, default: '' },
    email: { type: String, trim: true, maxlength: 200, default: '' },
    tried: { type: String, trim: true, default: '' },

    // Mock interview
    feltReal: { type: String, trim: true, default: '' },
    whatWasOff: { type: String, trim: true, maxlength: 4000, default: '' },
    voice: { type: String, trim: true, default: '' },
    followUps: { type: Number, min: 1, max: 5, default: null },
    difficulty: { type: String, trim: true, default: '' },
    pauses: { type: String, trim: true, default: '' },
    broke: { type: String, trim: true, maxlength: 4000, default: '' },

    // The report afterwards
    reportFair: { type: Number, min: 1, max: 5, default: null },
    playback: { type: String, trim: true, default: '' },
    reportWish: { type: String, trim: true, maxlength: 4000, default: '' },

    // Resume builder
    extract: { type: Number, min: 1, max: 5, default: null },
    extractMissed: { type: String, trim: true, maxlength: 4000, default: '' },
    pdfReady: { type: String, trim: true, default: '' },

    // Overall
    wouldUse: { type: String, trim: true, default: '' },
    recommend: { type: Number, min: 1, max: 5, default: null },
    fixFirst: { type: String, trim: true, maxlength: 4000, required: true },
    anythingElse: { type: String, trim: true, maxlength: 4000, default: '' },

    // Context, for triage rather than identification
    userAgent: { type: String, trim: true, maxlength: 500, default: '' },
    submittedAt: { type: Date, default: Date.now }
}, { timestamps: true });

testerFeedbackSchema.index({ submittedAt: -1 });

module.exports = mongoose.model('TesterFeedback', testerFeedbackSchema);
