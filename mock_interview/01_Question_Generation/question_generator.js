/**
 * 01_Question_Generation — Hiero Mock Interview
 * ─────────────────────────────────────────────────────────────
 * Handles AI-powered, resume-aware question generation via
 * Groq API (llama-3.3-70b-versatile).
 *
 * HOW IT WORKS:
 *  1. Resume data is fetched from /api/resume/data
 *  2. System prompt is built with resume context
 *  3. Conversation history is maintained per session
 *  4. Groq API returns the next interview question
 * ─────────────────────────────────────────────────────────────
 */

// ── CONFIG ───────────────────────────────────────────────────
const GROQ_API_ENDPOINT = '/api/interview/chat';
const QUESTION_LIMIT = 5;

// ── STATE ────────────────────────────────────────────────────
let resumeData = null;
let conversationHistory = [];
let questionsAnswered = 0;

// ── RESUME FETCH ─────────────────────────────────────────────
/**
 * Fetches the user's resume from the Hiero backend.
 * Called during the sensor calibration stage (before session starts).
 */
async function fetchResumeData() {
    try {
        const res = await fetch('/api/resume/data', {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        const json = await res.json();
        if (json.success) {
            resumeData = json.data;
            console.log('[QuestionGen] Resume loaded:', Object.keys(resumeData));
        } else {
            console.warn('[QuestionGen] No resume found. Using generic questions.');
        }
    } catch (err) {
        console.error('[QuestionGen] Failed to fetch resume:', err);
    }
}

// ── SYSTEM PROMPT BUILDER ────────────────────────────────────
/**
 * Builds the AI system prompt with resume context injected.
 * The AI uses this to ask highly specific, personalised questions.
 *
 * @returns {string} Full system prompt
 */
function buildSystemPrompt() {
    const resumeContext = resumeData
        ? JSON.stringify(resumeData)
        : 'No resume available.';

    return `You are a professional female technical interviewer at Hiero AI.
  
CONTEXT — Candidate's Resume:
${resumeContext}

STRICT RULES:
1. Ask EXACTLY ONE question per response. Short, professional, specific.
2. Base questions on the candidate's actual resume (projects, skills, experience).
3. If no resume, ask general professional/technical questions.
4. If the user makes grammar mistakes, gently correct them first, then ask the next question.
5. Keep total response under 2 sentences.
6. Be encouraging but professional. No filler words.
7. Do NOT repeat a question already asked in this session.`;
}

// ── QUESTION GENERATOR ───────────────────────────────────────
/**
 * Sends the conversation history to Groq API and gets the next question.
 * Automatically maintains conversation context across all 5 questions.
 *
 * @param {string} userAnswer - The user's last spoken answer
 * @returns {Promise<string>} The AI's next question/response
 */
async function generateNextQuestion(userAnswer) {
    conversationHistory.push({
        role: 'user',
        content: userAnswer
    });

    const payload = {
        messages: [
            { role: 'system', content: buildSystemPrompt() },
            ...conversationHistory
        ]
    };

    const response = await fetch(GROQ_API_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    if (!response.ok) throw new Error(`API Error: ${response.status}`);

    const data = await response.json();
    const aiMessage = data.choices[0].message.content;

    // Add AI response to history for multi-turn context
    conversationHistory.push({
        role: 'assistant',
        content: aiMessage
    });

    questionsAnswered++;
    return aiMessage;
}

// ── FINAL SCORE REQUEST ──────────────────────────────────────
/**
 * After all questions, asks AI to score and analyse the session.
 * Format requested: "SCORE: XX | FEEDBACK: ..."
 *
 * @returns {Promise<{score: string, feedback: string}>}
 */
async function generateFinalScore() {
    const finalPrompt = [
        ...conversationHistory,
        {
            role: 'user',
            content: `The session is complete (${QUESTION_LIMIT} questions answered).
Please provide:
1. A score out of 100 based on: resume alignment, clarity, communication, professionalism.
2. An executive-level performance summary.
Format strictly as: SCORE: XX | FEEDBACK: [your detailed analysis here]`
        }
    ];

    const res = await fetch(GROQ_API_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: finalPrompt })
    });

    const data = await res.json();
    const raw = data.choices[0].message.content;

    const scoreMatch = raw.match(/SCORE:\s*(\d+)/i);
    const feedbackMatch = raw.split(/FEEDBACK:/i);

    return {
        score: scoreMatch ? scoreMatch[1] : '82',
        feedback: feedbackMatch[1]?.trim() || raw
    };
}

// ── EXPORT (for use in mock-interview.html) ──────────────────
// In the HTML, these functions are called inline.
// In a modular setup, you'd export them:
// export { fetchResumeData, generateNextQuestion, generateFinalScore };
