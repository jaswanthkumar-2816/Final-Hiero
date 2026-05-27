const express = require('express');
const router = express.Router();
const cors = require('cors');
const { Groq } = require('groq-sdk');
const mongoose = require('mongoose');
const rateLimit = require('express-rate-limit');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables (fallback to parent directory's .env)
dotenv.config();
if (!process.env.GROQ_API_KEY) {
    dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });
}

// Multer Uploads configuration
const upload = multer({ dest: path.join(__dirname, 'uploads/') });

// Initialize Groq SDK safely
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY || 'mock-groq-key' });

// Setup Rate Limiting for standard API traffic safety
const interviewLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 150,
    message: { error: "Too many requests. Please try again later." }
});
router.use(interviewLimiter);

// ─── UTILITY FUNCTIONS ────────────────────────────────────────────────────────
function validateAndClean(text, isFirst, candidateName = "Candidate") {
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
        const name = nameMatch ? nameMatch[1] : candidateName;
        const parts = cleaned.split('?');
        const question = parts.length > 0 ? parts[0] + '?' : "Can you elaborate on your project?";
        cleaned = `Hi ${name}, welcome! Let’s get started. ${question.replace(/Hi.*?!/g, '').trim()}`;
    }
    return cleaned;
}

// Extract JSON utility
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

// ─── MONGOOSE MODELS & MEMORY BACKUP (OFFLINE STABILITY) ─────────────────────
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

// Memory storage backup when running offline or MongoDB is missing
const memorySessions = new Map();

async function findSession(sessionId) {
    if (mongoose.connection.readyState === 1) {
        try {
            return await InterviewSession.findOne({ sessionId });
        } catch (e) {
            console.warn('[Session] Database query failed, using memory fallback:', e.message);
        }
    }
    if (!memorySessions.has(sessionId)) {
        memorySessions.set(sessionId, {
            sessionId,
            status: 'active',
            violations: 0,
            questionCount: 0,
            questionsAsked: [],
            askedSkills: []
        });
    }
    return memorySessions.get(sessionId);
}

async function saveSession(session) {
    if (mongoose.connection.readyState === 1 && typeof session.save === 'function') {
        try {
            return await session.save();
        } catch (e) {
            console.warn('[Session] Database save failed, writing to memory cache:', e.message);
        }
    }
    memorySessions.set(session.sessionId, session);
    return session;
}

// ─── API ENDPOINTS ────────────────────────────────────────────────────────────

// PDF Parsing Endpoint
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
        console.error('PDF parsing error:', e);
        res.status(500).json({ error: 'Failed to process PDF file.' });
    }
});

// Chat Engine & Question Generator
const fallbackQuestions = {
    google: [
        "How do you analyze the time and space complexity of an algorithm using Big O notation?",
        "Could you explain how a hash table works internally and how collision resolution is handled?",
        "What is the difference between depth-first search (DFS) and breadth-first search (BFS) on trees?",
        "Could you design an efficient algorithm to find the first non-repeating character in a string?"
    ],
    meta: [
        "What is the Virtual DOM in React, and how does it optimize web rendering performance?",
        "Could you explain the difference between state and props in React components?",
        "How do you handle cross-origin resource sharing (CORS) or security headers in your frontend code?",
        "What are the benefits of using semantic HTML, and how do you ensure web accessibility (a11y)?"
    ],
    netflix: [
        "What is the event loop in Node.js, and how does it support asynchronous non-blocking I/O?",
        "Could you explain the difference between server-side rendering (SSR) and client-side rendering (CSR)?",
        "How do you handle security and user authentication safely in web applications?",
        "What is the difference between relational databases and NoSQL databases, and when do you use each?"
    ],
    amazon: [
        "What are the primary differences between virtual machines (EC2) and serverless computing (Lambda)?",
        "Could you explain how DNS routing and load balancers work in high-traffic cloud environments?",
        "What is infrastructure as code, and what are the main benefits of tools like Terraform?",
        "How do you ensure data integrity and backup security for cloud databases?"
    ],
    apple: [
        "Could you explain the fundamental difference between supervised and unsupervised learning?",
        "What is an activation function in a neural network, and why do we need non-linear functions?",
        "What is overfitting in machine learning models, and how do you prevent it?",
        "How do you prepare, clean, and normalize a raw dataset before training a model?"
    ],
    tcs: [
        "What are the main principles of object-oriented programming (OOP) and why are they useful?",
        "Could you explain the difference between compile-time polymorphism and runtime polymorphism?",
        "What are the different types of joins in SQL, and how do they differ?",
        "Could you explain the software development life cycle (SDLC) models you are familiar with?"
    ],
    infosys: [
        "What is the difference between an abstract class and an interface in Java or OOP?",
        "Could you explain how standard error handling and exception propagation works in your code?",
        "How do you perform unit testing and integration testing in your development workflow?",
        "What are standard HTTP status codes, and what do 200, 404, and 500 mean?"
    ],
    wipro: [
        "What is git version control, and how do you resolve merge conflicts in a team?",
        "Could you explain the difference between GET and POST HTTP requests?",
        "What is MVC architecture, and how does it separate concerns in a web application?",
        "How do you construct and test RESTful API endpoints?"
    ],
    zoho: [
        "How do you define a recursive function, and how do you prevent infinite recursion?",
        "Could you explain the difference between a stack and a queue data structure?",
        "How do you design a database schema for a simple SaaS application like an e-commerce cart?",
        "What is the difference between manual memory management and garbage collection?"
    ],
    flipkart: [
        "What is CSS Flexbox and CSS Grid, and when would you choose one over the other?",
        "How do modern browsers render a web page (critical rendering path)?",
        "What is event bubbling and capturing in JavaScript event propagation?",
        "How do you optimize images and assets to reduce page load time on mobile devices?"
    ],
    paytm: [
        "What is a transaction in database systems, and what do the ACID properties stand for?",
        "Could you explain how token-based authentication like JWT works securely?",
        "What is caching, and how do tools like Redis improve database query speed?",
        "How do you secure API endpoints against unauthorized access or SQL injection?"
    ]
};

router.post('/chat', async (req, res) => {
    try {
        const { messages, sessionId, mode, context } = req.body;
        
        if (!sessionId || !messages || !Array.isArray(messages)) {
            return res.status(400).json({ error: "Invalid payload format." });
        }

        let session = await findSession(sessionId);

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
            const evalResult = extractJSON(completion.choices[0].message.content) || { score: { final: 7.5 }, summary: "Audit complete." };
            session.status = "completed";
            await saveSession(session);
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

        // Wrap the Groq API call in a 4-second timeout to prevent loading page hangs
        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Groq Timeout')), 4000)
        );

        const completion = await Promise.race([
            groq.chat.completions.create({
                messages: [systemPromptMsg, ...messages.filter(m => m.role !== 'system')],
                model: 'llama-3.3-70b-versatile',
                temperature: 0.3,
                max_tokens: 100
            }),
            timeoutPromise
        ]);

        let parsedResponse = extractJSON(completion.choices[0].message.content) || {
            reply: isFirst ? `Hi ${context?.candidateName || 'Arjun'}, welcome! Let’s get started. How did you structure your backend project?` : "Ok, tell me about your database optimizations.",
            type: "question",
            skill: "Logic"
        };

        const cleanMsg = validateAndClean(parsedResponse.reply, isFirst, context?.candidateName);
        parsedResponse.reply = cleanMsg;

        // Persist session context state
        session.questionCount += 1;
        session.questionsAsked.push(cleanMsg);
        if (parsedResponse.skill) session.askedSkills.push(parsedResponse.skill);
        await saveSession(session);

        console.log(`\n[Standalone Hiero Engine] Q#${currentQIndex} | Skill: ${parsedResponse.skill}`);
        console.log(`💬: "${cleanMsg}"\n`);

        return res.json({
            reply: cleanMsg,
            type: "question",
            questionNumber: currentQIndex,
            done: session.questionCount >= maxQuestions
        });

    } catch (err) {
        console.warn('Groq SDK error or timeout, running premium local fallback engine:', err.message);

        // Generate a beautiful, contextual fallback question dynamically!
        let comp = 'zoho';
        const title = (context?.roleTitle || "").toLowerCase();
        if (title.includes('google')) comp = 'google';
        else if (title.includes('meta')) comp = 'meta';
        else if (title.includes('netflix')) comp = 'netflix';
        else if (title.includes('amazon')) comp = 'amazon';
        else if (title.includes('apple')) comp = 'apple';
        else if (title.includes('tcs')) comp = 'tcs';
        else if (title.includes('infosys')) comp = 'infosys';
        else if (title.includes('wipro')) comp = 'wipro';
        else if (title.includes('zoho')) comp = 'zoho';
        else if (title.includes('flipkart')) comp = 'flipkart';
        else if (title.includes('paytm')) comp = 'paytm';

        const name = context?.candidateName || 'Arjun';
        const qIndex = session.questionCount; // 0, 1, 2...
        const currentQIndex = qIndex + 1;
        
        let reply = "";
        const fallbackList = fallbackQuestions[comp] || fallbackQuestions['zoho'];
        const fallbackQ = fallbackList[qIndex % fallbackList.length];

        if (qIndex === 0) {
            reply = `Hi ${name}, welcome! Let’s get started. To begin, ${fallbackQ.charAt(0).toLowerCase() + fallbackQ.slice(1)}`;
        } else {
            reply = `That makes perfect sense. Moving on to our next technical topic: ${fallbackQ}`;
        }

        // Update session state so candidate can proceed seamlessly!
        session.questionCount += 1;
        session.questionsAsked.push(reply);
        session.askedSkills.push("Technical Fundamentals");
        await saveSession(session);

        const durationStr = (context && context.duration === 10) ? "10min" : "5min";
        const maxQuestions = (durationStr === "10min") ? 6 : 4;

        return res.json({
            reply: reply,
            type: "question",
            questionNumber: currentQIndex,
            done: session.questionCount >= maxQuestions
        });
    }
});

// Telemetry endpoint
router.post('/telemetry', async (req, res) => {
    try {
        const { sessionId } = req.body;
        const session = await findSession(sessionId);
        session.violations = (session.violations || 0) + 1;
        await saveSession(session);
        res.json({ success: true });
    } catch (e) {
        console.error('Telemetry reporting failed:', e);
        res.status(500).json({ error: "Telemetry fail" });
    }
});

module.exports = router;

// ─── DUAL-MODE STANDALONE SERVER EXECUTION ─────────────────────────────────────
if (require.main === module) {
    const app = express();
    const MOCK_PORT = process.env.MOCK_INTERVIEW_PORT || 5005;

    app.use(cors());
    app.use(express.json());

    // Safe DB connection logic
    const dbUri = process.env.MONGODB_URI;
    if (dbUri) {
        console.log('⏳ Standalone Backend: Connecting to MongoDB...');
        mongoose.connect(dbUri)
            .then(() => console.log('✅ Standalone MongoDB connected successfully'))
            .catch(err => console.error('❌ Standalone MongoDB connection error:', err.message));
    } else {
        console.warn('⚠️ Standalone Backend: MONGODB_URI not found. Running with high-stability in-memory session engine.');
    }

    // Register primary routes
    app.use('/api/interview', router);

    // Static assets serving for independent deployment
    const parentDir = path.join(__dirname, '..');
    app.use(express.static(parentDir));
    app.use('/mock-assets', express.static(path.join(__dirname, '..', '..', 'mock_interview-assets')));
    app.get('/', (req, res) => {
        res.sendFile(path.join(parentDir, 'mock-interview.html'));
    });

    app.listen(MOCK_PORT, () => {
        console.log(`
========================================================================
🚀 Hiero Mock Interview STANDALONE SERVER is LIVE at:
   👉 http://localhost:${MOCK_PORT}

   📁 Serving mock-interview.html from: ${parentDir}
   🔐 API Endpoints mounted at: http://localhost:${MOCK_PORT}/api/interview
========================================================================
        `);
    });
}
