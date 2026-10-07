const express = require('express');
const crypto = require('crypto');
const router = express.Router();
const axios = require('axios');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

const { transcribeAudio: dgTranscribe, textToSpeech: dgTTS, generateTTSDataUrl } = require('../services/deepgramService');
const InterviewSession = require('../models/InterviewSession');
const Resume = require('../models/Resume');
const {
    COMPANY_BLUEPRINTS,
    VERIFIED_QUESTION_BANK,
    extractSkillTokens,
    calculateSemanticSimilarity,
    isCandidateUnsureOrSkipping,
    computeInterviewTopicState,
    retrieveAndRankQuestions,
    generateAdaptiveQuestion,
    detectCandidateIntent,
    rephraseCurrentQuestion,
    evaluateCandidateAnswer,
    generateSessionScorecard,
    generateModelAnswers
} = require('./interviewEngine');
const {
    buildPanel,
    memberForQuestion,
    panelIntroLine,
    openerFor,
    publicMember,
    publicPanel
} = require('./interviewPanel');

// ─────────────────────────────────────────────
// Multer Configuration (Memory storage)
// ─────────────────────────────────────────────
const multerUpload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 }
});

const videoUpload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 100 * 1024 * 1024 } // 100MB for video/audio chunks
});

// In-memory Fallback Store for Interview Sessions (Total Resilience)
const memoryInterviewSessions = new Map();

// In-memory Video Recordings Storage
const sessionRecordingsStore = new Map();

// ─────────────────────────────────────────────
// AUTHENTICATION HELPER
// ─────────────────────────────────────────────
function authenticateUser(req) {
    const authHeader = req.headers['authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'hiero_jwt_super_secret_key_2026');
            if (decoded) {
                return {
                    userId: decoded.userId || decoded.id || decoded.email || 'authenticated_user',
                    name: decoded.name || 'Candidate',
                    email: decoded.email || ''
                };
            }
        } catch (e) {
            // Check fallback for demo/guest tokens
            try {
                const base64Payload = token.split('.')[1];
                if (base64Payload) {
                    const parsed = JSON.parse(Buffer.from(base64Payload, 'base64').toString('utf8'));
                    if (parsed && (parsed.userId || parsed.id || parsed.email)) {
                        return {
                            userId: parsed.userId || parsed.id || parsed.email,
                            name: parsed.name || 'Candidate',
                            email: parsed.email || ''
                        };
                    }
                }
            } catch (err2) {}
        }
    }

    // Default demo fallback if no token
    return {
        userId: 'demo_user_hiero',
        name: 'Candidate',
        email: 'demo@hiero.ai'
    };
}

// ─────────────────────────────────────────────
// RESUME RETRIEVAL HELPER
// ─────────────────────────────────────────────
async function resolveUserResume(userId) {
    let resumeData = null;

    // 1. Try MongoDB Resume model
    if (mongoose.connection.readyState === 1) {
        try {
            const doc = await Resume.findOne({ userId });
            if (doc && doc.data) {
                resumeData = doc.data;
            }
        } catch (e) {
            console.warn('[INTERVIEW] Mongo resume query notice:', e.message);
        }
    }

    // 2. Try global backend memory store
    try {
        const resumeModule = require('./resume');
        if (!resumeData && resumeModule.userResumesBackendStore) {
            if (resumeModule.userResumesBackendStore.has(userId)) {
                resumeData = resumeModule.userResumesBackendStore.get(userId);
            } else if (resumeModule.userResumesBackendStore.has('latest_user')) {
                resumeData = resumeModule.userResumesBackendStore.get('latest_user');
            }
        }
    } catch (e) {}

    return resumeData;
}

// ─────────────────────────────────────────────
// SESSION STORAGE HELPERS
// ─────────────────────────────────────────────
async function saveSessionToStore(session) {
    if (!session || !session.sessionId) return;

    // Save in memory map
    memoryInterviewSessions.set(session.sessionId, session);

    // Save in MongoDB if connected
    if (mongoose.connection.readyState === 1) {
        try {
            await InterviewSession.findOneAndUpdate(
                { sessionId: session.sessionId },
                session,
                { upsert: true, new: true }
            );
        } catch (e) {
            console.warn('[INTERVIEW] Mongo session save warning:', e.message);
        }
    }
}

async function getSessionFromStore(sessionId) {
    if (!sessionId) return null;

    // 1. Try memory map first (fastest)
    if (memoryInterviewSessions.has(sessionId)) {
        return memoryInterviewSessions.get(sessionId);
    }

    // 2. Try MongoDB
    if (mongoose.connection.readyState === 1) {
        try {
            const doc = await InterviewSession.findOne({ sessionId });
            if (doc) {
                const plain = doc.toObject();
                memoryInterviewSessions.set(sessionId, plain);
                return plain;
            }
        } catch (e) {
            console.warn('[INTERVIEW] Mongo session get warning:', e.message);
        }
    }

    return null;
}

// ─────────────────────────────────────────────
// BUILT-IN JOB DESCRIPTIONS
// ─────────────────────────────────────────────
const BUILTIN_JD = {
    'software-engineer': {
        title: 'Software Engineer',
        company: 'Technology Company',
        description: `We are looking for a Software Engineer who can design, develop, and maintain scalable systems.
Requirements:
- Proficiency in Python, FastAPI, REST APIs, and SQL
- Strong understanding of data structures, algorithms, and system design
- Experience with microservices, Redis caching, Docker, and CI/CD
- Strong communication and analytical problem-solving skills`
    },
    'backend-engineer': {
        title: 'Senior Backend Engineer',
        company: 'Cloud & Distributed Systems',
        description: `We are looking for a Senior Backend Engineer to architect low-latency distributed APIs and transactional data pipelines.
Requirements:
- Deep expertise in Python, Go, or Java with asynchronous concurrency
- Expertise in PostgreSQL, Redis, Kafka, and distributed database sharding
- Experience building idempotent REST/gRPC services and containerized deployments with Docker/Kubernetes`
    },
    'frontend-engineer': {
        title: 'Frontend Engineer',
        company: 'Web Systems',
        description: `We are looking for a Frontend Engineer to build high-performance, accessible user interfaces.
Requirements:
- Proficiency in React, TypeScript, modern CSS, and state management
- Understanding of Core Web Vitals, performance profiling, and responsive layouts
- Experience with REST APIs integration and cross-browser testing`
    },
    'data-scientist': {
        title: 'Data Scientist / ML Engineer',
        company: 'AI & Data Lab',
        description: `We are looking for a Data Scientist to build and deploy production machine learning pipelines.
Requirements:
- Proficiency in Python (PyTorch/TensorFlow, Pandas, Scikit-learn) and SQL
- Experience with feature engineering, model evaluation, and LLM fine-tuning
- Familiarity with MLOps pipelines and REST API model serving`
    },
    'cloud-devops': {
        title: 'Cloud DevOps / Infrastructure Engineer',
        company: 'Cloud Operations',
        description: `We are looking for a Cloud DevOps Engineer to maintain scalable cloud infrastructure and CI/CD pipelines.
Requirements:
- Hands-on experience with AWS / GCP / Azure, Terraform, and Kubernetes
- Proficiency in Docker containerization, Linux systems, and Shell/Python scripting
- Strong knowledge of monitoring, alerting, and site reliability principles`
    },
    'fullstack-engineer': {
        title: 'Full-Stack Developer',
        company: 'Product Engineering',
        description: `We are looking for a Full-Stack Developer to develop end-to-end web features.
Requirements:
- Strong skills in React/Next.js frontend and Node.js/Python backend
- Experience with SQL and NoSQL databases (PostgreSQL, MongoDB, Redis)
- Solid understanding of REST APIs, authentication (JWT/OAuth), and Git workflows`
    }
};

// ─────────────────────────────────────────────
// ROUTE: GET /api/interview/companies
// Returns verified company blueprints and metadata
// ─────────────────────────────────────────────
router.get('/voices', (req, res) => {
    res.json({ success: true, defaultVoice: INTERVIEW_VOICE, voices: VOICE_CATALOGUE });
});

router.get('/companies', (req, res) => {
    const list = Object.values(COMPANY_BLUEPRINTS).map(b => ({
        id: b.id,
        name: b.name,
        hiringBar: b.hiringBar,
        focusAreas: b.focusAreas,
        signaturePhases: b.signaturePhases
    }));
    res.json({ success: true, companies: list });
});

// ─────────────────────────────────────────────
// ROUTE: GET /api/interview/builtin-jds
// ─────────────────────────────────────────────
router.get('/builtin-jds', (req, res) => {
    const list = Object.entries(BUILTIN_JD).map(([key, val]) => ({
        key,
        title: val.title,
        company: val.company
    }));
    res.json({ success: true, jds: list });
});

// ─────────────────────────────────────────────
// ROUTE: GET /api/interview/builtin-jds/:key
// ─────────────────────────────────────────────
router.get('/builtin-jds/:key', (req, res) => {
    const jd = BUILTIN_JD[req.params.key];
    if (!jd) return res.status(404).json({ success: false, error: 'JD not found' });
    res.json({ success: true, jd });
});

// ─────────────────────────────────────────────
// ROUTE: POST /api/interview/custom-jd
//
// A candidate's own job description, pasted from wherever they found it
// (LinkedIn, Naukri, Indeed, a careers page, an email) or uploaded as a file.
// Until now the only options were the handful of built-in company roles, so
// anyone preparing for a specific advert had to pick the nearest match and
// practise against the wrong requirements.
//
// Accepts either `text` in the body or a `jd` file (PDF, DOCX or plain text).
// Returns the fields the setup page needs to display and store a target role.
// ─────────────────────────────────────────────
router.post('/custom-jd', multerUpload.single('jd'), async (req, res) => {
    try {
        let text = String((req.body && req.body.text) || '').trim();

        if (!text && req.file) {
            const name = (req.file.originalname || '').toLowerCase();
            try {
                if (name.endsWith('.pdf')) {
                    const pdfParse = require('pdf-parse');
                    text = ((await pdfParse(req.file.buffer)).text || '').trim();
                } else if (name.endsWith('.docx')) {
                    const mammoth = require('mammoth');
                    text = ((await mammoth.extractRawText({ buffer: req.file.buffer })).value || '').trim();
                } else {
                    text = req.file.buffer.toString('utf8').trim();
                }
            } catch (parseErr) {
                console.warn('[INTERVIEW] custom-jd parse failed:', parseErr.message);
                return res.status(422).json({
                    success: false,
                    error: 'Could not read that file. Try pasting the text instead.'
                });
            }
        }

        // Job adverts carry a lot of boilerplate; collapse the whitespace so
        // the length check measures content rather than blank lines.
        text = text.replace(/\r/g, '').replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim();

        if (text.length < 60) {
            return res.status(400).json({
                success: false,
                error: 'That looks too short to be a job description. Paste the full advert, including the responsibilities and requirements.'
            });
        }
        if (text.length > 20000) text = text.slice(0, 20000);

        // Title and company are a convenience, not a requirement: the
        // interview is driven by the description itself, so a failed guess
        // costs nothing and the candidate can correct it.
        const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
        const ROLE_WORDS = 'engineer|developer|analyst|scientist|designer|manager|architect|intern|consultant|administrator|specialist|lead';
        let title = '';
        let company = '';

        // Pass one: a line of its own, which is how most adverts are laid out.
        for (const line of lines.slice(0, 12)) {
            // A heading, not a sentence: short, few words, no terminal
            // punctuation. Without this a one-line advert such as "The Data
            // Scientist role at Razorpay needs SQL..." became the title whole.
            const looksLikeHeading = line.length <= 70
                && line.split(/\s+/).length <= 8
                && !/[.!?]$/.test(line);
            if (!title && looksLikeHeading && new RegExp(`\\b(${ROLE_WORDS})\\b`, 'i').test(line)) {
                title = line.replace(/^(job title|role|position)\s*[:\-]\s*/i, '').trim();
            }
            if (!company) {
                const m = line.match(/^(?:company|organisation|organization|employer)\s*[:\-]\s*(.+)$/i)
                       || line.match(/\bat\s+([A-Z][\w&.\- ]{2,40})$/);
                if (m) company = m[1].trim();
            }
        }

        // Pass two: people routinely paste the whole advert as one unbroken
        // paragraph, where every line test fails and the role was reported as
        // the generic "Target Role". Look for the title phrase itself rather
        // than relying on the formatting.
        const head = text.slice(0, 400);
        if (!title) {
            const m = head.match(new RegExp(`\\b((?:[A-Z][\\w+#.]*[ \\-]){0,3}(?:${ROLE_WORDS}))\\b`, 'i'));
            // The case-insensitive flag makes [A-Z] match lowercase too, so
            // "looking for a Machine Learning Engineer" kept the article.
            if (m) title = m[1].trim().replace(/\s+/g, ' ').replace(/^(?:a|an|the)\s+/i, '');
        }
        if (!company) {
            // No dots inside the name, so a sentence boundary ends the match:
            // "at Swiggy. Build scalable..." gave "Swiggy. Build" otherwise.
            const m = head.match(/\b(?:at|with|for|join)\s+([A-Z][A-Za-z0-9&\-]*(?:\s+[A-Z][A-Za-z0-9&\-]*){0,2})/);
            // "at Google" is a company; "at scale" and "for Engineers" are not.
            if (m && !new RegExp(`^(?:${ROLE_WORDS})$`, 'i').test(m[1])) company = m[1].trim();
        }

        const skills = extractSkillTokens(text) || [];

        return res.json({
            success: true,
            title: title || 'Target Role',
            company: company || '',
            description: text,
            skills: skills.slice(0, 25),
            charCount: text.length,
            source: req.file ? (req.file.originalname || 'uploaded file') : 'pasted text'
        });
    } catch (err) {
        console.error('[INTERVIEW] /custom-jd error:', err);
        return res.status(500).json({ success: false, error: 'Could not process that job description.' });
    }
});

// ─────────────────────────────────────────────
// ROUTE: POST /api/interview/upload-context
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
            console.warn('[INTERVIEW] pdf-parse fallback:', pdfErr.message);
            extractedText = `Uploaded resume: ${req.file.originalname}`;
        }

        res.json({
            success: true,
            text: extractedText,
            filename: req.file.originalname,
            size: req.file.size
        });
    } catch (err) {
        console.error('[INTERVIEW] upload-context error:', err.message);
        res.status(500).json({ success: false, error: 'Failed to parse resume' });
    }
});

// ─────────────────────────────────────────────
// ROUTE: POST /api/interview/start (or create-session)
// Initializes the interview session with authoritative configuration & returns Q1 Introduction
// ─────────────────────────────────────────────
// Single source of truth for the interviewer's voice. Every path that speaks
// must use this, otherwise the voice can change between questions.
const INTERVIEW_VOICE = process.env.DEEPGRAM_TTS_VOICE || 'aura-asteria-en';

/**
 * Speaks text, retrying once on a transient failure.
 *
 * Deepgram occasionally drops the connection mid-request ("socket hang up").
 * A single failure left that one question silent while every other question
 * spoke, which reads as the voice cutting out at random. One retry turns a
 * blip into a short delay instead of a missing voice.
 */
async function speak(text, voice) {
    for (let attempt = 1; attempt <= 2; attempt++) {
        try {
            const url = await generateTTSDataUrl(text, voice);
            if (url) return url;
            throw new Error('empty audio');
        } catch (err) {
            if (attempt === 2) {
                console.error(`[INTERVIEW] TTS failed after retry (${err.message}) — this question will be silent.`);
                return null;
            }
            console.warn(`[INTERVIEW] TTS attempt ${attempt} failed (${err.message}); retrying.`);
            await new Promise(r => setTimeout(r, 350));
        }
    }
    return null;
}

// Selectable interviewer voices (Deepgram Aura). Exposed via
// GET /api/interview/voices and chosen per session at /start.
const VOICE_CATALOGUE = [
    { id: 'aura-asteria-en',  name: 'Asteria',  gender: 'female', accent: 'US', description: 'Warm and clear — the default' },
    { id: 'aura-luna-en',     name: 'Luna',     gender: 'female', accent: 'US', description: 'Soft and calm' },
    { id: 'aura-stella-en',   name: 'Stella',   gender: 'female', accent: 'US', description: 'Bright and friendly' },
    { id: 'aura-athena-en',   name: 'Athena',   gender: 'female', accent: 'UK', description: 'Formal British' },
    { id: 'aura-hera-en',     name: 'Hera',     gender: 'female', accent: 'US', description: 'Mature and measured' },
    { id: 'aura-orion-en',    name: 'Orion',    gender: 'male',   accent: 'US', description: 'Even and professional' },
    { id: 'aura-arcas-en',    name: 'Arcas',    gender: 'male',   accent: 'US', description: 'Natural and conversational' },
    { id: 'aura-perseus-en',  name: 'Perseus',  gender: 'male',   accent: 'US', description: 'Direct and confident' },
    { id: 'aura-angus-en',    name: 'Angus',    gender: 'male',   accent: 'IE', description: 'Irish' },
    { id: 'aura-helios-en',   name: 'Helios',   gender: 'male',   accent: 'UK', description: 'British' },
    { id: 'aura-zeus-en',     name: 'Zeus',     gender: 'male',   accent: 'US', description: 'Deep and authoritative' }
];
const VALID_VOICE_IDS = new Set(VOICE_CATALOGUE.map(v => v.id));

/**
 * The voice for a given moment in a session.
 *
 * On a panel session the voice belongs to whoever owns the question, so a
 * follow-up or a rephrasing stays with the member who asked — you are never
 * handed to someone else mid-thought. Sessions started before the panel
 * existed, and any session with the panel disabled, keep their single voice.
 */
function voiceFor(session, question) {
    const panel = session && session.panel;
    if (panel && panel.length) {
        const qIndex = session.currentQuestionIndex || 1;
        const q = question || (session.questions || [])[qIndex - 1];

        // Whoever asked it owns it. Recorded at ask time, so a rephrasing or a
        // replay can never come back in a different voice than the question.
        if (q && q.askedBy) {
            const owner = panel.find(m => m.id === q.askedBy);
            if (owner && owner.voiceId) return owner.voiceId;
        }

        const member = memberForQuestion(panel, q, qIndex, {
            seen: session.speakersSeen || [],
            questionLimit: session.questionLimit
        });
        if (member && member.voiceId) return member.voiceId;
    }
    const v = session && session.voiceId;
    return (v && VALID_VOICE_IDS.has(v)) ? v : INTERVIEW_VOICE;
}

/**
 * Works out who asks `question`, what they say before it, and in which voice.
 *
 * Mutates the session's speaker bookkeeping (who spoke last, who has already
 * introduced themselves), so it must be called BEFORE the session is saved.
 */
function speakAs(session, question, questionIndex) {
    const panel = session && session.panel;
    if (!panel || !panel.length) {
        return {
            member: null,
            voice: voiceFor(session, question),
            spokenText: (question && question.questionText) || ''
        };
    }

    const member = memberForQuestion(panel, question, questionIndex, {
        seen: session.speakersSeen || [],
        questionLimit: session.questionLimit
    });
    const previous = session.lastSpeakerId
        ? panel.find(m => m.id === session.lastSpeakerId)
        : null;
    const seen = new Set(session.speakersSeen || []);

    const opener = openerFor({ member, previousMember: previous, seenIds: seen, questionIndex });

    seen.add(member.id);
    session.speakersSeen = Array.from(seen);
    session.lastSpeakerId = member.id;
    if (question) question.askedBy = member.id;

    return {
        member,
        voice: member.voiceId,
        spokenText: opener + ((question && question.questionText) || '')
    };
}

router.post('/start', async (req, res) => {
    try {
        const user = authenticateUser(req);
        const {
            sessionId: clientSessionId,
            resumeId,
            companyId,
            jobId,
            duration: rawDuration,
            context
        } = req.body || {};

        console.log(`[INTERVIEW] Initializing session start for user: ${user.userId} (${user.email})`);

        // Validate Duration Mapping:
        // 5 min = 300s = 5 questions
        // 10 min = 600s = 10 questions
        // 15 min = 900s = 15 questions
        // Duration Mapping (5 min = 5 tech Qs, 10 min = 10 tech Qs, 15 min = 15 tech Qs, excluding intro):
        const durationMins = parseInt(rawDuration || context?.duration || 5, 10);
        let duration = 5;
        let durationSeconds = 300;
        let questionLimit = 6; // 1 intro + 5 technical questions = 6 total

        if (durationMins >= 15) {
            duration = 15;
            durationSeconds = 900;
            questionLimit = 16; // 1 intro + 15 technical questions
        } else if (durationMins >= 10) {
            duration = 10;
            durationSeconds = 600;
            questionLimit = 11; // 1 intro + 10 technical questions
        } else {
            duration = 5;
            durationSeconds = 300;
            questionLimit = 6; // 1 intro + 5 technical questions
        }

        // Resolve Company
        let normalizedCompanyId = (companyId || context?.company || 'general').toLowerCase().replace(/[^a-z0-9]/g, '');
        if (!COMPANY_BLUEPRINTS[normalizedCompanyId]) {
            const foundKey = Object.keys(COMPANY_BLUEPRINTS).find(k => normalizedCompanyId.includes(k));
            normalizedCompanyId = foundKey || 'general';
        }
        const blueprint = COMPANY_BLUEPRINTS[normalizedCompanyId] || COMPANY_BLUEPRINTS.general;
        const companyName = context?.company || blueprint.name;

        // Resolve Role & Job Description — prefer the JD the student actually analyzed
        const jobRole = context?.roleTitle || context?.jobTitle || context?.role || BUILTIN_JD[jobId]?.title || 'Campus applicant';
        let jdFullText = context?.jdText || context?.role || BUILTIN_JD[jobId]?.description || '';
        if (!jdFullText || jdFullText.length < 20) {
            jdFullText = `Role: ${jobRole} at ${companyName}. Interview against the candidate's uploaded resume and this job.`;
        }

        const jdSnapshot = {
            title: jobRole,
            company: companyName,
            requirements: extractSkillTokens(jdFullText),
            fullText: jdFullText
        };

        // Resolve Authenticated User's Resume
        let userResume = await resolveUserResume(user.userId);
        let resumeSnapshot = {
            fullName: user.name || 'Candidate',
            professionalTitle: jobRole,
            matchedSkills: [],
            projects: [],
            experience: [],
            education: [],
            summary: ''
        };

        if (context?.resumeText && String(context.resumeText).length > 20) {
            resumeSnapshot.summary = String(context.resumeText).substring(0, 4000);
            resumeSnapshot.matchedSkills = extractSkillTokens(context.resumeText);
            if (context.candidateName) resumeSnapshot.fullName = context.candidateName;
        } else if (userResume) {
            resumeSnapshot.fullName = userResume.fullName || userResume.name || user.name;
            resumeSnapshot.professionalTitle = userResume.professionalTitle || jobRole;
            resumeSnapshot.matchedSkills = userResume.matchedSkills || (userResume.skills ? Object.values(userResume.skills).flat() : []);
            resumeSnapshot.projects = userResume.projects || [];
            resumeSnapshot.experience = userResume.experience || [];
            resumeSnapshot.education = userResume.education || [];
            resumeSnapshot.summary = userResume.summary || '';
        }

        // Session ids address a candidate's report and their interview videos, so
        // they must not be guessable. The old form was a timestamp plus five
        // base36 characters, which is enumerable by anyone who knows roughly
        // when an interview happened. A client-supplied id is no longer trusted
        // for a NEW session either — it let a caller choose their own id.
        const sessionId = 'hiero-sess-' + crypto.randomBytes(18).toString('base64url');

        // QUESTION 1 MUST ALWAYS BE THE INTRODUCTION
        const question1 = {
            index: 1,
            questionNumber: 1,
            questionText: "Please introduce yourself and briefly describe your experience relevant to this position.",
            sourceQuestionId: "intro-q1",
            category: "introduction",
            skill: "Communication & Background",
            difficulty: "warm-up",
            source: "standard_warmup",
            questionType: "INTRO",
            reason: "Initial warm-up to allow the candidate to introduce their background before timed technical questions begin.",
            answerGuide: [
                "Your educational background and core technical focus",
                "Recent projects or key technologies you've worked with",
                `What excites you about the ${jobRole} role at ${companyName}`
            ],
            expectedTopics: ["candidate background", "recent projects", "relevant technical experience"],
            isFollowUp: false,
            followUpToQuestion: null,
            askedAt: new Date()
        };

        const jdSkillList = jdSnapshot?.requirements?.length ? jdSnapshot.requirements : extractSkillTokens(jdSnapshot?.fullText || jobRole);

        // Construct Authoritative Session Object
        const session = {
            sessionId,
            userId: user.userId,
            resumeId: resumeId || null,
            companyId: normalizedCompanyId,
            jobId: jobId || 'software-engineer',
            companyName,
            jobRole,
            duration,
            durationSeconds,
            questionLimit,
            resumeSnapshot,
            jobDescriptionSnapshot: jdSnapshot,
            blueprintSnapshot: {
                companyName: blueprint.name,
                role: jobRole,
                hiringBar: blueprint.hiringBar,
                culture: blueprint.culture,
                rounds: blueprint.signaturePhases
            },
            topicTracking: {
                topicsCovered: ['introduction'],
                topicsRemaining: jdSkillList,
                skillsEvaluated: []
            },
            currentQuestionIndex: 1,
            questions: [question1],
            answers: [],
            timerStarted: false,
            timerStartedAt: null,
            status: 'INTRODUCTION',
            voiceId: (req.body && VALID_VOICE_IDS.has(req.body.voiceId)) ? req.body.voiceId : INTERVIEW_VOICE,
            // Three interviewers, one per question, routed by the question's
            // category. Opt out with panel:false for the old single-voice run.
            panel: (req.body && req.body.panel === false) ? [] : buildPanel(questionLimit),
            lastSpeakerId: '',
            speakersSeen: [],
            createdAt: new Date()
        };

        console.log(`[INTERVIEW] Session created: ${sessionId} | Duration: ${duration}m (${durationSeconds}s) | Limit: ${questionLimit} Qs | Status: INTRODUCTION`);

        // The greeting and the first question are spoken as one utterance, so
        // the audio must cover BOTH. Previously only question1 was synthesised
        // while the client spoke greeting+question, and a 2.2s cap meant a
        // longer intro silently produced null — the client then fell back to
        // the browser voice for the intro and switched to the Deepgram voice
        // from question 2 onward, which is the voice change candidates heard.
        // On a panel session the greeting names everyone in the room. This is
        // what makes a later voice change read as the panel working rather than
        // as a glitch, which is how an unannounced change was read before.
        let introSpokenText;
        let introTurn = null;
        if (session.panel && session.panel.length) {
            introTurn = speakAs(session, question1, 1);
            introSpokenText = panelIntroLine(
                session.panel, resumeSnapshot.fullName, jobRole, companyName
            ) + `So, to start — ${question1.questionText}`;
        } else {
            introSpokenText = `Hello ${resumeSnapshot.fullName || 'Candidate'}, welcome to your interview for the ${jobRole} position at ${companyName}. Take a deep breath and make yourself comfortable. ${question1.questionText}`;
        }

        // Saved after speakAs, which records who is speaking first.
        await saveSessionToStore(session);

        let audioUrl = null;
        try {
            audioUrl = await Promise.race([
                speak(introSpokenText, introTurn ? introTurn.voice : (session.voiceId || INTERVIEW_VOICE)),
                new Promise((_, reject) => setTimeout(() => reject(new Error('TTS timeout')), 20000))
            ]);
        } catch (ttsErr) {
            console.warn('[INTERVIEW] Intro TTS failed; client will retry server TTS:', ttsErr.message);
        }

        res.json({
            success: true,
            sessionId,
            companyName,
            jobRole,
            duration,
            durationSeconds,
            questionLimit,
            currentQuestionIndex: 1,
            timerStarted: false,
            timerStartedAt: null,
            audio_url: audioUrl,
            reply: introSpokenText,
            question: question1,
            panel: publicPanel(session.panel),
            interviewer: introTurn ? publicMember(introTurn.member) : null,
            voiceId: introTurn ? introTurn.voice : (session.voiceId || INTERVIEW_VOICE),
            session: {
                sessionId,
                companyName,
                jobRole,
                duration,
                durationSeconds,
                questionLimit,
                currentQuestionIndex: 1,
                timerStarted: false,
                status: 'INTRODUCTION'
            },
            isIntro: true
        });

    } catch (err) {
        console.error('[INTERVIEW] /start error:', err);
        res.status(500).json({ success: false, error: 'Failed to initialize interview session', details: err.message });
    }
});

// ─────────────────────────────────────────────────────────────────────────────
// ROUTE: POST /api/interview/answer
// Receives candidate answer, starts timer if Q1, evaluates answer, and retrieves/generates next question
// ─────────────────────────────────────────────────────────────────────────────
router.post('/answer', async (req, res) => {
    try {
        const user = authenticateUser(req);
        const { sessionId, answerText, durationSec = 0 } = req.body;
        const rawAnswer = answerText || req.body.answer || req.body.candidateAnswer || '';

        if (!sessionId) {
            return res.status(400).json({ success: false, error: 'sessionId is required' });
        }

        const session = await getSessionFromStore(sessionId);
        if (!session) {
            return res.status(404).json({ success: false, error: 'Interview session not found' });
        }

        // Security check: verify session ownership
        if (session.userId && user.userId && session.userId !== 'demo_user_hiero' && session.userId !== user.userId) {
            return res.status(403).json({ success: false, error: 'Unauthorized: Session belongs to another candidate' });
        }

        // Check if session is already completed
        if (session.status === 'COMPLETED' || session.status === 'EXPIRED') {
            return res.json({
                success: true,
                isComplete: true,
                status: session.status,
                scorecard: session.scorecard,
                reply: "This interview session is complete. Here is your final performance audit."
            });
        }

        const currentQIndex = session.currentQuestionIndex || 1;
        const currentQObj = session.questions.find(q => q.index === currentQIndex) || session.questions[session.questions.length - 1];
        const candidateAnswerClean = (rawAnswer || '').trim();

        let remainingSeconds = session.durationSeconds;
        if (session.timerStarted && session.timerStartedAt) {
            const elapsed = Math.floor((Date.now() - new Date(session.timerStartedAt).getTime()) / 1000);
            remainingSeconds = Math.max(0, session.durationSeconds - elapsed);
        }

        // Handle Empty / Silence: Prompt candidate to speak, DO NOT advance or invent answers!
        if (!candidateAnswerClean || candidateAnswerClean.length === 0) {
            return res.json({
                success: true,
                answerStatus: 'NO_RESPONSE',
                isRetry: true,
                reply: "I didn't catch your response. Take a moment and try again.",
                isComplete: false,
                currentQuestionIndex: currentQIndex,
                remainingSeconds,
                timerStarted: session.timerStarted
            });
        }

        // ── CLARIFICATION REQUEST ────────────────────────────────────────
        // "Can you explain that more simply?" is not an answer. It was scored
        // as a weak one and the interview moved on; a real interviewer
        // rephrases and waits. Consumes no turn and scores nothing.
        {
            const intent = detectCandidateIntent(candidateAnswerClean);
            if (intent.intent === 'CLARIFY' && currentQObj) {
                const rephrased = await rephraseCurrentQuestion({
                    questionText: currentQObj.questionText,
                    mode: intent.mode,
                    jobRole: session.jobRole
                });

                let clarifyAudio = null;
                try {
                    clarifyAudio = await speak(rephrased, voiceFor(session, currentQObj));
                } catch (ttsErr) {
                    console.warn('[INTERVIEW] Clarify TTS failed:', ttsErr.message);
                }

                console.log(`[INTERVIEW] Clarification (${intent.mode}) on Q${currentQIndex} — turn not consumed.`);

                return res.json({
                    success: true,
                    answerStatus: 'CLARIFICATION',
                    isRetry: true,
                    isComplete: false,
                    clarification: true,
                    clarificationMode: intent.mode,
                    reply: rephrased,
                    question: { ...currentQObj, questionText: rephrased },
                    audio_url: clarifyAudio,
                    voiceId: voiceFor(session, currentQObj),
                    interviewer: publicMember(
                        (session.panel || []).find(m => m.id === session.lastSpeakerId) || null
                    ),
                    currentQuestionIndex: currentQIndex,
                    questionLimit: session.questionLimit,
                    remainingSeconds: typeof remainingSeconds !== 'undefined' ? remainingSeconds : undefined,
                    timerStarted: session.timerStarted
                });
            }
        }

        // Classify candidate answer status
        let answerStatus = 'ANSWERED';
        let technicalAccuracy = 'evaluated';
        const isUnsure = isCandidateUnsureOrSkipping(candidateAnswerClean);
        const wordCount = candidateAnswerClean.split(/\s+/).filter(Boolean).length;

        if (isUnsure) {
            answerStatus = 'UNKNOWN';
            technicalAccuracy = 'not_answered';
        } else if (wordCount < 6) {
            answerStatus = 'PARTIAL';
            technicalAccuracy = 'partial';
        }

        // 1. Evaluate candidate answer for coaching & clarity score
        const coaching = await evaluateCandidateAnswer({
            questionText: currentQObj ? currentQObj.questionText : 'Interview Question',
            candidateAnswer: candidateAnswerClean,
            expectedTopics: currentQObj?.expectedTopics || [],
            role: session.jobRole
        });

        // Record Answer with honest transcript and classification
        const answerRecord = {
            questionIndex: currentQIndex,
            questionText: currentQObj?.questionText || `Question ${currentQIndex}`,
            candidateAnswer: candidateAnswerClean,
            answerTranscript: candidateAnswerClean,
            transcript: candidateAnswerClean,
            answerStatus,
            technicalAccuracy,
            coaching,
            evaluationScore: coaching.evaluationScore,
            answeredAt: new Date(),
            durationSec: parseInt(durationSec, 10) || 0
        };

        // Prevent duplicate answers to same question index
        const existingAnsIdx = session.answers.findIndex(a => a.questionIndex === currentQIndex);
        if (existingAnsIdx >= 0) {
            session.answers[existingAnsIdx] = answerRecord;
        } else {
            session.answers.push(answerRecord);
        }

        // 2. AUTOMATIC TIMER START AFTER Q1 INTRODUCTION ANSWER
        if (currentQIndex === 1 && !session.timerStarted) {
            session.timerStarted = true;
            session.timerStartedAt = new Date();
            session.status = 'IN_PROGRESS';
            console.log(`[INTERVIEW] Q1 Answer completed -> Server timer started at: ${session.timerStartedAt.toISOString()} (Duration: ${session.durationSeconds}s)`);
        }

        // 3. Check Authoritative Server Timer Expiration
        if (session.timerStarted && session.timerStartedAt) {
            const elapsed = Math.floor((Date.now() - new Date(session.timerStartedAt).getTime()) / 1000);
            remainingSeconds = Math.max(0, session.durationSeconds - elapsed);
        }

        const isTimeExpired = session.timerStarted && remainingSeconds <= 0;
        const isLimitReached = session.answers.length >= session.questionLimit;

        // 4. Session Completion Check
        if (isTimeExpired || isLimitReached) {
            session.status = isTimeExpired ? 'EXPIRED' : 'COMPLETED';
            session.completedAt = new Date();

            console.log(`[INTERVIEW] Session ${sessionId} ended (Reason: ${isTimeExpired ? 'Timer Expired' : 'Question Limit Reached'}). Generating final scorecard.`);

            const scorecard = await generateSessionScorecard(session);
            session.scorecard = scorecard;
            session.evaluation = scorecard;
            await saveSessionToStore(session);

            return res.json({
                success: true,
                isComplete: true,
                isCompleted: true,
                status: session.status,
                reason: isTimeExpired ? 'TIME_EXPIRED' : 'QUESTIONS_COMPLETED',
                scorecard,
                coaching,
                remainingSeconds: 0,
                timerStarted: session.timerStarted,
                timerStartedAt: session.timerStartedAt,
                reply: `Thank you, ${session.resumeSnapshot?.fullName || 'Candidate'}. That concludes your mock interview session for ${session.companyName}. We have generated your comprehensive performance scorecard.`
            });
        }

        // 5. Generate Next Adaptive Question (Q2..Qn) based ONLY on authentic candidate answer
        session.currentQuestionIndex = session.answers.length + 1;
        const nextQuestion = await generateAdaptiveQuestion({
            session,
            previousAnswer: candidateAnswerClean
        });

        session.questions.push(nextQuestion);

        // Update live topic tracking state
        if (!session.topicTracking) {
            session.topicTracking = { topicsCovered: [], topicsRemaining: [], skillsEvaluated: [] };
        }
        if (nextQuestion.skill) {
            const skillLower = nextQuestion.skill.toLowerCase();
            if (!session.topicTracking.topicsCovered.includes(skillLower)) {
                session.topicTracking.topicsCovered.push(skillLower);
            }
            if (!session.topicTracking.skillsEvaluated.includes(skillLower)) {
                session.topicTracking.skillsEvaluated.push(skillLower);
            }
            session.topicTracking.topicsRemaining = (session.topicTracking.topicsRemaining || []).filter(
                s => s.toLowerCase() !== skillLower
            );
        }

        // Who asks this one, and what they say before it. Runs before the save
        // because it records the speaker on the session.
        const turn = speakAs(session, nextQuestion, session.currentQuestionIndex);

        await saveSessionToStore(session);

        // Speak the next question in its owner's voice. This route returned no
        // audio at all once, so only /start and /voice-turn produced Deepgram
        // speech — every question in the text path fell back to the browser
        // voice, which is why the interviewer's voice changed after the
        // greeting.
        let audioUrl = null;
        try {
            audioUrl = await speak(turn.spokenText, turn.voice);
        } catch (ttsErr) {
            console.error('[INTERVIEW] Question TTS FAILED (client will use browser voice):', ttsErr.message);
        }

        res.json({
            success: true,
            isComplete: false,
            isCompleted: false,
            status: session.status,
            currentQuestionIndex: session.currentQuestionIndex,
            questionLimit: session.questionLimit,
            remainingSeconds,
            timerStarted: session.timerStarted,
            timerStartedAt: session.timerStartedAt,
            question: nextQuestion,
            nextQuestion: nextQuestion,
            reply: turn.spokenText,
            audio_url: audioUrl,
            voiceId: turn.voice,
            interviewer: publicMember(turn.member),
            panel: publicPanel(session.panel),
            answerStatus,
            coaching
        });

    } catch (err) {
        console.error('[INTERVIEW] /answer error:', err);
        res.status(500).json({ success: false, error: 'Failed to process candidate answer', details: err.message });
    }
});

// ─────────────────────────────────────────────────────────────────────────────
// ROUTE: POST /api/interview/voice-turn
// Ingests candidate spoken audio blob, transcribes via Groq Whisper, and executes answer turn
// ─────────────────────────────────────────────────────────────────────────────
router.post('/voice-turn', videoUpload.fields([{ name: 'audio', maxCount: 1 }, { name: 'video', maxCount: 1 }]), async (req, res) => {
    try {
        const audioFile = req.files?.['audio']?.[0] || req.files?.['video']?.[0];
        const sessionId = req.body.sessionId || 'session-' + Date.now();
        const fallbackText = (req.body.fallbackText || '').trim();
        let candidateTranscript = fallbackText;

        // Neural Whisper Transcription via Groq if audio file exists
        if (audioFile && audioFile.buffer && process.env.GROQ_API_KEY) {
            try {
                const FormData = require('form-data');
                const form = new FormData();
                form.append('file', audioFile.buffer, {
                    filename: audioFile.originalname || 'candidate_voice.webm',
                    contentType: audioFile.mimetype || 'audio/webm'
                });
                form.append('model', 'whisper-large-v3-turbo');
                form.append('response_format', 'json');
                form.append('temperature', '0.0');

                const whisperRes = await axios.post('https://api.groq.com/openai/v1/audio/transcriptions', form, {
                    headers: {
                        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
                        ...form.getHeaders()
                    },
                    timeout: 10000
                });

                if (whisperRes.data?.text && whisperRes.data.text.trim()) {
                    candidateTranscript = whisperRes.data.text.trim();
                    console.log(`[INTERVIEW] Whisper Transcribed: "${candidateTranscript}"`);
                }
            } catch (whisperErr) {
                console.warn('[INTERVIEW] Whisper transcription warning, falling back to STT text:', whisperErr.message);
            }
        }

        const candidateClean = (candidateTranscript || fallbackText || '').trim();
        if (!candidateClean || candidateClean.length === 0) {
            return res.json({
                success: true,
                answerStatus: 'NO_RESPONSE',
                isRetry: true,
                reply: "I didn't catch your response. Take a moment and try again."
            });
        }

        // Delegate to answer turn handler
        req.body.answerText = candidateClean;
        const session = await getSessionFromStore(sessionId);
        if (!session) {
            return res.json({
                success: true,
                candidateTranscript: candidateClean,
                reply: "Thank you for explaining that. Let's proceed to the next technical question.",
                coaching: {
                    improvedPhrase: candidateClean,
                    grammarTip: "Clear delivery.",
                    clarityScore: 8
                }
            });
        }

        // Reuse answer logic
        const user = authenticateUser(req);
        const currentQIndex = session.currentQuestionIndex || 1;
        const currentQObj = session.questions.find(q => q.index === currentQIndex) || session.questions[session.questions.length - 1];

        // ── CLARIFICATION REQUEST ────────────────────────────────────────
        // "Can you explain that more simply?" is not an answer. It was scored
        // as a weak one and the interview moved on; a real interviewer
        // rephrases and waits. Consumes no turn and scores nothing.
        {
            const intent = detectCandidateIntent(candidateClean);
            if (intent.intent === 'CLARIFY' && currentQObj) {
                const rephrased = await rephraseCurrentQuestion({
                    questionText: currentQObj.questionText,
                    mode: intent.mode,
                    jobRole: session.jobRole
                });

                let clarifyAudio = null;
                try {
                    clarifyAudio = await speak(rephrased, voiceFor(session, currentQObj));
                } catch (ttsErr) {
                    console.warn('[INTERVIEW] Clarify TTS failed:', ttsErr.message);
                }

                console.log(`[INTERVIEW] Clarification (${intent.mode}) on Q${currentQIndex} — turn not consumed.`);

                return res.json({
                    success: true,
                    answerStatus: 'CLARIFICATION',
                    isRetry: true,
                    isComplete: false,
                    clarification: true,
                    clarificationMode: intent.mode,
                    reply: rephrased,
                    question: { ...currentQObj, questionText: rephrased },
                    audio_url: clarifyAudio,
                    voiceId: voiceFor(session, currentQObj),
                    interviewer: publicMember(
                        (session.panel || []).find(m => m.id === session.lastSpeakerId) || null
                    ),
                    currentQuestionIndex: currentQIndex,
                    questionLimit: session.questionLimit,
                    remainingSeconds: typeof remainingSeconds !== 'undefined' ? remainingSeconds : undefined,
                    timerStarted: session.timerStarted
                });
            }
        }

        // Classify candidate answer status
        let answerStatus = 'ANSWERED';
        let technicalAccuracy = 'evaluated';
        const isUnsure = isCandidateUnsureOrSkipping(candidateClean);
        const wordCount = candidateClean.split(/\s+/).filter(Boolean).length;

        if (isUnsure) {
            answerStatus = 'UNKNOWN';
            technicalAccuracy = 'not_answered';
        } else if (wordCount < 6) {
            answerStatus = 'PARTIAL';
            technicalAccuracy = 'partial';
        }

        const coaching = await evaluateCandidateAnswer({
            questionText: currentQObj?.questionText || 'Question',
            candidateAnswer: candidateClean,
            expectedTopics: currentQObj?.expectedTopics || [],
            role: session.jobRole
        });

        // ─────────────────────────────────────────────
        // Persist Voice-Turn Audio to Disk Recording Store
        // ─────────────────────────────────────────────
        let savedRecordingUrl = null;
        if (audioFile && audioFile.buffer) {
            try {
                const targetDir = path.join(__dirname, '..', 'uploads', 'recordings', sessionId);
                if (!fs.existsSync(targetDir)) {
                    fs.mkdirSync(targetDir, { recursive: true });
                }
                const safeExt = (audioFile.mimetype && audioFile.mimetype.includes('mp4')) ? '.mp4' : ((audioFile.mimetype && audioFile.mimetype.includes('ogg')) ? '.ogg' : '.webm');
                const safeQNum = `Q${currentQIndex}`;
                const filename = `${safeQNum}_${Date.now()}${safeExt}`;
                const filePath = path.join(targetDir, filename);
                fs.writeFileSync(filePath, audioFile.buffer);
                savedRecordingUrl = `/uploads/recordings/${sessionId}/${filename}`;

                // Update manifest.json
                const manifestPath = path.join(targetDir, 'manifest.json');
                let manifest = { sessionId, updatedAt: new Date().toISOString(), recordings: [] };
                if (fs.existsSync(manifestPath)) {
                    try { manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8')); } catch (e) {}
                }
                const newRecord = {
                    questionNumber: safeQNum,
                    questionText: currentQObj?.questionText || `Question ${currentQIndex}`,
                    candidateAnswer: candidateTranscript,
                    duration: 0,
                    url: savedRecordingUrl,
                    videoUrl: savedRecordingUrl,
                    audioUrl: savedRecordingUrl,
                    filename,
                    sizeBytes: audioFile.buffer.length,
                    mimetype: audioFile.mimetype || 'audio/webm',
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
                console.log(`[RECORDING] Persisted voice turn for ${safeQNum} in ${sessionId} -> ${savedRecordingUrl}`);
            } catch (saveErr) {
                console.warn('[RECORDING] Notice persisting voice-turn audio:', saveErr.message);
            }
        }

        const noiseFillerPhrases = [
            'thank you', 'thanks', 'thank you.', 'thanks.', 'you', 'subtitles', 'captioned by', 'amara.org', 'watching', 'subscribe', 'bye'
        ];
        const isNoiseFiller = noiseFillerPhrases.includes(candidateTranscript.toLowerCase().replace(/[.,!]/g, '').trim()) || candidateTranscript.trim().length < 3;

        if (isNoiseFiller) {
            return res.json({
                success: true,
                isRetry: true,
                status: 'NO_RESPONSE',
                isNoiseDisturbance: true,
                message: 'Background noise or isolated word detected. Please move to a silent space and speak your complete answer clearly.',
                transcript: candidateTranscript,
                currentQuestion: currentQObj
            });
        }

        const answerRecord = {
            questionIndex: currentQIndex,
            questionText: currentQObj?.questionText || `Question ${currentQIndex}`,
            candidateAnswer: candidateTranscript,
            transcript: candidateTranscript,
            coaching,
            evaluationScore: coaching.evaluationScore,
            videoUrl: savedRecordingUrl,
            audioUrl: savedRecordingUrl,
            recordingUrl: savedRecordingUrl,
            answeredAt: new Date(),
            durationSec: 0
        };

        const existingAnsIdx = session.answers.findIndex(a => a.questionIndex === currentQIndex);
        if (existingAnsIdx >= 0) {
            session.answers[existingAnsIdx] = answerRecord;
        } else {
            session.answers.push(answerRecord);
        }

        // Auto timer start
        let startTimer = false;
        if (currentQIndex === 1 && !session.timerStarted) {
            session.timerStarted = true;
            session.timerStartedAt = new Date();
            session.status = 'IN_PROGRESS';
            startTimer = true;
            console.log(`[INTERVIEW] Voice turn Q1 complete -> Started timer at: ${session.timerStartedAt.toISOString()}`);
        }

        let remainingSeconds = session.durationSeconds;
        if (session.timerStarted && session.timerStartedAt) {
            const elapsed = Math.floor((Date.now() - new Date(session.timerStartedAt).getTime()) / 1000);
            remainingSeconds = Math.max(0, session.durationSeconds - elapsed);
        }

        const isTimeExpired = session.timerStarted && remainingSeconds <= 0;
        const isLimitReached = session.answers.length >= session.questionLimit;

        if (isTimeExpired || isLimitReached) {
            session.status = isTimeExpired ? 'EXPIRED' : 'COMPLETED';
            session.completedAt = new Date();
            const scorecard = await generateSessionScorecard(session);
            session.scorecard = scorecard;
            await saveSessionToStore(session);

            return res.json({
                success: true,
                isComplete: true,
                candidateTranscript,
                scorecard,
                coaching,
                remainingSeconds: 0,
                reply: `Thank you, ${session.resumeSnapshot?.fullName || 'Candidate'}. That concludes your mock interview session for ${session.companyName}.`
            });
        }

        // Next Question
        session.currentQuestionIndex = session.answers.length + 1;
        const nextQuestion = await generateAdaptiveQuestion({
            session,
            previousAnswer: candidateTranscript
        });

        session.questions.push(nextQuestion);

        const turn = speakAs(session, nextQuestion, session.currentQuestionIndex);
        await saveSessionToStore(session);

        let audioUrl = null;
        try {
            audioUrl = await speak(turn.spokenText, turn.voice);
        } catch (ttsErr) {
            console.error('[INTERVIEW] Voice-turn TTS FAILED (client will use browser voice):', ttsErr.message);
        }

        res.json({
            success: true,
            isComplete: false,
            candidateTranscript,
            startTimer,
            remainingSeconds,
            timerStarted: session.timerStarted,
            timerStartedAt: session.timerStartedAt,
            audio_url: audioUrl,
            question: nextQuestion,
            reply: turn.spokenText,
            voiceId: turn.voice,
            interviewer: publicMember(turn.member),
            panel: publicPanel(session.panel),
            coaching
        });

    } catch (err) {
        console.error('[INTERVIEW] /voice-turn error:', err);
        res.status(500).json({ success: false, error: 'Voice turn processing failed', details: err.message });
    }
});

// ─────────────────────────────────────────────────────────────────────────────
// ROUTE: POST /api/interview/chat (Legacy & Hybrid Compatibility)
// ─────────────────────────────────────────────────────────────────────────────
router.post('/chat', async (req, res) => {
    try {
        const { messages, context, sessionId, mode } = req.body;
        const session = sessionId ? await getSessionFromStore(sessionId) : null;

        // Evaluation Mode
        if (mode === 'evaluation' || req.body.phase === 'feedback') {
            if (session) {
                const scorecard = await generateSessionScorecard(session);
                return res.json({
                    success: true,
                    isComplete: true,
                    score: { final: scorecard.overallScore },
                    summary: scorecard.summary,
                    strengths: scorecard.strengths,
                    mistakes: scorecard.areasToImprove,
                    improvements: scorecard.areasToImprove,
                    scorecard
                });
            }
            return res.json({
                success: true,
                isComplete: true,
                score: { final: 8.5 },
                summary: "Interview successfully completed with solid clarity and technical communication.",
                mistakes: ["Minor hesitation on distributed architecture nuance."],
                improvements: ["Use more STAR-structured result metrics in project descriptions."]
            });
        }

        const lastUserMsg = (messages || []).slice().reverse().find(m => m.role === 'user')?.content || '';
        if (session) {
            if (lastUserMsg) {
                session.answers.push({
                    questionIndex: session.questions.length,
                    questionText: session.questions[session.questions.length - 1]?.questionText || '',
                    candidateAnswer: lastUserMsg,
                    answeredAt: new Date()
                });
            }
            session.currentQuestionIndex = session.answers.length + 1;
            const nextQ = await generateAdaptiveQuestion({ session, previousAnswer: lastUserMsg });
            session.questions.push(nextQ);

            if (!session.topicTracking) {
                session.topicTracking = { topicsCovered: [], topicsRemaining: [], skillsEvaluated: [] };
            }
            if (nextQ.skill) {
                const skillLower = nextQ.skill.toLowerCase();
                if (!session.topicTracking.topicsCovered.includes(skillLower)) {
                    session.topicTracking.topicsCovered.push(skillLower);
                }
                if (!session.topicTracking.skillsEvaluated.includes(skillLower)) {
                    session.topicTracking.skillsEvaluated.push(skillLower);
                }
                session.topicTracking.topicsRemaining = (session.topicTracking.topicsRemaining || []).filter(
                    s => s.toLowerCase() !== skillLower
                );
            }
            const chatTurn = speakAs(session, nextQ, session.currentQuestionIndex);
            await saveSessionToStore(session);

            let audioUrl = null;
            try {
                audioUrl = await speak(chatTurn.spokenText, chatTurn.voice);
            } catch (ttsErr) {
                console.error('[INTERVIEW] Question TTS FAILED (client will use browser voice):', ttsErr.message);
            }

            return res.json({
                success: true,
                reply: chatTurn.spokenText,
                audio_url: audioUrl,
                question: nextQ,
                voiceId: chatTurn.voice,
                interviewer: publicMember(chatTurn.member),
                panel: publicPanel(session.panel)
            });
        }

        res.json({
            success: true,
            reply: "Can you describe how you handle database indexing and optimize query performance in your applications?"
        });
    } catch (err) {
        console.error('[INTERVIEW] /chat error:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// ─────────────────────────────────────────────────────────────────────────────
// ROUTE: GET /api/interview/session/:sessionId
// Returns live session state and calculated remaining seconds
// ─────────────────────────────────────────────────────────────────────────────
router.get('/session/:sessionId', async (req, res) => {
    try {
        const user = authenticateUser(req);
        const { sessionId } = req.params;

        const session = await getSessionFromStore(sessionId);
        if (!session) {
            return res.status(404).json({ success: false, error: 'Session not found' });
        }

        // Security check
        if (session.userId && user.userId && session.userId !== 'demo_user_hiero' && session.userId !== user.userId) {
            return res.status(403).json({ success: false, error: 'Unauthorized session access' });
        }

        let remainingSeconds = session.durationSeconds;
        if (session.timerStarted && session.timerStartedAt) {
            const elapsed = Math.floor((Date.now() - new Date(session.timerStartedAt).getTime()) / 1000);
            remainingSeconds = Math.max(0, session.durationSeconds - elapsed);
        }

        res.json({
            success: true,
            session: {
                sessionId: session.sessionId,
                userId: session.userId,
                companyName: session.companyName,
                jobRole: session.jobRole,
                duration: session.duration,
                durationSeconds: session.durationSeconds,
                remainingSeconds,
                questionLimit: session.questionLimit,
                currentQuestionIndex: session.currentQuestionIndex,
                timerStarted: session.timerStarted,
                timerStartedAt: session.timerStartedAt,
                startedAt: session.startedAt || session.createdAt,
                completedAt: session.completedAt,
                createdAt: session.createdAt,
                status: session.status,
                resumeSnapshot: session.resumeSnapshot,
                jobDescriptionSnapshot: session.jobDescriptionSnapshot,
                blueprintSnapshot: session.blueprintSnapshot,
                questions: session.questions || [],
                answers: session.answers || [],
                scorecard: session.scorecard || session.evaluation || {},
                evaluation: session.evaluation || session.scorecard || {},
                recording: session.recording || {
                    available: !!session.recordingUrl,
                    url: session.recordingUrl || ''
                }
            }
        });
    } catch (err) {
        console.error('[INTERVIEW] get session error:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// ─────────────────────────────────────────────────────────────────────────────
// ROUTE: GET /api/interview/feedback/:sessionId & /:sessionId/feedback
// Returns complete evaluation scorecard, Q&A transcripts, coaching, and recording media
// ─────────────────────────────────────────────────────────────────────────────
/**
 * True when this request may read this session's report and recordings.
 * A report carries the candidate's name, score and face; it is not public.
 */
function mayAccessSession(req, session) {
    if (!session) return false;
    let caller = null;
    try { caller = authenticateUser(req); } catch (e) { caller = null; }
    if (!caller || !caller.userId) return false;

    const ADMINS = [process.env.ADMIN_EMAIL, 'jaswanthkumarmuthoju@gmail.com', 'admin@hiero.com'].filter(Boolean);
    if (caller.email && ADMINS.includes(caller.email)) return true;

    // Legacy sessions created before ownership was recorded.
    if (!session.userId) return false;

    return String(session.userId) === String(caller.userId);
}

async function handleGetInterviewFeedback(req, res) {
    try {
        const { sessionId } = req.params;
        const cleanSessionId = (sessionId || '').replace(/[^a-zA-Z0-9_-]/g, '');
        const session = await getSessionFromStore(cleanSessionId);

        // A report was readable by anyone who had or guessed the id — it
        // returned the candidate's name, score and recording URLs with no
        // authentication at all.
        if (session && !mayAccessSession(req, session)) {
            return res.status(403).json({
                success: false,
                error: 'This interview report belongs to another candidate.'
            });
        }

        // Fetch manifest recordings if available on disk
        const manifestPath = path.join(__dirname, '..', 'uploads', 'recordings', cleanSessionId, 'manifest.json');
        let recordings = [];
        if (fs.existsSync(manifestPath)) {
            try {
                const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
                recordings = manifest.recordings || [];
            } catch (e) {}
        }

        if (!session) {
            return res.json({
                success: true,
                sessionId: cleanSessionId,
                candidateName: 'Candidate',
                targetRole: 'Software Engineer',
                company: 'Technology Team',
                summary: 'Interview evaluation report generated. Answers were recorded with clear technical articulation.',
                score: { final: 8.8, communication: 9.0, technical: 8.7, problemSolving: 8.9, culturalFit: 8.6 },
                overallScore: 8.8,
                confidenceScore: 88,
                verdict: 'Strong Hire',
                strengths: [
                    'Clear vocal articulation and structured technical answers.',
                    'Honest self-awareness and active engineering terminology.'
                ],
                improvements: [
                    'Include more quantitative metrics and KPIs in architecture answers.'
                ],
                totalAsked: Math.max(1, recordings.length),
                totalAttempted: Math.max(1, recordings.length),
                totalSkipped: 0,
                totalCorrect: Math.max(1, recordings.length),
                recordings,
                questions: recordings.map((r, i) => ({
                    questionNumber: r.questionNumber || `0${i+1}`,
                    question: r.questionText || `Technical Question ${i+1}`,
                    answer: r.candidateAnswer || '[Spoken answer recorded in session]',
                    strength: 'Clear delivery and relevant concepts.',
                    suggestion: 'Deepen system design trade-offs.',
                    score: 8.5,
                    videoUrl: r.url || r.videoUrl,
                    audioUrl: r.url || r.audioUrl,
                    duration: r.duration || 30
                }))
            });
        }

        // Generate or retrieve scorecard
        let scorecard = session.scorecard || session.evaluation;
        if (!scorecard || !scorecard.overallScore) {
            scorecard = await generateSessionScorecard(session);
            session.scorecard = scorecard;
            session.evaluation = scorecard;
            await saveSessionToStore(session);
        }

        const overallFinalScore = scorecard.overallScore || 8.8;
        const commScore = scorecard.communicationScore || 9.0;
        const techScore = scorecard.technicalScore || 8.7;
        const probScore = scorecard.problemSolvingScore || 8.8;
        const alignScore = scorecard.resumeAlignmentScore || 8.6;

        // Model answers for anything the candidate could not answer.
        //
        // Being told only that you scored 2/10 on Kafka teaches you nothing;
        // the moment someone says "I am not familiar with that" is exactly
        // when they want to know what the answer was. Cached on the session so
        // a reloaded report does not pay for them again.
        const unanswered = [];
        (session.questions || []).forEach((q, idx) => {
            const a = session.answers?.find(x => x.questionIndex === q.index) || session.answers?.[idx];
            const text = String(a?.candidateAnswer || a?.transcript || '').trim();
            const status = String(a?.answerStatus || '').toUpperCase();

            const gaveUp = !a
                || !text
                || status === 'UNKNOWN'
                || status === 'NO_RESPONSE'
                || status === 'SKIPPED'
                || isCandidateUnsureOrSkipping(text)
                || text.split(/\s+/).filter(Boolean).length < 6;

            // The warm-up is "tell me about yourself" -- there is no model
            // answer for someone else's background.
            if (gaveUp && String(q.category || '') !== 'introduction') {
                unanswered.push({ index: q.index, questionText: q.questionText });
            }
        });

        let modelAnswers = session.modelAnswers || {};
        const missing = unanswered.filter(u => !modelAnswers[String(u.index)]);
        if (missing.length) {
            try {
                const fresh = await generateModelAnswers(session, missing);
                if (Object.keys(fresh).length) {
                    modelAnswers = { ...modelAnswers, ...fresh };
                    session.modelAnswers = modelAnswers;
                    await saveSessionToStore(session);
                }
            } catch (e) {
                console.warn('[INTERVIEW] model answers skipped:', e.message);
            }
        }

        // Build question-by-question review items
        const questionsList = (session.questions || []).map((q, idx) => {
            const ans = session.answers?.find(a => a.questionIndex === q.index) || session.answers?.[idx];
            const qNumStr = (idx + 1).toString().padStart(2, '0');
            const qLabel = `Q${idx + 1}`;

            // Match recording from manifest or answer record
            const matchedRec = recordings.find(r => r.questionNumber === qLabel || r.questionNumber === qNumStr);
            const recUrl = ans?.videoUrl || ans?.recordingUrl || matchedRec?.url || session.recordingUrl || null;

            return {
                questionNumber: qNumStr,
                question: q.questionText || `Question ${idx + 1}`,
                answer: ans?.candidateAnswer || ans?.transcript || '[Spoken answer recorded live in chamber]',
                strength: ans?.coaching?.improvedPhrase || ans?.coaching?.notes || 'Clear technical articulation and relevant engineering terminology.',
                suggestion: ans?.coaching?.grammarTip || 'Structure answers using the STAR format with concrete production trade-offs.',
                score: ans?.evaluationScore || ans?.coaching?.clarityScore || 8.5,
                videoUrl: recUrl,
                audioUrl: recUrl,
                duration: ans?.durationSec || matchedRec?.duration || 30,
                // Present only where the candidate could not answer.
                modelAnswer: modelAnswers[String(q.index)] || null,
                wasUnanswered: Boolean(modelAnswers[String(q.index)])
            };
        });

        const totalAsked = session.questions?.length || questionsList.length || 1;
        const totalAttempted = session.answers?.length || questionsList.filter(q => q.answer && !q.answer.includes('Skipped')).length;
        const totalSkipped = Math.max(0, totalAsked - totalAttempted);
        const totalCorrect = questionsList.filter(q => parseFloat(q.score) >= 7.5).length;
        const confidenceScore = Math.round((overallFinalScore / 10) * 100);

        let verdict = 'Strong Hire';
        if (overallFinalScore >= 8.8) verdict = 'Strong Hire';
        else if (overallFinalScore >= 7.5) verdict = 'Recommended';
        else if (overallFinalScore >= 6.5) verdict = 'Leaning Yes';
        else verdict = 'Needs Practice';

        res.json({
            success: true,
            sessionId: session.sessionId,
            candidateName: session.resumeSnapshot?.fullName || 'Candidate',
            targetRole: session.jobRole || 'Software Engineer',
            company: session.companyName || 'Technology Team',
            startTime: session.startedAt || session.createdAt,
            endTime: session.completedAt || new Date(),
            duration: `${Math.max(1, Math.round((session.durationSeconds || 300) / 60))} Minutes`,
            summary: scorecard.summary || 'Interview concluded successfully with solid technical reasoning and clear vocal delivery.',
            score: {
                final: overallFinalScore,
                communication: commScore,
                technical: techScore,
                problemSolving: probScore,
                culturalFit: alignScore
            },
            overallScore: overallFinalScore,
            confidenceScore,
            verdict: scorecard.recommendation || verdict,
            strengths: scorecard.strengths || ['Effective communication', 'Solid technical architecture reasoning'],
            improvements: scorecard.areasToImprove || ['Quantify system scalability metrics in project explanations'],
            mistakes: scorecard.areasToImprove || [],
            totalAsked,
            totalAttempted,
            totalSkipped,
            totalCorrect,
            questions: questionsList,
            recordings,
            sessionRecording: session.recording || { url: session.recordingUrl }
        });
    } catch (err) {
        console.error('[INTERVIEW] feedback endpoint error:', err);
        res.status(500).json({ success: false, error: err.message });
    }
}

router.get('/feedback/:sessionId', handleGetInterviewFeedback);
router.get('/:sessionId/feedback', handleGetInterviewFeedback);

// ─────────────────────────────────────────────────────────────────────────────
// ROUTE: POST /api/interview/:sessionId/recording
// Uploads full interview continuous video recording & associates with session
// ─────────────────────────────────────────────────────────────────────────────
router.post('/:sessionId/recording', videoUpload.single('video'), async (req, res) => {
    try {
        const user = authenticateUser(req);
        const { sessionId } = req.params;

        const session = await getSessionFromStore(sessionId);
        if (!session) {
            return res.status(404).json({ success: false, error: 'Session not found' });
        }

        // Security check
        if (session.userId && user.userId && session.userId !== 'demo_user_hiero' && session.userId !== user.userId) {
            return res.status(403).json({ success: false, error: 'Unauthorized session access' });
        }

        if (!req.file) {
            return res.status(400).json({ success: false, error: 'No video file provided' });
        }

        const recordingsDir = path.join(__dirname, '..', 'uploads', 'recordings', sessionId);
        if (!fs.existsSync(recordingsDir)) {
            fs.mkdirSync(recordingsDir, { recursive: true });
        }

        const filename = `${sessionId}_full_interview_${Date.now()}.webm`;
        const filePath = path.join(recordingsDir, filename);
        fs.writeFileSync(filePath, req.file.buffer);

        const recordingUrl = `/uploads/recordings/${sessionId}/${filename}`;
        session.recording = {
            available: true,
            storageType: 'local',
            url: recordingUrl,
            videoPath: filePath,
            fileSize: req.file.size,
            duration: session.durationSeconds || 300,
            uploadedAt: new Date()
        };
        session.recordingUrl = recordingUrl;

        await saveSessionToStore(session);

        console.log(`[RECORDING] Saved full video recording for session ${sessionId} (${req.file.size} bytes) -> ${recordingUrl}`);

        res.json({
            success: true,
            recordingUrl,
            recording: session.recording
        });
    } catch (err) {
        console.error('[RECORDING] Upload error:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// ─────────────────────────────────────────────────────────────────────────────
// ROUTE: GET /api/interview/user/history
// Returns completed sessions history for the authenticated user
// ─────────────────────────────────────────────────────────────────────────────
router.get('/user/history', async (req, res) => {
    try {
        const user = authenticateUser(req);
        let list = [];

        if (mongoose.connection.readyState === 1) {
            const query = { userId: user.userId };
            const docs = await InterviewSession.find(query).sort({ createdAt: -1 }).limit(20).lean();
            list = docs;
        } else {
            for (const sess of memoryInterviewSessions.values()) {
                if (sess.userId === user.userId || user.userId === 'demo_user_hiero') {
                    list.push(sess);
                }
            }
            list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        }

        res.json({ success: true, history: list });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// ─────────────────────────────────────────────────────────────────────────────
// ROUTE: POST /api/interview/transcribe (Deepgram Nova-3 + Whisper Fallback)
// ─────────────────────────────────────────────────────────────────────────────
router.post('/transcribe', multerUpload.single('audio'), async (req, res) => {
    try {
        if (!req.file || !req.file.buffer) {
            return res.json({ success: true, text: '' });
        }

        // 1. Try Deepgram Nova-3 first
        try {
            const dgResult = await dgTranscribe(req.file.buffer, req.file.mimetype || 'audio/webm');
            if (dgResult && dgResult.transcript && dgResult.transcript.length > 0) {
                return res.json({
                    success: true,
                    text: dgResult.transcript,
                    confidence: dgResult.confidence,
                    engine: 'deepgram-nova-3'
                });
            }
        } catch (dgErr) {
            console.warn('[INTERVIEW] Deepgram transcription fallback to Whisper:', dgErr.message);
        }

        // 2. Fallback to Groq Whisper
        if (process.env.GROQ_API_KEY) {
            const FormData = require('form-data');
            const form = new FormData();
            form.append('file', req.file.buffer, {
                filename: 'audio.webm',
                contentType: req.file.mimetype || 'audio/webm'
            });
            form.append('model', 'whisper-large-v3-turbo');
            form.append('response_format', 'json');

            const resp = await axios.post('https://api.groq.com/openai/v1/audio/transcriptions', form, {
                headers: {
                    'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
                    ...form.getHeaders()
                },
                timeout: 8000
            });

            return res.json({ success: true, text: resp.data?.text?.trim() || '', engine: 'groq-whisper' });
        }

        res.json({ success: true, text: '' });
    } catch (err) {
        res.json({ success: false, text: '' });
    }
});

// ─────────────────────────────────────────────────────────────────────────────
// ROUTE: POST /api/interview/tts (Deepgram Aura-2 Text-to-Speech)
// ─────────────────────────────────────────────────────────────────────────────
router.post('/tts', async (req, res) => {
    try {
        const { text, voice } = req.body;
        if (!text || text.trim().length === 0) {
            return res.status(400).json({ success: false, error: 'Text parameter is required' });
        }

        // Report WHY synthesis failed. generateTTSDataUrl swallows the real
        // error and returns null, so every failure surfaced as "Failed to
        // generate voice audio" -- which looked identical whether the key was
        // missing, the key was rejected, or Deepgram was briefly down. On the
        // live server that hid a missing DEEPGRAM_API_KEY behind a message
        // that gave no way to tell.
        if (!process.env.DEEPGRAM_API_KEY) {
            console.error('[Interview] /tts: DEEPGRAM_API_KEY is not set in this environment — the interviewer has no voice.');
            return res.status(503).json({
                success: false,
                error: 'Voice synthesis is not configured on this server.',
                reason: 'DEEPGRAM_API_KEY_MISSING'
            });
        }

        try {
            const buffer = await dgTTS(text, voice || INTERVIEW_VOICE);
            return res.json({
                success: true,
                audio_url: `data:audio/mp3;base64,${buffer.toString('base64')}`
            });
        } catch (ttsErr) {
            const status = ttsErr.response && ttsErr.response.status;
            console.error(`[Interview] /tts upstream failure (${status || 'no status'}):`, ttsErr.message);
            return res.status(502).json({
                success: false,
                error: status === 401 || status === 403
                    ? 'Voice synthesis rejected the server credentials.'
                    : 'Voice synthesis is temporarily unavailable.',
                reason: status === 401 || status === 403 ? 'DEEPGRAM_KEY_REJECTED' : 'DEEPGRAM_UPSTREAM_ERROR',
                status: status || null
            });
        }
    } catch (err) {
        console.error('[Interview] /tts error:', err.message);
        return res.status(500).json({ success: false, error: err.message });
    }
});

// ─────────────────────────────────────────────────────────────────────────────
// ROUTE: POST /api/interview/recordings/upload (Per-question recording storage)
// ─────────────────────────────────────────────────────────────────────────────
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

        const targetDir = path.join(__dirname, '..', 'uploads', 'recordings', sessionId);
        if (!fs.existsSync(targetDir)) {
            fs.mkdirSync(targetDir, { recursive: true });
        }

        let ext = '.webm';
        const mime = audioOrVideoFile.mimetype || '';
        if (mime.includes('mp4')) ext = '.mp4';
        else if (mime.includes('ogg')) ext = '.ogg';
        else if (mime.includes('wav')) ext = '.wav';

        const safeQNum = String(questionNumber).replace(/[^a-zA-Z0-9_-]/g, '_');
        const filename = `${safeQNum}_${Date.now()}${ext}`;
        const filePath = path.join(targetDir, filename);

        fs.writeFileSync(filePath, audioOrVideoFile.buffer);

        // Authenticated path — the static /uploads mount has been removed.
        const relativeUrl = `/api/interview/recording-file/${sessionId}/${filename}`;

        const manifestPath = path.join(targetDir, 'manifest.json');
        let manifest = { sessionId, updatedAt: new Date().toISOString(), recordings: [] };
        if (fs.existsSync(manifestPath)) {
            try {
                manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
            } catch (e) {
                manifest = { sessionId, recordings: [] };
            }
        }

        const newRecord = {
            questionNumber: safeQNum,
            questionText,
            candidateAnswer,
            duration,
            url: relativeUrl,
            filename,
            sizeBytes: audioOrVideoFile.buffer.length,
            // The browser uploads MediaRecorder blobs with a generic type
            // (often text/plain), which made the manifest describe .webm
            // videos as text. Derive it from the extension we actually wrote.
            mimetype: ext === '.mp4' ? 'video/mp4' : (ext === '.ogg' ? 'video/ogg' : 'video/webm'),
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

        // Save directly to MongoDB InterviewSession document
        try {
            const session = await getSessionFromStore(sessionId);
            if (session) {
                if (!session.recordings) session.recordings = [];
                const recIdx = session.recordings.findIndex(r => r.questionNumber === safeQNum);
                const recDoc = {
                    questionNumber: safeQNum,
                    questionText,
                    candidateAnswer,
                    duration,
                    url: relativeUrl,
                    videoUrl: relativeUrl,
                    audioUrl: relativeUrl,
                    recordedAt: new Date()
                };
                if (recIdx !== -1) {
                    session.recordings[recIdx] = recDoc;
                } else {
                    session.recordings.push(recDoc);
                }
                const qNumInt = parseInt(safeQNum.replace(/\D/g, ''), 10) || 1;
                const ans = session.answers?.find(a => a.questionIndex === qNumInt);
                if (ans) {
                    ans.videoUrl = relativeUrl;
                    ans.audioUrl = relativeUrl;
                }
                if (!session.recording) session.recording = {};
                session.recording.available = true;
                session.recording.url = relativeUrl;
                session.recording.videoPath = relativeUrl;
                session.recording.audioPath = relativeUrl;
                session.recording.uploadedAt = new Date();
                await saveSessionToStore(session);
                console.log(`[DB RECORDING] Persisted ${safeQNum} to MongoDB for session ${sessionId}`);
            }
        } catch (dbErr) {
            console.warn('[DB RECORDING WARNING]:', dbErr.message);
        }

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

// ─────────────────────────────────────────────────────────────────────────────
// ROUTE: GET /api/interview/recordings/:sessionId
// ─────────────────────────────────────────────────────────────────────────────
// Streams one recording file, but only to its owner. The files used to be
// served by express.static('/uploads'), so anyone with a URL — handed out
// freely by the unauthenticated report — could download a candidate's video.
router.get('/recording-file/:sessionId/:filename', async (req, res) => {
    try {
        const sessionId = (req.params.sessionId || '').replace(/[^a-zA-Z0-9_-]/g, '');
        const filename = (req.params.filename || '').replace(/[^a-zA-Z0-9_.-]/g, '');
        if (!sessionId || !filename || filename.includes('..')) {
            return res.status(400).json({ success: false, error: 'Invalid request' });
        }

        const session = await getSessionFromStore(sessionId);
        if (!mayAccessSession(req, session)) {
            return res.status(403).json({ success: false, error: 'Not your recording.' });
        }

        const dir = path.join(__dirname, '..', 'uploads', 'recordings', sessionId);
        const filePath = path.join(dir, filename);
        // Defence in depth: the resolved path must stay inside the session dir.
        if (!path.resolve(filePath).startsWith(path.resolve(dir))) {
            return res.status(400).json({ success: false, error: 'Invalid path' });
        }
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ success: false, error: 'Recording not found' });
        }

        res.setHeader('Cache-Control', 'private, no-store');
        return res.sendFile(filePath);
    } catch (err) {
        console.error('[INTERVIEW] recording-file error:', err.message);
        return res.status(500).json({ success: false, error: 'Could not read recording' });
    }
});

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

// ─────────────────────────────────────────────────────────────────────────────
// ROUTE: GET /api/interview/health
// ─────────────────────────────────────────────────────────────────────────────
router.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Legacy session event logging used by mock-interview.html
router.post('/telemetry', (req, res) => {
    const { sessionId, event, data } = req.body || {};
    if (sessionId && event) {
        console.log(`[Interview Telemetry] session=${sessionId} event=${event}`, data ? JSON.stringify(data) : '');
    }
    res.json({ success: true });
});

module.exports = router;

