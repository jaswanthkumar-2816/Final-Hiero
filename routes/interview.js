const express = require('express');
const router = express.Router();
const { Groq } = require('groq-sdk');
const mongoose = require('mongoose');
const rateLimit = require('express-rate-limit');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const fs = require('fs');

const upload = multer({ dest: 'uploads/' });

// Initialize Groq
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Basic Rate Limiter
const interviewLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: { error: "Too many requests. Please try again later." }
});
router.use(interviewLimiter);

/**
 * Technical Filter (Neural Safety Net)
 */
function validateAndClean(text, isFirst) {
    if (!text) return "";
    let cleaned = text
        .replace(/I['’]ve (taken a look at|reviewed|analyzed) your resume.*?\./gi, '')
        .replace(/I['’]m (impressed|interested|captivated) by.*?\./gi, '')
        .replace(/Based on your (experience|background|projects).*?,/gi, '')
        .replace(/It sounds like you have a strong grasp of.*?\./gi, '')
        .replace(/I (noticed|see) you (built|used|developed).*?,/gi, '')
        .trim();

    if (isFirst && !cleaned.includes("welcome! Let’s get started")) {
        const nameMatch = cleaned.match(/Hi (.*?),/);
        const name = nameMatch ? nameMatch[1] : "Candidate";
        const parts = cleaned.split('?');
        const question = parts.length > 0 ? parts[0] + '?' : "Can you elaborate on your project?";
        cleaned = `Hi ${name}, welcome! Let’s get started. ${question.replace(/Hi.*?!/g, '').trim()}`;
    }
    return cleaned;
}

function extractJSON(text) {
    try {
        return JSON.parse(text);
    } catch (e) {
        const match = text.match(/\{[\s\S]*\}/);
        if (match) {
            try { return JSON.parse(match[0]); } catch (e2) { return null; }
        }
        return null;
    }
}

// Mongoose Models
const sessionSchema = new mongoose.Schema({
    sessionId: { type: String, required: true, unique: true },
    userId: String,
    status: { type: String, default: 'active' }, 
    violations: { type: Number, default: 0 },
    questionCount: { type: Number, default: 0 },
    questionsAsked: { type: [String], default: [] },
    askedSkills: { type: [String], default: [] },
    score: Number,
    feedback: String,
    createdAt: { type: Date, default: Date.now }
});
const InterviewSession = mongoose.models.InterviewSession || mongoose.model('InterviewSession', sessionSchema);


router.post('/upload-context', upload.single('resume'), async (req, res) => {
    try {
        let resumeText = '';
        if (req.file) {
            const buffer = fs.readFileSync(req.file.path);
            const pdfData = await pdfParse(buffer);
            resumeText = pdfData.text.trim();
            fs.unlinkSync(req.file.path);
        }
        res.json({ success: true, text: resumeText });
    } catch (e) {
        if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
        res.status(500).json({ error: 'Failed to process PDF file.' });
    }
});

router.post('/chat', async (req, res) => {
    try {
        const { messages, sessionId, mode, context } = req.body;
        
        if (!sessionId || !messages || !Array.isArray(messages)) {
            return res.status(400).json({ error: "Invalid payload format." });
        }

        let session = await InterviewSession.findOne({ sessionId });
        if (!session) {
            session = new InterviewSession({ sessionId, questionCount: 0, requestedSkills: [], questionsAsked: [] });
            await session.save();
        }

        if (session.status !== 'active') {
            return res.status(403).json({ error: "Session closed" });
        }

        const config = {
          "5min": { total: 4, pattern: ["easy", "medium", "medium", "hard"] },
          "10min": { total: 6, pattern: ["easy", "easy", "medium", "medium", "hard", "followup"] }
        };
        const durationStr = (context && context.duration === 10) ? "10min" : "5min";
        const maxQuestions = config[durationStr].total;

        if (mode === 'evaluation' || session.questionCount >= maxQuestions) {
            const evaluatorSysPrompt = {
                role: 'system',
                content: `You are a technical auditor. Return JSON ONLY: {"score": {"final": 8.0}, "summary": "...", "mistakes": [], "improvements": []}`
            };
            const completion = await groq.chat.completions.create({
                messages: [...messages.slice(0, -1), evaluatorSysPrompt],
                model: 'llama-3.3-70b-versatile',
                temperature: 0.2
            });
            const evalResult = extractJSON(completion.choices[0].message.content) || { score:{final:7.5}, summary: "Audit complete." };
            session.status = "completed";
            await session.save();
            return res.json({ type: "result", ...evalResult });
        }

        const isFirst = session.questionCount === 0;
        const currentQIndex = session.questionCount + 1;
        const currentDifficulty = config[durationStr].pattern[session.questionCount];

        const systemPromptMsg = {
            role: 'system',
            content: `You are a FAANG Technical Interviewer.

CANDIDATE: ${context ? JSON.stringify({ name: context.candidateName, role: context.role, resumeExcerpt: (context.resumeText || "").substring(0, 1500) }) : 'Unknown'}
PREVIOUS_QUESTIONS: ${JSON.stringify(session.questionsAsked)}
PREVIOUS_SKILLS: ${JSON.stringify(session.askedSkills)}

STRICT REPETITION CONTROL (CRITICAL):
1. NO REPEATS: Do NOT ask the same question again. Look at PREVIOUS_QUESTIONS.
2. CONCEPT ROTATION: Each question must focus on a DIFFERENT skill/project from the resume.
3. GREETING: If isFirstQuestion: Start with "Hi <name>, welcome! Let’s get started."
4. PROGRESSION: Move from fundamental implementation to optimization (Tier: ${currentDifficulty}).
5. NO HALLUCINATION: Only use actual projects/skills from resumeExcerpt.
6. ECON: Under 25 words.

JSON ONLY:
{
  "reply": "<Greeting/Transition> <Direct unique question>",
  "type": "question",
  "difficulty": "${currentDifficulty}",
  "skill": "<skill tested>"
}`
        };

        const completion = await groq.chat.completions.create({
            messages: [systemPromptMsg, ...messages.filter(m => m.role !== 'system')],
            model: 'llama-3.3-70b-versatile',
            temperature: 0.3, // Slightly higher for variation
            max_tokens: 100
        });

        let parsedResponse = extractJSON(completion.choices[0].message.content) || {
            reply: isFirst ? `Hi ${context?.candidateName || 'Arjun'}, welcome! Let’s get started. How did you structure your backend project?` : "Ok, tell me about your database optimizations.",
            type: "question",
            skill: "Logic"
        };

        const cleanMsg = validateAndClean(parsedResponse.reply, isFirst);
        parsedResponse.reply = cleanMsg;

        // 💾 PERSISTENCE & ROTATION LOGIC
        session.questionCount += 1;
        session.questionsAsked.push(cleanMsg);
        if (parsedResponse.skill) session.askedSkills.push(parsedResponse.skill);
        await session.save();

        console.log(`\n[Hiero Engine] Q#${currentQIndex} | Skill: ${parsedResponse.skill}`);
        console.log(`💬: "${cleanMsg}"\n`);

        return res.json({
            reply: cleanMsg,
            type: "question",
            questionNumber: currentQIndex,
            done: session.questionCount >= maxQuestions
        });

    } catch (err) {
        console.error('Groq Error:', err);
        res.status(500).json({ reply: "Engine stable. Tell me about your architecture.", type: "fallback" });
    }
});

router.post('/telemetry', async (req, res) => {
    try {
        const { sessionId } = req.body;
        await InterviewSession.updateOne({ sessionId }, { $inc: { violations: 1 } });
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: "Telemetry fail" }); }
});

module.exports = router;
