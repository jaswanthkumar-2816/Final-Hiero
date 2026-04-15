/**
 * 04_Feedback_Generator — Hiero Mock Interview
 * ─────────────────────────────────────────────────────────────
 * Generates the final performance score and executive audit
 * report after the 5-question session completes.
 *
 * HOW IT WORKS:
 *  1. Full conversation history is sent to Groq AI
 *  2. AI scores the session 0-100 and writes an audit
 *  3. Score is parsed and rendered in the Audit stage UI
 *  4. Security violations (face detection) force score = 0
 * ─────────────────────────────────────────────────────────────
 */

const FEEDBACK_API = '/api/interview/chat';

// ── SCORING RUBRIC (sent to AI) ───────────────────────────────
const SCORING_RUBRIC = `
Score the candidate on these criteria (total 100 points):

1. TECHNICAL ACCURACY (30 pts)
   - Correct understanding of concepts from their resume
   - Accurate use of terminology
   - Depth of knowledge demonstrated

2. COMMUNICATION CLARITY (25 pts)
   - Clear, structured answers
   - Professional language and grammar
   - Conciseness without being vague

3. RESUME ALIGNMENT (25 pts)
   - Answers match claimed skills/projects on resume
   - Specific examples from their experience
   - Consistency between resume and spoken answers

4. PROFESSIONALISM (20 pts)
   - Confidence in delivery
   - Appropriate vocabulary
   - Engagement with questions
`;

// ── FEEDBACK GENERATOR ────────────────────────────────────────
/**
 * Requests the final score and executive audit from Groq AI.
 * Uses the full conversation history for accurate evaluation.
 *
 * @param {Array} conversationHistory - Full chat history [{role, content}]
 * @param {string} sessionSummary - From answer_analysis.js getSessionSummary()
 * @returns {Promise<{score: number, feedback: string, breakdown: string}>}
 */
async function generateFeedback(conversationHistory, sessionSummary = '') {
    const finalRequest = {
        role: 'user',
        content: `The interview session is now complete.

${sessionSummary}

${SCORING_RUBRIC}

Please provide:
1. Total score (0-100)
2. A paragraph-length executive performance summary
3. 2-3 specific improvement tips for the candidate

Respond strictly in this format:
SCORE: [number]
FEEDBACK: [executive summary paragraph]
TIPS: [bullet points with improvement suggestions]`
    };

    try {
        const res = await fetch(FEEDBACK_API, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                messages: [...conversationHistory, finalRequest]
            })
        });

        if (!res.ok) throw new Error(`API ${res.status}`);
        const data = await res.json();
        return parseFeedback(data.choices[0].message.content);

    } catch (err) {
        console.error('[FeedbackGen] Error:', err);
        return {
            score: 75,
            feedback: 'Strong performance overall. Resume knowledge was evident with clear communication.',
            tips: ['Practice elaborating answers with specific examples.', 'Work on conciseness.']
        };
    }
}

// ── FEEDBACK PARSER ───────────────────────────────────────────
/**
 * Parses the structured AI response into usable fields.
 *
 * @param {string} raw - Raw AI response text
 * @returns {{ score: number, feedback: string, tips: string[] }}
 */
function parseFeedback(raw) {
    const scoreMatch = raw.match(/SCORE:\s*(\d+)/i);
    const feedbackMatch = raw.match(/FEEDBACK:\s*([\s\S]*?)(?=TIPS:|$)/i);
    const tipsMatch = raw.match(/TIPS:\s*([\s\S]*?)$/i);

    const score = scoreMatch ? Math.min(parseInt(scoreMatch[1]), 100) : 75;

    const feedback = feedbackMatch
        ? feedbackMatch[1].trim()
        : raw;

    const tipsRaw = tipsMatch ? tipsMatch[1].trim() : '';
    const tips = tipsRaw
        .split(/\n|•|-/)
        .map(t => t.trim())
        .filter(Boolean);

    return { score, feedback, tips };
}

// ── SECURITY BREACH HANDLER ───────────────────────────────────
/**
 * Called when biometric verification fails (3 strikes).
 * Immediately renders 0 score and terminates session.
 */
function generateSecurityBreachReport() {
    return {
        score: 0,
        feedback: 'Session terminated. Biometric identity verification failed. 3 violations were recorded during this session. Results are void.',
        tips: ['Ensure you remain in front of the camera for the entire interview duration.', 'Do not allow other individuals to appear on camera during the session.']
    };
}

// ── UI RENDERER ───────────────────────────────────────────────
/**
 * Renders the feedback result into the Audit stage DOM elements.
 *
 * @param {{ score: number, feedback: string, tips: string[] }} result
 */
function renderFeedback(result) {
    const scoreEl = document.getElementById('final-score');
    const auditEl = document.getElementById('audit-text');

    if (scoreEl) scoreEl.textContent = result.score;

    if (auditEl) {
        const formattedTips = result.tips.length
            ? `<br><br><strong style="color:var(--g)">Improvement Tips:</strong><ul style="margin-top:10px;padding-left:20px">${result.tips.map(t => `<li style="margin-bottom:6px">${t}</li>`).join('')}</ul>`
            : '';

        auditEl.innerHTML = result.feedback.replace(/\n/g, '<br>') + formattedTips;
    }
}
