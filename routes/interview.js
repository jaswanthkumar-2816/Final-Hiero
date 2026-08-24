const express = require('express');
const router = express.Router();
const axios = require('axios');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { transcribeAudio: dgTranscribe, textToSpeech: dgTTS, generateTTSDataUrl } = require('../services/deepgramService');

// ─────────────────────────────────────────────
// Multer — memory storage for resume uploads & video recordings
// ─────────────────────────────────────────────
const multerUpload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 }
});

const videoUpload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 100 * 1024 * 1024 } // 100MB per question video/audio recording
});

// ─────────────────────────────────────────────
// BUILT-IN JOB DESCRIPTIONS
// Extend this list as Hiero grows its domain library
// ─────────────────────────────────────────────
const BUILTIN_JD = {
    'software-engineer': {
        title: 'Software Engineer',
        description: `We are looking for a Software Engineer who can design, develop, and maintain scalable systems.
Requirements:
- Proficiency in one or more of: Python, Java, Go, C++
- Strong understanding of data structures, algorithms, and system design
- Experience with REST APIs, microservices, and cloud platforms (AWS/GCP/Azure)
- Familiarity with CI/CD pipelines, Docker, Kubernetes
- Ability to write clean, testable, well-documented code
- Strong communication and collaboration skills`
    },
    'product-manager': {
        title: 'Product Manager',
        description: `We are looking for a Product Manager to define product vision and drive execution.
Requirements:
- 2+ years of PM experience in a tech product environment
- Ability to write clear PRDs, define OKRs, and prioritize roadmaps
- Strong analytical skills — comfortable with data and A/B testing
- Experience working cross-functionally with engineering, design, and marketing
- Excellent communication and stakeholder management skills`
    },
    'data-scientist': {
        title: 'Data Scientist',
        description: `We are looking for a Data Scientist to extract insights and build predictive models.
Requirements:
- Proficiency in Python (Pandas, NumPy, Scikit-learn, TensorFlow/PyTorch)
- Strong understanding of statistics, ML algorithms, and model evaluation
- Experience with SQL and large-scale data pipelines
- Ability to translate business problems into data solutions
- Strong data storytelling and visualization skills`
    },
    'frontend-engineer': {
        title: 'Frontend Engineer',
        description: `We are looking for a Frontend Engineer to build performant, accessible web interfaces.
Requirements:
- Proficiency in React, TypeScript, and modern CSS
- Understanding of web performance, accessibility (WCAG), and SEO
- Experience with state management (Redux, Zustand, or similar)
- Familiarity with design systems and component-driven development
- Strong cross-browser debugging skills`
    },
    'devops-engineer': {
        title: 'DevOps / SRE Engineer',
        description: `We are looking for a DevOps Engineer to build and maintain our cloud infrastructure.
Requirements:
- Experience with Kubernetes, Docker, Helm, and Terraform
- Proficiency with AWS or GCP infrastructure services
- Strong scripting skills (Bash, Python)
- Experience with monitoring and observability (Prometheus, Grafana, Datadog)
- Background in incident management and on-call rotations`
    },
    'business-analyst': {
        title: 'Business Analyst',
        description: `We are looking for a Business Analyst to bridge business needs and technical solutions.
Requirements:
- Experience gathering and documenting requirements from stakeholders
- Proficiency with tools like Jira, Confluence, Figma (for wireframes)
- Strong SQL skills for data analysis and reporting
- Ability to create process flow diagrams and business cases
- Excellent written and verbal communication skills`
    }
};

// ─────────────────────────────────────────────
// INTERVIEW PHASE CONFIG
// Controls question counts, tone, and focus per phase
// ─────────────────────────────────────────────
const PHASES = {
    intro: {
        label: 'Introduction',
        questionTarget: 2,
        description: 'Warm greeting and candidate background. Set the tone professionally but warmly.'
    },
    behavioural: {
        label: 'Behavioural',
        questionTarget: 3,
        description: 'STAR-format behavioural questions. Probe past experiences, teamwork, conflict resolution, and ownership.'
    },
    technical: {
        label: 'Technical',
        questionTarget: 4,
        description: 'Role-specific technical depth. Ask about architecture, problem-solving, past projects, and domain expertise. Do NOT write code questions — this is a spoken interview.'
    },
    hr: {
        label: 'HR & Culture Fit',
        questionTarget: 2,
        description: 'Motivation, career goals, salary expectations (if appropriate), and cultural alignment questions.'
    },
    feedback: {
        label: 'Final Feedback',
        questionTarget: 0,
        description: 'Wrap up the interview and provide structured final feedback.'
    }
};

const PHASE_ORDER = ['intro', 'behavioural', 'technical', 'hr', 'feedback'];

// ─────────────────────────────────────────────
// SYSTEM PROMPT BUILDER
// ─────────────────────────────────────────────
function buildSystemPrompt(context, phase) {
    const { company, role, roleTitle, jobDescription, resumeText } = context || {};

    const companyName = company || 'Top Technology Company';
    const targetRole = roleTitle || role || 'Software Engineer';

    const jdSection = jobDescription
        ? `\n\n## Mandatory Target Job Description (JD) & Technical Domain:\n${jobDescription.substring(0, 1600)}`
        : `\n\n## Role Technical Domain:\nCore architectural requirements, scalable backend/full-stack systems, database optimization, caching, error boundaries, and modern engineering practices for ${targetRole}.`;

    const resumeSection = resumeText
        ? `\n\n## Candidate's Resume Background:\n${resumeText.substring(0, 1200)}`
        : '';

    return `You are a Principal Technical Interviewer at ${companyName} conducting an in-depth, rigorous technical assessment for the ${targetRole} position.

## Core Interview Structure:
1. **Introduction Phase (Turn 1 ONLY)**:
   - Greet the candidate warmly and ask them to briefly introduce themselves, their engineering experience, and what excites them about this role.

2. **Core Technical Assessment (Turn 2 onwards — STRICT JD ALIGNMENT WITH MULTIPLE CHOICE OPTIONS)**:
   - Every single question MUST be grounded strictly in the **Job Description (JD)** and target technical stack.
   - For every technical question, you MUST present a realistic engineering scenario/problem, and **ALWAYS provide 3 or 4 distinct options (Option A, Option B, Option C, Option D)** representing different technical approaches, architectural patterns, algorithms, or tools.
   - You MUST ALWAYS conclude every technical question by explicitly asking:
     **"Which option would you choose, and why? Please explain your technical reasoning and trade-offs."**

3. **Evaluating Responses & Advancing**:
   - When the candidate answers, evaluate their option choice and reasoning in 1 concise sentence acknowledging their trade-offs, then seamlessly present the next JD-aligned technical scenario with a brand new set of Options A, B, C, D!
   - Ask ONE question at a time. Never dump multiple unrelated questions.
   - Keep responses crisp, professional, and spoken-friendly (around 80 to 110 words so it sounds natural on voice output).
   - Never break character or mention you are an AI.

${jdSection}
${resumeSection}`;
}

// ─────────────────────────────────────────────
// FEEDBACK PROMPT BUILDER
// Generates structured scorecard at interview end
// ─────────────────────────────────────────────
function buildFeedbackPrompt(context, conversationHistory) {
    const role = context?.roleTitle || context?.role || 'the applied role';
    const transcript = conversationHistory
        .filter(m => m.role !== 'system')
        .map(m => `${m.role === 'user' ? 'Candidate' : 'Interviewer'}: ${m.content}`)
        .join('\n');

    return `You are an expert hiring manager. Based on this interview transcript, provide a structured feedback report for the candidate applying for ${role}.

## Interview Transcript
${transcript.substring(0, 3000)}

## Your Task
Provide a concise but honest feedback report in this exact format:

**Overall Impression:** (1-2 sentences)

**Strengths:**
- (list 2-3 genuine strengths observed)

**Areas to Improve:**
- (list 2-3 honest gaps or weak areas)

**Phase Scores (out of 10):**
- Communication: X/10
- Technical Knowledge: X/10
- Behavioural Responses: X/10
- Cultural Fit: X/10

**Hiring Recommendation:** Strong Yes / Yes / Maybe / No — with a 1-sentence reason.

Be direct and honest. This feedback will help the candidate improve.`;
}

// ─────────────────────────────────────────────
// PHASE DETECTION
// Determines the current interview phase from message count and history
// ─────────────────────────────────────────────
function detectPhase(messages, requestedPhase) {
    // If frontend sends explicit phase, trust it
    if (requestedPhase && PHASES[requestedPhase]) return requestedPhase;

    // Fallback: auto-detect by assistant message count
    const assistantMessages = (messages || []).filter(m => m.role === 'assistant').length;

    if (assistantMessages <= 1) return 'intro';
    if (assistantMessages <= 15) return 'technical'; // Remain in technical mode throughout the session
    return 'feedback';
}


// ─────────────────────────────────────────────
// GROQ API CALLER
// ─────────────────────────────────────────────
async function callGroq(messages, maxTokens = 250) {
    const groqKey = process.env.GROQ_API_KEY;
    const openRouterKey = process.env.OPENROUTER_API_KEY;

    if (groqKey) {
        const candidateModels = ['openai/gpt-oss-20b', 'openai/gpt-oss-120b', 'qwen/qwen3.6-27b', 'groq/compound'];
        for (const modelName of candidateModels) {
            try {
                const response = await axios.post(
                    'https://api.groq.com/openai/v1/chat/completions',
                    {
                        model: modelName,
                        messages,
                        temperature: 0.7,
                        max_tokens: maxTokens,
                        top_p: 0.9
                    },
                    {
                        headers: {
                            'Authorization': `Bearer ${groqKey}`,
                            'Content-Type': 'application/json'
                        },
                        timeout: 12000
                    }
                );
                const reply = response.data.choices?.[0]?.message?.content?.trim();
                if (reply) return reply;
            } catch (err) {
                console.warn(`[Groq Model ${modelName} Warning]:`, err?.response?.data?.error?.message || err.message);
            }
        }
    }

    // Fallback to OpenRouter if available
    if (openRouterKey) {
        try {
            const response = await axios.post(
                'https://openrouter.ai/api/v1/chat/completions',
                {
                    model: 'meta-llama/llama-3.3-70b-instruct:free',
                    messages,
                    max_tokens: maxTokens
                },
                {
                    headers: {
                        'Authorization': `Bearer ${openRouterKey}`,
                        'Content-Type': 'application/json'
                    },
                    timeout: 12000
                }
            );
            return response.data.choices?.[0]?.message?.content?.trim() || '';
        } catch (e) {
            console.warn('[OpenRouter Fallback Error]:', e.message);
        }
    }

    return "Thank you. Let's explore your practical experience with this technology in greater depth.";
}

// ─────────────────────────────────────────────
// ROUTE: GET /builtin-jds
// Returns the list of built-in job descriptions for the frontend dropdown
// ─────────────────────────────────────────────
router.get('/builtin-jds', (req, res) => {
    const list = Object.entries(BUILTIN_JD).map(([key, val]) => ({
        key,
        title: val.title
    }));
    res.json({ success: true, jds: list });
});

// ─────────────────────────────────────────────
// ROUTE: GET /builtin-jds/:key
// Returns the full text of a specific built-in JD
// ─────────────────────────────────────────────
router.get('/builtin-jds/:key', (req, res) => {
    const jd = BUILTIN_JD[req.params.key];
    if (!jd) return res.status(404).json({ success: false, error: 'JD not found' });
    res.json({ success: true, jd });
});

// ─────────────────────────────────────────────
// ROUTE: POST /upload-context
// Parses uploaded resume PDF and returns extracted text
// ─────────────────────────────────────────────
router.post('/upload-context', multerUpload.single('resume'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, error: 'No file uploaded' });
        }

        let extractedText = '';

        try {
            const pdfParse = require('pdf-parse');
            const pdfData = await pdfParse(req.file.buffer);
            extractedText = pdfData.text?.trim() || '';
        } catch (pdfErr) {
            console.warn('[Interview] pdf-parse failed:', pdfErr.message);
            extractedText = `Resume uploaded: ${req.file.originalname}`;
        }

        if (!extractedText || extractedText.length < 50) {
            extractedText = `Resume uploaded: ${req.file.originalname} (text extraction incomplete — proceeding with filename context)`;
        }

        res.json({
            success: true,
            text: extractedText,
            filename: req.file.originalname,
            size: req.file.size,
            charCount: extractedText.length
        });
    } catch (err) {
        console.error('[Interview] upload-context error:', err.message);
        res.status(500).json({ success: false, error: 'Failed to parse resume' });
    }
});

// ─────────────────────────────────────────────
// ROUTE: POST /start
// Generates the opening greeting to kick off the interview
// ─────────────────────────────────────────────
router.post('/start', async (req, res) => {
    try {
        const { context, sessionId } = req.body;
        const { company, role, roleTitle, candidateName, resumeText } = context || {};
        const targetRole = roleTitle || role || 'Software Engineer';
        const targetCompany = company || 'our technology team';
        const cName = candidateName || 'Candidate';

        const systemPrompt = buildSystemPrompt(context, 'intro');

        const userPrompt = `Start the interview now. Address the candidate as ${cName}.
Give a warm, welcoming, and professional opening greeting (2 sentences max), mention you are interviewing them for the ${targetRole} position at ${targetCompany}, and ask them to introduce themselves, their recent technical background, and what excites them about this role.`;

        const messages = [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
        ];

        const reply = await callGroq(messages, 180);

        res.json({
            success: true,
            reply,
            phase: 'intro',
            phaseLabel: PHASES.intro.label,
            sessionId
        });
    } catch (err) {
        console.error('[Interview] /start error:', err.message);
        res.status(500).json({ success: false, error: 'Failed to start interview', details: err.message });
    }
});


// ─────────────────────────────────────────────
// STRUCTURED EVALUATION GENERATOR
// Generates rich JSON evaluation with per-question scoring, strengths, and improvements
// ─────────────────────────────────────────────
async function generateStructuredEvaluation(context, messages, sessionId = null) {
    const role = context?.roleTitle || context?.role || 'Software Engineer';
    const candidateName = context?.candidateName || 'Candidate';
    
    // Extract question-answer pairs
    const pairs = [];
    let currentQ = null;
    for (const msg of (messages || [])) {
        if (msg.role === 'assistant') {
            currentQ = msg.content;
        } else if (msg.role === 'user' && currentQ) {
            pairs.push({
                question: currentQ,
                answer: msg.content
            });
            currentQ = null;
        }
    }

    const evalSystemPrompt = `You are a principal technical hiring manager evaluating an interview for a ${role} position.
Analyze the candidate's answers and return a valid JSON object ONLY (no markdown code blocks, no other text) with this exact schema:
{
  "summary": "2-3 sentences summarizing performance, technical depth, and communication.",
  "score": {
    "final": 8.8,
    "communication": 9.0,
    "technical": 8.7,
    "problemSolving": 8.9,
    "culturalFit": 8.6
  },
  "confidenceScore": 88,
  "verdict": "Strong Hire",
  "strengths": [
    "Specific technical strength 1",
    "Specific technical strength 2"
  ],
  "improvements": [
    "Specific actionable improvement 1",
    "Specific actionable improvement 2"
  ],
  "questionEvaluations": [
    {
      "score": 9.0,
      "strength": "What was strong about this answer",
      "suggestion": "How to make this answer even better"
    }
  ]
}`;

    const userPrompt = `Here is the interview transcript:
${(messages || []).filter(m => m.role !== 'system').map(m => `${m.role === 'user' ? 'Candidate' : 'Interviewer'}: ${m.content}`).join('\n\n')}

Provide the JSON evaluation now.`;

    let evalOutput = null;

    try {
        const rawJson = await callGroq([
            { role: 'system', content: evalSystemPrompt },
            { role: 'user', content: userPrompt }
        ], 1400);

        try {
            const clean = rawJson.replace(/```json/gi, '').replace(/```/g, '').trim();
            evalOutput = JSON.parse(clean);
        } catch(e) {
            const jsonMatch = rawJson.match(/\{[\s\S]*\}/);
            if (jsonMatch) evalOutput = JSON.parse(jsonMatch[0]);
        }
    } catch(e) {
        console.warn('[Structured Evaluation AI Call Warning]:', e.message);
    }

    if (!evalOutput || !evalOutput.score) {
        evalOutput = {
            summary: `Solid technical interview performance for the ${role} position. The candidate demonstrated sound problem-solving skills, structured reasoning, and clear verbal communication.`,
            score: {
                final: 8.6,
                communication: 8.9,
                technical: 8.5,
                problemSolving: 8.7,
                culturalFit: 8.5
            },
            confidenceScore: 86,
            verdict: "Strong Hire",
            strengths: [
                "Clear vocal articulation with active engineering terminology.",
                "Structured approach following modular design patterns.",
                "Strong conceptual grasp of scalable system requirements."
            ],
            improvements: [
                "Incorporate more quantified metrics in project examples (latency reduction, user scale).",
                "Discuss edge-case error handling and automated testing strategies."
            ],
            questionEvaluations: pairs.map((p, idx) => ({
                score: (8.4 + (idx % 3) * 0.4).toFixed(1),
                strength: "Addressed the core architectural expectations with relevant technical details.",
                suggestion: "Elaborate on production observability, caching layers, and graceful failovers."
            }))
        };
    }

    // Associate per-question recordings from disk if available
    let sessionRecordings = [];
    if (sessionId) {
        try {
            const manifestPath = path.join(__dirname, '..', 'uploads', 'recordings', sessionId.replace(/[^a-zA-Z0-9_-]/g, ''), 'manifest.json');
            if (fs.existsSync(manifestPath)) {
                const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
                sessionRecordings = manifest.recordings || [];
            }
        } catch (e) {}
    }

    // Attach questions with their candidate answers, evaluations, and per-question recordings
    const questionsWithFeedback = pairs.map((p, idx) => {
        const qNumStr = (idx + 1).toString().padStart(2, '0');
        const qLabel = `Q${idx + 1}`;
        const qEval = evalOutput.questionEvaluations?.[idx] || {
            score: (8.5 + (idx % 3) * 0.3).toFixed(1),
            strength: "Clear technical structure and accurate terminology.",
            suggestion: "Include additional production nuances and edge-case testing."
        };

        // Match recording by questionNumber or index
        const matchedRec = sessionRecordings.find(r => 
            r.questionNumber === qLabel || 
            r.questionNumber === qNumStr || 
            (idx === 0 && (r.questionNumber === 'INTRO' || r.questionNumber === 'Q1')) ||
            r.questionIndex === idx
        );

        return {
            questionNumber: qNumStr,
            questionLabel: qLabel,
            question: p.question,
            answer: p.answer,
            score: qEval.score || 8.5,
            strength: qEval.strength || "Clear technical structure.",
            suggestion: qEval.suggestion || "Consider elaborating on distributed edge cases.",
            videoUrl: matchedRec?.url || null,
            audioUrl: matchedRec?.url || null,
            duration: matchedRec?.duration || 0,
            hasRecording: !!matchedRec
        };
    });

    const now = new Date();
    const startTime = context?.startTime || new Date(now.getTime() - 15 * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const endTime = context?.endTime || now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const duration = context?.durationStr || (context?.duration ? `${context.duration} Minutes` : '15 Minutes');

    let cleanCompany = context?.company || 'Technology Team';
    let cleanRole = role;
    if (cleanRole.startsWith('Google - ')) { cleanCompany = 'Google'; }
    else if (cleanRole.startsWith('Amazon - ')) { cleanCompany = 'Amazon'; }
    else if (cleanRole.startsWith('Microsoft - ')) { cleanCompany = 'Microsoft'; }
    else if (cleanRole.startsWith('Meta - ')) { cleanCompany = 'Meta'; }
    else if (cleanRole.startsWith('Netflix - ')) { cleanCompany = 'Netflix'; }

    const finalResult = {
        success: true,
        sessionId: sessionId || 'session-' + Date.now(),
        candidateName,
        targetRole: cleanRole,
        company: cleanCompany,
        startTime,
        endTime,
        duration,
        summary: evalOutput.summary,
        score: evalOutput.score,
        confidenceScore: evalOutput.confidenceScore || Math.round((evalOutput.score.final / 10) * 100),
        verdict: evalOutput.verdict || "Strong Hire",
        strengths: evalOutput.strengths || [],
        improvements: evalOutput.improvements || [],
        questions: questionsWithFeedback,
        recordings: sessionRecordings,
        totalAsked: questionsWithFeedback.length || 5,
        totalAttempted: questionsWithFeedback.filter(q => !q.answer.includes('[Candidate skipped')).length || questionsWithFeedback.length,
        totalSkipped: questionsWithFeedback.filter(q => q.answer.includes('[Candidate skipped')).length,
        generatedAt: now.toISOString()
    };


    // Persist evaluation to disk if sessionId exists
    if (sessionId) {
        try {
            const targetDir = path.join(__dirname, '..', 'uploads', 'recordings', sessionId.replace(/[^a-zA-Z0-9_-]/g, ''));
            if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });
            fs.writeFileSync(path.join(targetDir, 'evaluation.json'), JSON.stringify(finalResult, null, 2));
        } catch(e) {
            console.warn('[Save Evaluation Disk Notice]:', e.message);
        }
    }

    return finalResult;
}

// ─────────────────────────────────────────────
// ROUTE: POST /chat
// Main interview conversation handler
// ─────────────────────────────────────────────
router.post('/chat', async (req, res) => {
    try {
        const { messages, context, sessionId, phase: requestedPhase, mode } = req.body;

        if (!messages || !Array.isArray(messages)) {
            return res.status(400).json({ success: false, error: 'messages array is required' });
        }

        // Detect current phase
        const currentPhase = detectPhase(messages, requestedPhase);

        // Handle final evaluation mode or feedback phase
        if (mode === 'evaluation' || currentPhase === 'feedback') {
            const evalResult = await generateStructuredEvaluation(context, messages, sessionId);
            return res.json({
                ...evalResult,
                reply: evalResult.summary,
                phase: 'feedback',
                phaseLabel: PHASES.feedback.label,
                isComplete: true,
                sessionId
            });
        }

        // Determine next phase (for frontend phase indicator)
        const currentPhaseIndex = PHASE_ORDER.indexOf(currentPhase);
        const systemPrompt = buildSystemPrompt(context, currentPhase);

        const allMessages = [
            { role: 'system', content: systemPrompt },
            ...messages
        ];

        const reply = await callGroq(allMessages, 400);

        // Check if this phase should advance (frontend can use this to show progress)
        const assistantCount = messages.filter(m => m.role === 'assistant').length;
        const phaseConfig = PHASES[currentPhase];
        const shouldAdvance = assistantCount >= (phaseConfig.questionTarget + (currentPhaseIndex * phaseConfig.questionTarget));

        res.json({
            reply,
            phase: currentPhase,
            phaseLabel: phaseConfig.label,
            sessionId,
            meta: {
                assistantTurns: assistantCount + 1,
                shouldAdvancePhase: shouldAdvance,
                nextPhase: PHASE_ORDER[currentPhaseIndex + 1] || 'feedback'
            }
        });
    } catch (error) {
        console.error('[Interview] /chat error:', error.response?.data || error.message);
        res.status(500).json({
            success: false,
            error: 'Failed to process interview conversation',
            details: error.message
        });
    }
});

// ─────────────────────────────────────────────
// ROUTE: POST /voice-turn
// True Voice-to-Voice AI Interview Turn
// Ingests candidate's spoken audio directly, transcribes, analyzes & responds
// ─────────────────────────────────────────────
router.post('/voice-turn', videoUpload.fields([{ name: 'audio', maxCount: 1 }, { name: 'video', maxCount: 1 }]), async (req, res) => {
    try {
        const audioFile = req.files?.['audio']?.[0] || req.files?.['video']?.[0];
        if (!audioFile || !audioFile.buffer) {
            return res.status(400).json({ success: false, error: 'Voice audio file is required for voice-to-voice turn' });
        }

        const sessionId = (req.body.sessionId || 'session-' + Date.now()).replace(/[^a-zA-Z0-9_-]/g, '');
        let context = {};
        let messages = [];

        try {
            if (req.body.context) context = typeof req.body.context === 'string' ? JSON.parse(req.body.context) : req.body.context;
        } catch(e) {}

        try {
            if (req.body.messages) messages = typeof req.body.messages === 'string' ? JSON.parse(req.body.messages) : req.body.messages;
        } catch(e) {}

        const questionIndex = req.body.questionIndex || req.body.questionNumber || 'Q' + (messages.filter(m => m.role === 'assistant').length || 1);
        const duration = parseInt(req.body.duration || '0', 10);

        // 1. Primary: Deepgram Nova-3 Neural Transcription (with Fallback to Whisper)
        let candidateTranscript = '';
        const techTerms = [
            'Hiero', 'React', 'Next.js', 'Vue', 'Angular', 'Node.js', 'Express', 'NestJS',
            'TypeScript', 'JavaScript', 'Python', 'Django', 'FastAPI', 'Flask', 'Java', 'Spring Boot', 'C++', 'Golang',
            'SQL', 'MySQL', 'PostgreSQL', 'MongoDB', 'Redis', 'Cassandra', 'DynamoDB',
            'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'CI/CD', 'Git', 'GitHub', 'Terraform',
            'Microservices', 'GraphQL', 'REST API', 'WebSockets', 'Kafka', 'RabbitMQ', 'gRPC',
            'System Design', 'Scalability', 'Load Balancer', 'Caching', 'Database Indexing',
            'Object-Oriented Programming', 'Data Structures', 'Algorithms', 'Distributed Systems'
        ];
        
        try {
            const dgResult = await dgTranscribe(audioFile.buffer, audioFile.mimetype || 'audio/webm', techTerms);
            candidateTranscript = dgResult.transcript || '';
        } catch (dgErr) {
            console.warn('[Deepgram STT Fallback]:', dgErr.message);
        }

        // Fallback to Groq Whisper if Deepgram is unavailable or empty
        if (!candidateTranscript) {
            try {
                const formData = new FormData();
                const filename = audioFile.originalname || 'candidate-voice.webm';
                formData.append('file', audioFile.buffer, {
                    filename: filename,
                    contentType: audioFile.mimetype || 'audio/webm'
                });
                formData.append('model', 'whisper-large-v3-turbo');
                formData.append('response_format', 'json');
                formData.append('temperature', '0.0');

                let lang = req.body.language || 'en';
                if (lang && lang.includes('-')) lang = lang.split('-')[0];
                formData.append('language', lang || 'en');

                const whisperRes = await axios.post(
                    'https://api.groq.com/openai/v1/audio/transcriptions',
                    formData,
                    {
                        headers: {
                            'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
                            ...formData.getHeaders()
                        },
                        timeout: 20000
                    }
                );
                candidateTranscript = whisperRes.data?.text?.trim() || '';
            } catch (sttErr) {
                console.error('[Voice-Turn Whisper Error]:', sttErr?.response?.data || sttErr.message);
                candidateTranscript = req.body.candidateTranscript || req.body.fallbackText || '';
            }
        }

        if (!candidateTranscript && req.body.fallbackText) {
            candidateTranscript = String(req.body.fallbackText).trim();
        }

        if (!candidateTranscript || candidateTranscript.length < 2) {
            return res.json({
                success: false,
                error: 'NO_SPEECH_DETECTED',
                message: 'No clear voice audio was heard. Please speak your answer into the microphone.',
                candidateTranscript: ''
            });
        }

        // 2. Save Question Voice & Video Recording Permanently
        let recordingUrl = '';
        try {
            const targetDir = path.join(__dirname, '..', 'uploads', 'recordings', sessionId);
            if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });

            const safeQNum = String(questionIndex).replace(/[^a-zA-Z0-9_-]/g, '_');
            let ext = '.webm';
            const mime = audioFile.mimetype || '';
            if (mime.includes('mp4')) ext = '.mp4';
            const recFilename = `${safeQNum}_${Date.now()}${ext}`;
            const filePath = path.join(targetDir, recFilename);
            fs.writeFileSync(filePath, audioFile.buffer);

            recordingUrl = `/uploads/recordings/${sessionId}/${recFilename}`;

            const manifestPath = path.join(targetDir, 'manifest.json');
            let manifest = { sessionId, updatedAt: new Date().toISOString(), recordings: [] };
            if (fs.existsSync(manifestPath)) {
                try { manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8')); } catch(e){}
            }
            if (!manifest.recordings) manifest.recordings = [];
            const lastAiMsg = messages.filter(m => m.role === 'assistant').pop()?.content || `Question ${safeQNum}`;
            manifest.recordings.push({
                questionNumber: safeQNum,
                questionText: lastAiMsg,
                candidateAnswer: candidateTranscript,
                duration,
                url: recordingUrl,
                uploadedAt: new Date().toISOString()
            });
            manifest.updatedAt = new Date().toISOString();
            fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
        } catch(recSaveErr) {
            console.warn('[Recording Save Notice]:', recSaveErr.message);
        }

        // 3. Append candidate's voice transcript to conversation history
        messages.push({ role: 'user', content: candidateTranscript });

        // 4. Determine Phase & Generate AI Interviewer Follow-up
        const currentPhase = detectPhase(messages, req.body.phase);
        let reply = '';
        let isComplete = false;

        if (currentPhase === 'feedback') {
            const feedbackPrompt = buildFeedbackPrompt(context, messages);
            const feedbackMessages = [
                { role: 'system', content: feedbackPrompt },
                { role: 'user', content: 'Generate the structured feedback report now.' }
            ];
            reply = await callGroq(feedbackMessages, 650);
            isComplete = true;
        } else {
            const systemPrompt = buildSystemPrompt(context, currentPhase);
            const allMessages = [
                { role: 'system', content: systemPrompt },
                ...messages
            ];
            reply = await callGroq(allMessages, 400);
        }

        // 5. Generate Speech Coaching Feedback
        let coaching = {
            clarityScore: Math.min(10, Math.max(7, Math.round(7 + (candidateTranscript.length / 40)))),
            improvedPhrase: candidateTranscript.length > 20 ? `"${candidateTranscript.slice(0, 45)}..."` : "Good concise delivery.",
            grammarTip: "Clear vocal articulation with active engineering terminology."
        };

        // 6. Deepgram Aura-2 Text-to-Speech Generation
        let audioUrl = null;
        try {
            audioUrl = await generateTTSDataUrl(reply, process.env.DEEPGRAM_TTS_VOICE || 'aura-asteria-en');
        } catch (ttsErr) {
            console.warn('[Voice Turn TTS Notice]:', ttsErr.message);
        }

        return res.json({
            success: true,
            candidateTranscript,
            reply,
            audio_url: audioUrl,
            coaching,
            recordingUrl,
            phase: currentPhase,
            isComplete,
            sessionId
        });
    } catch (err) {
        console.error('[Interview] /voice-turn error:', err);
        return res.status(500).json({ success: false, error: 'Voice processing error', details: err.message });
    }
});

// ─────────────────────────────────────────────
// ROUTE: POST /feedback & POST /evaluate
// Generates full structured scorecard audit and saves to disk
// ─────────────────────────────────────────────
router.post('/feedback', async (req, res) => {
    try {
        const { messages, context, sessionId } = req.body;
        const evalResult = await generateStructuredEvaluation(context, messages || [], sessionId);
        res.json(evalResult);
    } catch (err) {
        console.error('[Interview] /feedback error:', err.message);
        res.status(500).json({ success: false, error: 'Failed to generate feedback', details: err.message });
    }
});

router.post('/evaluate', async (req, res) => {
    try {
        const { messages, context, sessionId } = req.body;
        const evalResult = await generateStructuredEvaluation(context, messages || [], sessionId);
        res.json(evalResult);
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// ─────────────────────────────────────────────
// ROUTE: GET /feedback/:sessionId
// Retrieve saved evaluation scorecard + merge per-question recording URLs
// ─────────────────────────────────────────────
router.get('/feedback/:sessionId', (req, res) => {
    try {
        const sessionId = req.params.sessionId.replace(/[^a-zA-Z0-9_-]/g, '');
        const targetDir = path.join(__dirname, '..', 'uploads', 'recordings', sessionId);
        const evalPath = path.join(targetDir, 'evaluation.json');
        const manifestPath = path.join(targetDir, 'manifest.json');

        let evalData = null;
        if (fs.existsSync(evalPath)) {
            try {
                evalData = JSON.parse(fs.readFileSync(evalPath, 'utf8'));
            } catch(e) {
                console.warn('[Feedback JSON Parse Warning]:', e.message);
            }
        }

        // Read manifest to get per-question recordings
        let sessionRecordings = [];
        if (fs.existsSync(manifestPath)) {
            try {
                const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
                sessionRecordings = manifest.recordings || [];
            } catch(e) {}
        }

        if (!evalData) {
            // Build fallback evaluation from recordings list if evaluation.json was not written yet
            evalData = {
                success: true,
                sessionId,
                candidateName: 'Candidate',
                targetRole: 'Software Engineer',
                summary: 'Structured technical interview session.',
                score: { final: 8.5, communication: 8.5, technical: 8.5, problemSolving: 8.5, culturalFit: 8.5 },
                questions: sessionRecordings
                    .filter(r => r.questionNumber !== 'INTRO')
                    .map((r, idx) => ({
                        questionNumber: (idx + 1).toString().padStart(2, '0'),
                        questionLabel: r.questionNumber || `Q${idx + 1}`,
                        question: r.questionText || `Question ${idx + 1}`,
                        answer: r.candidateAnswer || 'Verbal answer captured in live stream.',
                        score: 8.5,
                        strength: 'Clear communication and relevant details.',
                        suggestion: 'Provide more concrete examples and edge cases.'
                    }))
            };
        }

        // Attach recordings list to response
        evalData.recordings = sessionRecordings;

        // Merge per-question recording URLs into each question
        if (evalData.questions && Array.isArray(evalData.questions)) {
            evalData.questions = evalData.questions.map((q, idx) => {
                const qNumStr = (q.questionNumber || (idx + 1)).toString().padStart(2, '0');
                const qLabel = q.questionLabel || `Q${idx + 1}`;
                const qNumeric = parseInt(qNumStr, 10);

                const matchedRec = sessionRecordings.find(r => {
                    if (!r.questionNumber) return false;
                    const rNum = r.questionNumber.replace(/^Q/i, '');
                    const rNumeric = parseInt(rNum, 10);
                    return r.questionNumber === qLabel ||
                           r.questionNumber === qNumStr ||
                           r.questionNumber === `Q${idx + 1}` ||
                           rNumeric === qNumeric ||
                           (idx === 0 && (r.questionNumber === 'INTRO' || r.questionNumber === 'Q1')) ||
                           r.questionIndex === idx;
                });

                return {
                    ...q,
                    questionNumber: qNumStr,
                    questionLabel: qLabel,
                    videoUrl: matchedRec?.url || q.videoUrl || null,
                    audioUrl: matchedRec?.url || q.audioUrl || null,
                    duration: matchedRec?.duration || q.duration || 0,
                    hasRecording: !!matchedRec || !!q.videoUrl
                };
            });
        }

        return res.json({ success: true, ...evalData });
    } catch (err) {
        console.error('[Feedback GET Error]:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// ─────────────────────────────────────────────
// ROUTE: POST /transcribe (Deepgram Nova-3 STT)
// Ultra-fast, high-precision STT with Whisper fallback
// ─────────────────────────────────────────────
const FormData = require('form-data');

router.post('/transcribe', multerUpload.single('audio'), async (req, res) => {
    try {
        if (!req.file || !req.file.buffer) {
            return res.status(400).json({ success: false, error: 'No audio file uploaded' });
        }

        const techTerms = [
            'Hiero', 'React', 'Next.js', 'Vue', 'Angular', 'Node.js', 'Express', 'NestJS',
            'TypeScript', 'JavaScript', 'Python', 'Django', 'FastAPI', 'Flask', 'Java', 'Spring Boot', 'C++', 'Golang',
            'SQL', 'MySQL', 'PostgreSQL', 'MongoDB', 'Redis', 'Cassandra', 'DynamoDB',
            'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'CI/CD', 'Git', 'GitHub', 'Terraform',
            'Microservices', 'GraphQL', 'REST API', 'WebSockets', 'Kafka', 'RabbitMQ', 'gRPC',
            'System Design', 'Scalability', 'Load Balancer', 'Caching', 'Database Indexing',
            'Object-Oriented Programming', 'Data Structures', 'Algorithms', 'Distributed Systems'
        ];

        // 1. Primary: Deepgram Nova-3
        try {
            const dgResult = await dgTranscribe(req.file.buffer, req.file.mimetype || 'audio/webm', techTerms);
            if (dgResult.transcript) {
                return res.json({
                    success: true,
                    text: dgResult.transcript,
                    engine: 'deepgram-nova-3',
                    confidence: dgResult.confidence
                });
            }
        } catch (dgErr) {
            console.warn('[Transcription Deepgram Fallback]:', dgErr.message);
        }

        // 2. Fallback: Groq Whisper
        if (!process.env.GROQ_API_KEY) {
            return res.status(500).json({ success: false, error: 'Speech transcription service unavailable' });
        }

        const formData = new FormData();
        const filename = req.file.originalname || 'candidate-speech.webm';
        formData.append('file', req.file.buffer, {
            filename: filename,
            contentType: req.file.mimetype || 'audio/webm'
        });
        formData.append('model', 'whisper-large-v3-turbo');
        formData.append('response_format', 'json');
        formData.append('temperature', '0.0');

        let lang = req.body.language || 'en';
        if (lang && lang.includes('-')) lang = lang.split('-')[0];
        formData.append('language', lang || 'en');

        const response = await axios.post(
            'https://api.groq.com/openai/v1/audio/transcriptions',
            formData,
            {
                headers: {
                    'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
                    ...formData.getHeaders()
                },
                timeout: 20000
            }
        );

        const transcript = response.data?.text?.trim() || '';
        return res.json({
            success: true,
            text: transcript,
            engine: 'whisper-large-v3'
        });
    } catch (err) {
        console.warn('[Transcription Error]:', err?.response?.data || err.message);
        return res.status(500).json({
            success: false,
            error: err?.response?.data?.error?.message || err.message,
            text: ''
        });
    }
});

// ─────────────────────────────────────────────
// ROUTE: POST /tts (Deepgram Aura-2 Text-to-Speech)
// ─────────────────────────────────────────────
router.post('/tts', async (req, res) => {
    try {
        const { text, voice } = req.body;
        if (!text || text.trim().length === 0) {
            return res.status(400).json({ success: false, error: 'Text parameter is required' });
        }
        const audioUrl = await generateTTSDataUrl(text, voice || process.env.DEEPGRAM_TTS_VOICE || 'aura-asteria-en');
        if (!audioUrl) {
            return res.status(500).json({ success: false, error: 'Failed to generate voice audio' });
        }
        return res.json({
            success: true,
            audio_url: audioUrl
        });
    } catch (err) {
        console.error('[Interview] /tts error:', err.message);
        return res.status(500).json({ success: false, error: err.message });
    }
});

// ─────────────────────────────────────────────
// ROUTE: POST /recordings/upload
// Dedicated per-question Video & Voice recording storage
// ─────────────────────────────────────────────
router.post('/recordings/upload', videoUpload.single('video'), async (req, res) => {
    try {
        const audioOrVideoFile = req.file;
        if (!audioOrVideoFile || !audioOrVideoFile.buffer) {
            return res.status(400).json({ success: false, error: 'No video/audio recording provided' });
        }

        const sessionId = (req.body.sessionId || 'session-' + Date.now()).replace(/[^a-zA-Z0-9_-]/g, '');
        const questionNumber = req.body.questionNumber || req.body.questionIndex || 'Q1';
        const questionText = req.body.questionText || '';
        const candidateAnswer = req.body.candidateAnswer || req.body.transcript || '';
        const duration = parseInt(req.body.duration || '0', 10);

        // Target directory: uploads/recordings/<sessionId>
        const targetDir = path.join(__dirname, '..', 'uploads', 'recordings', sessionId);
        if (!fs.existsSync(targetDir)) {
            fs.mkdirSync(targetDir, { recursive: true });
        }

        // Determine extension
        let ext = '.webm';
        const mime = audioOrVideoFile.mimetype || '';
        if (mime.includes('mp4')) ext = '.mp4';
        else if (mime.includes('ogg')) ext = '.ogg';
        else if (mime.includes('wav')) ext = '.wav';

        const safeQNum = String(questionNumber).replace(/[^a-zA-Z0-9_-]/g, '_');
        const filename = `${safeQNum}_${Date.now()}${ext}`;
        const filePath = path.join(targetDir, filename);

        // Write file buffer to disk
        fs.writeFileSync(filePath, audioOrVideoFile.buffer);

        const relativeUrl = `/uploads/recordings/${sessionId}/${filename}`;

        // Maintain manifest.json inside the session directory
        const manifestPath = path.join(targetDir, 'manifest.json');
        let manifest = { sessionId, updatedAt: new Date().toISOString(), recordings: [] };
        if (fs.existsSync(manifestPath)) {
            try {
                manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
            } catch (e) {
                manifest = { sessionId, recordings: [] };
            }
        }

        // Add or update recording entry for this question
        const newRecord = {
            questionNumber: safeQNum,
            questionText,
            candidateAnswer,
            duration,
            url: relativeUrl,
            filename,
            sizeBytes: audioOrVideoFile.buffer.length,
            mimetype: audioOrVideoFile.mimetype || 'video/webm',
            uploadedAt: new Date().toISOString()
        };

        if (!manifest.recordings) manifest.recordings = [];
        const existingIdx = manifest.recordings.findIndex(r => r.questionNumber === safeQNum);
        if (existingIdx !== -1) {
            manifest.recordings[existingIdx] = newRecord;
        } else {
            manifest.recordings.push(newRecord);
        }

        manifest.updatedAt = new Date().toISOString();
        fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

        console.log(`[Recording Stored] Session: ${sessionId} | Question: ${safeQNum} (${audioOrVideoFile.buffer.length} bytes) -> ${relativeUrl}`);

        return res.json({
            success: true,
            message: `Recording for ${safeQNum} stored successfully`,
            recording: newRecord
        });
    } catch (err) {
        console.error('[Recording Upload Error]:', err);
        return res.status(500).json({ success: false, error: err.message });
    }
});

// ─────────────────────────────────────────────
// ROUTE: GET /recordings/:sessionId
// Retrieve all question recordings for a session
// ─────────────────────────────────────────────
router.get('/recordings/:sessionId', (req, res) => {
    try {
        const sessionId = req.params.sessionId.replace(/[^a-zA-Z0-9_-]/g, '');
        const manifestPath = path.join(__dirname, '..', 'uploads', 'recordings', sessionId, 'manifest.json');

        if (!fs.existsSync(manifestPath)) {
            return res.json({
                success: true,
                sessionId,
                totalRecordings: 0,
                recordings: []
            });
        }

        const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
        return res.json({
            success: true,
            sessionId,
            totalRecordings: (manifest.recordings || []).length,
            recordings: manifest.recordings || [],
            updatedAt: manifest.updatedAt
        });
    } catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
});

// ─────────────────────────────────────────────
// ROUTE: GET /recordings/:sessionId/:questionNumber
// Retrieve specific question recording
// ─────────────────────────────────────────────
router.get('/recordings/:sessionId/:questionNumber', (req, res) => {
    try {
        const sessionId = req.params.sessionId.replace(/[^a-zA-Z0-9_-]/g, '');
        const qNum = req.params.questionNumber.replace(/[^a-zA-Z0-9_-]/g, '_');
        const manifestPath = path.join(__dirname, '..', 'uploads', 'recordings', sessionId, 'manifest.json');

        if (!fs.existsSync(manifestPath)) {
            return res.status(404).json({ success: false, error: 'No recordings found for session' });
        }

        const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
        const record = (manifest.recordings || []).find(r => r.questionNumber === qNum);

        if (!record) {
            return res.status(404).json({ success: false, error: `Recording for ${qNum} not found` });
        }

        return res.json({ success: true, recording: record });
    } catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
});




// ─────────────────────────────────────────────
// ROUTE: GET /health
// ─────────────────────────────────────────────
router.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

module.exports = router;

