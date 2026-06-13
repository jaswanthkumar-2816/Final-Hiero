const express = require('express');
const router = express.Router();
const axios = require('axios');
const multer = require('multer');

// ─────────────────────────────────────────────
// Multer — memory storage for resume uploads
// ─────────────────────────────────────────────
const multerUpload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 }
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
    const phaseConfig = PHASES[phase] || PHASES.intro;
    const { company, role, jobDescription, resumeText } = context || {};

    const companyLine = company
        ? `You are a senior interviewer at ${company}.`
        : `You are a senior interviewer at a top-tier technology company.`;

    const roleLine = role
        ? `You are conducting a ${role} interview.`
        : `You are conducting a professional job interview.`;

    const jdSection = jobDescription
        ? `\n\n## Job Description\n${jobDescription.substring(0, 1000)}`
        : '';

    const resumeSection = resumeText
        ? `\n\n## Candidate's Resume (Summary)\n${resumeText.substring(0, 1500)}`
        : '';

    return `You are an expert interviewer conducting a structured, professional job interview. ${companyLine} ${roleLine}

## Your Persona
- Professional, sharp, and respectful — like a Google or McKinsey interviewer
- You listen carefully and ask precise follow-up questions when answers are vague or incomplete
- You do not give away answers. You probe, clarify, and challenge thoughtfully
- You keep each response under 90 words
- You never break character or acknowledge that you are an AI

## Current Interview Phase: ${phaseConfig.label}
${phaseConfig.description}

## Interview Rules
- Ask ONE question at a time. Never stack multiple questions
- If the candidate's answer is shallow, ask ONE specific follow-up before moving on
- Transition between phases naturally — do not announce phase names to the candidate
- Use the candidate's name if you know it (extract from resume if available)
- Stay grounded in the job description and resume — ask questions that are directly relevant
- For technical questions: focus on depth of understanding, trade-offs, and real experience
- For behavioural questions: ask for specific situations, not hypothetical answers
${jdSection}
${resumeSection}`;
}

// ─────────────────────────────────────────────
// FEEDBACK PROMPT BUILDER
// Generates structured scorecard at interview end
// ─────────────────────────────────────────────
function buildFeedbackPrompt(context, conversationHistory) {
    const role = context?.role || 'the applied role';
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

    if (assistantMessages <= 2) return 'intro';
    if (assistantMessages <= 5) return 'behavioural';
    if (assistantMessages <= 9) return 'technical';
    if (assistantMessages <= 11) return 'hr';
    return 'feedback';
}

// ─────────────────────────────────────────────
// GROQ API CALLER
// ─────────────────────────────────────────────
async function callGroq(messages, maxTokens = 200) {
    if (!process.env.GROQ_API_KEY) {
        throw new Error('GROQ_API_KEY is not configured');
    }

    const response = await axios.post(
        'https://api.groq.com/openai/v1/chat/completions',
        {
            model: process.env.AI_MODEL || 'llama3-70b-8192', // Upgraded to 70b for better interview quality
            messages,
            temperature: 0.7,
            max_tokens: maxTokens,
            top_p: 0.9,
            frequency_penalty: 0.3  // Reduces repetitive phrasing across questions
        },
        {
            headers: {
                'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
                'Content-Type': 'application/json'
            },
            timeout: 15000
        }
    );

    return response.data.choices?.[0]?.message?.content || '';
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
        const { company, role, resumeText } = context || {};

        const systemPrompt = buildSystemPrompt(context, 'intro');

        // Extract candidate name from resume if possible (simple heuristic)
        const nameHint = resumeText
            ? `The resume is provided. Try to extract the candidate's name from the first few lines and address them by name.`
            : `You don't have the candidate's name yet — greet them warmly without a name.`;

        const userPrompt = `Start the interview now. ${nameHint}
Give a warm but professional opening greeting (2-3 sentences max), mention you're interviewing them for ${role || 'this role'}${company ? ` at ${company}` : ''}, and ask your first intro question to get them talking about themselves.`;

        const messages = [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
        ];

        const reply = await callGroq(messages, 200);

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
// ROUTE: POST /chat
// Main interview conversation handler
// ─────────────────────────────────────────────
router.post('/chat', async (req, res) => {
    try {
        const { messages, context, sessionId, phase: requestedPhase } = req.body;

        if (!messages || !Array.isArray(messages)) {
            return res.status(400).json({ success: false, error: 'messages array is required' });
        }

        // Detect current phase
        const currentPhase = detectPhase(messages, requestedPhase);

        // Handle final feedback generation separately
        if (currentPhase === 'feedback') {
            const feedbackPrompt = buildFeedbackPrompt(context, messages);
            const feedbackMessages = [
                { role: 'system', content: feedbackPrompt },
                { role: 'user', content: 'Generate the feedback report now.' }
            ];
            const feedback = await callGroq(feedbackMessages, 600);
            return res.json({
                reply: feedback,
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

        const reply = await callGroq(allMessages, 220);

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
            error: 'AI service error',
            details: error.response?.data || error.message
        });
    }
});

// ─────────────────────────────────────────────
// ROUTE: POST /feedback
// Explicit endpoint to generate final feedback report
// Call this when the frontend decides the interview is complete
// ─────────────────────────────────────────────
router.post('/feedback', async (req, res) => {
    try {
        const { messages, context, sessionId } = req.body;

        if (!messages || messages.length < 4) {
            return res.status(400).json({
                success: false,
                error: 'Not enough conversation to generate feedback (minimum 4 messages required)'
            });
        }

        const feedbackPrompt = buildFeedbackPrompt(context, messages);
        const feedbackMessages = [
            { role: 'system', content: feedbackPrompt },
            { role: 'user', content: 'Generate the structured feedback report now. Be honest and specific.' }
        ];

        const feedback = await callGroq(feedbackMessages, 700);

        res.json({
            success: true,
            feedback,
            sessionId,
            isComplete: true
        });
    } catch (err) {
        console.error('[Interview] /feedback error:', err.message);
        res.status(500).json({ success: false, error: 'Failed to generate feedback', details: err.message });
    }
});

// ─────────────────────────────────────────────
// ROUTE: POST /telemetry
// Session event logging (non-blocking)
// ─────────────────────────────────────────────
router.post('/telemetry', (req, res) => {
    const { sessionId, event, data } = req.body || {};
    if (sessionId && event) {
        console.log(`[Interview Telemetry] session=${sessionId} event=${event}`, data ? JSON.stringify(data) : '');
    }
    res.json({ success: true });
});

module.exports = router;
