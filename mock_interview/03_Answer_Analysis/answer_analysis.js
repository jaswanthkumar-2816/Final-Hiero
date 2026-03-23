/**
 * 03_Answer_Analysis — Hiero Mock Interview
 * ─────────────────────────────────────────────────────────────
 * Processes and analyses user answers before forwarding to the
 * question generator. Handles grammar correction detection and
 * answer quality pre-checks.
 *
 * HOW IT WORKS:
 *  1. Raw transcript from STT is received
 *  2. Pre-validation: check if answer is meaningful (not empty noise)
 *  3. Pass to AI which corrects grammar & asks next question
 *  4. Track quality metrics across the session
 * ─────────────────────────────────────────────────────────────
 */

// ── ANSWER QUALITY METRICS ───────────────────────────────────
const sessionMetrics = {
    totalAnswers: 0,
    shortAnswers: 0,     // < 5 words
    longAnswers: 0,      // > 60 words
    avgWordCount: 0,
    totalWords: 0,
    timestamps: []
};

// ── PRE-VALIDATION ───────────────────────────────────────────
/**
 * Checks if the transcript is a valid, meaningful answer.
 * Filters out background noise transcripts and filler-only responses.
 *
 * @param {string} transcript - Raw STT output
 * @returns {{ valid: boolean, reason: string }}
 */
function validateAnswer(transcript) {
    const cleaned = transcript.trim().toLowerCase();
    const words = cleaned.split(/\s+/).filter(Boolean);

    if (!cleaned || words.length < 2) {
        return { valid: false, reason: 'too_short' };
    }

    // Filler-only responses (noise)
    const fillerOnly = ['um', 'uh', 'hmm', 'ah', 'er', 'like', 'okay', 'ok', 'yeah', 'yes', 'no'];
    if (words.every(w => fillerOnly.includes(w))) {
        return { valid: false, reason: 'filler_only' };
    }

    return { valid: true, reason: 'ok' };
}

// ── ANSWER PROCESSOR ─────────────────────────────────────────
/**
 * Main entry point. Called when STT produces a final result.
 * Validates the answer, updates metrics, then forwards to AI.
 *
 * @param {string} transcript - Final spoken text from user
 * @param {Function} onValid - Called with clean transcript if valid
 * @param {Function} onInvalid - Called with reason if invalid
 */
function processAnswer(transcript, onValid, onInvalid) {
    const { valid, reason } = validateAnswer(transcript);

    if (!valid) {
        if (onInvalid) onInvalid(reason);
        return;
    }

    // Track metrics
    const wordCount = transcript.trim().split(/\s+/).length;
    sessionMetrics.totalAnswers++;
    sessionMetrics.totalWords += wordCount;
    sessionMetrics.avgWordCount = Math.round(sessionMetrics.totalWords / sessionMetrics.totalAnswers);
    sessionMetrics.timestamps.push(Date.now());

    if (wordCount < 5) sessionMetrics.shortAnswers++;
    if (wordCount > 60) sessionMetrics.longAnswers++;

    console.log(`[AnswerAnalysis] Answer #${sessionMetrics.totalAnswers}: ${wordCount} words`);

    if (onValid) onValid(transcript.trim());
}

// ── GRAMMAR HINT BUILDER ──────────────────────────────────────
/**
 * Builds an instruction for the AI to specifically flag
 * grammar issues in the user's response.
 * This is appended to the system prompt when needed.
 *
 * @returns {string}
 */
function getGrammarCorrectionInstruction() {
    return `If the user's answer contains grammar errors, incorrect tenses,
or unprofessional phrasing, FIRST gently correct them with:
"A more professional way to say that would be: [corrected version]."
Then proceed to ask your next question.`;
}

// ── SESSION SUMMARY ───────────────────────────────────────────
/**
 * Returns a summary of the session's answer quality metrics.
 * Included in the final score request for more accurate AI scoring.
 *
 * @returns {string} Human-readable summary
 */
function getSessionSummary() {
    const { totalAnswers, avgWordCount, shortAnswers, longAnswers } = sessionMetrics;
    return `Session Data: ${totalAnswers} answers given. Average answer length: ${avgWordCount} words. Short answers (under 5 words): ${shortAnswers}. Detailed answers (over 60 words): ${longAnswers}.`;
}

// ── INVALID ANSWER MESSAGES ───────────────────────────────────
/**
 * Returns a user-friendly message for invalid answer types.
 *
 * @param {string} reason - Reason from validateAnswer()
 * @returns {string}
 */
function getInvalidMessage(reason) {
    switch (reason) {
        case 'too_short':
            return "I didn't catch that. Could you please elaborate on your answer?";
        case 'filler_only':
            return "Please provide a complete answer. Take your time.";
        default:
            return "Could you repeat that? I didn't quite get your response.";
    }
}
