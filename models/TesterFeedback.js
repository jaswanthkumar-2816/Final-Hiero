const mongoose = require('mongoose');

/**
 * Tester feedback, built to produce numbers that survive scrutiny.
 *
 * Three decisions shape this schema:
 *
 * The app stores nothing about who a user is -- no year of study, no
 * specialisation, no target role -- so without capturing them here the results
 * cannot be segmented at all, and "final-year students rated it higher" is
 * unanswerable.
 *
 * `confidenceBefore` and `confidenceAfter` are worded identically and asked at
 * opposite ends of the form, before and after the tester has rated anything.
 * Asked together they measure mood; asked apart they measure a change.
 *
 * Only `improveFirst` is required. A half-finished form that names the thing
 * to fix is worth more than a complete one that does not.
 */
const rating = { type: Number, min: 1, max: 5, default: null };

const testerFeedbackSchema = new mongoose.Schema({
    // Who (optional, but the only route to segmentation)
    name:   { type: String, trim: true, maxlength: 120, default: '' },
    email:  { type: String, trim: true, maxlength: 200, default: '' },
    status:         { type: String, trim: true, default: '' },  // year of study / graduate / working
    specialisation: { type: String, trim: true, default: '' },
    targetRole:     { type: String, trim: true, default: '' },

    // Before Hiero — the baseline, asked before any rating
    confidenceBefore: rating,          // confidence their CV suits the jobs they want
    clarityBefore:    rating,          // how clear they were on missing skills
    biggestProblem:   { type: String, trim: true, default: '' },

    // Using Hiero — these become the averages quoted in a report
    easeOfUse:        rating,
    resumeBuilder:    rating,
    jdAccuracy:       rating,          // resume vs job description analysis
    skillGapUseful:   rating,
    learningRelevant: rating,
    interviewRelevant:rating,          // questions matched the role
    interviewRealism: rating,          // felt like a real interview
    reportUseful:     rating,          // feedback explained their weaknesses

    // After — the delta and the headline numbers
    confidenceAfter:  rating,          // same wording as confidenceBefore
    savedTime:        { type: String, trim: true, default: '' },
    wouldUseAgain:    { type: String, trim: true, default: '' },
    recommend:        { type: Number, min: 0, max: 10, default: null },   // NPS
    mostUseful:       { type: String, trim: true, default: '' },

    // The one that actually changes what gets built
    improveFirst:  { type: String, trim: true, maxlength: 4000, required: true },
    anythingElse:  { type: String, trim: true, maxlength: 4000, default: '' },

    // Context, for triage rather than identification
    userAgent:   { type: String, trim: true, maxlength: 500, default: '' },
    submittedAt: { type: Date, default: Date.now }
}, { timestamps: true });

testerFeedbackSchema.index({ submittedAt: -1 });

module.exports = mongoose.model('TesterFeedback', testerFeedbackSchema);
