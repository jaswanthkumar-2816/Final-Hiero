const express = require('express');
const fs = require('fs');
const path = require('path');

const router = express.Router();
const notify = require('./notify');

const DATA_DIR = path.join(__dirname, '..', 'data');
const OPPS_FILE = path.join(DATA_DIR, 'opportunities.json');
const COMPS_FILE = path.join(DATA_DIR, 'companies.json');

// Ensure data directory and files exist
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

// These three lists used to be JSON files in this repository, which meant
// every Render deploy restored them from git and destroyed every job and
// application created since. They live in MongoDB now. The helpers keep
// their old names and their old synchronous shape so the routes below did
// not have to change.
const store = require('./store');

function keyFor(filePath) {
    if (filePath === OPPS_FILE) return 'opportunities';
    if (filePath === COMPS_FILE) return 'companies';
    if (filePath === APPS_FILE) return 'applications';
    return null;
}

function loadJSON(filePath, defaultValue = []) {
    const key = keyFor(filePath);
    if (key) return store.read(key);
    try {
        if (fs.existsSync(filePath)) {
            const raw = fs.readFileSync(filePath, 'utf8');
            return JSON.parse(raw);
        }
    } catch (e) {
        console.error(`[Opportunities API] Error loading ${filePath}:`, e.message);
    }
    return defaultValue;
}

function saveJSON(filePath, data) {
    const key = keyFor(filePath);
    if (key) { store.write(key, data); return; }
    try {
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    } catch (e) {
        console.error(`[Opportunities API] Error saving ${filePath}:`, e.message);
    }
}

// No seed data. Everything on HIERO comes from a company posting it
// through the Connect portal; the demo rows that used to live here were
// indistinguishable from real ones on the public job pages.
let opportunities = [];
let companies = [];

// GET /api/opportunities - Fetch all active opportunities & associated companies
const axios = require('axios');
const PYTHON_BACKEND_URL = process.env.PYTHON_BACKEND_URL || 'http://localhost:5050';

// GET /api/opportunities - Fetch all active opportunities & associated companies
router.get('/', async (req, res) => {
    try {
        const { companyId, type } = req.query;

        // There used to be a second source here: if a Python service answered
        // on port 5050 its jobs were served instead of ours, silently. That
        // made what HIERO showed depend on whether another process happened
        // to be running, and it cost every visitor a 1.5s wait for a service
        // that is not deployed. One source now — what companies posted
        // through Connect.
        let filtered = loadJSON(OPPS_FILE, opportunities);
        let comps = loadJSON(COMPS_FILE, companies);

        if (companyId) {
            filtered = filtered.filter(o => o.companyId === companyId);
        }
        if (type) {
            filtered = filtered.filter(o => o.type === type);
        }

        res.json({
            success: true,
            opportunities: filtered,
            companies: comps
        });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

// POST /api/opportunities - Create a new opportunity from Connect-Portal or API
router.post('/', async (req, res) => {
    try {
        const body = req.body;
        if (!body.title) {
            return res.status(400).json({ success: false, error: 'Title is required' });
        }

        const currentOpps = loadJSON(OPPS_FILE, opportunities);
        const currentComps = loadJSON(COMPS_FILE, companies);

        const companyId = body.companyId || `comp-${(body.companyName || 'partner').toLowerCase().replace(/\s+/g, '-')}`;
        const companyName = body.companyName || 'Verified HR Partner';

        // Check if company exists, if not create record
        let comp = currentComps.find(c => c.id === companyId);
        if (!comp) {
            comp = {
                id: companyId,
                name: companyName,
                logoUrl: body.logoUrl || '',
                location: body.location || 'India (Hybrid/Remote)',
                description: body.companyDescription || 'Verified partner company connecting directly with HIERO AI talent network.',
                website: body.website || ''
            };
            currentComps.unshift(comp);
            saveJSON(COMPS_FILE, currentComps);
            companies = currentComps;
        }

        const newOpp = {
            id: body.id || `opp-${Date.now()}`,
            companyId: companyId,
            companyName: companyName,
            logoUrl: body.logoUrl || comp.logoUrl || '',
            type: body.type || 'internship',
            title: body.title,
            department: body.department || 'Engineering',
            description: body.description || '',
            requiredSkills: body.requiredSkills || [],
            preferredSkills: body.preferredSkills || [],
            eligibility: body.eligibility || 'B.Tech/BE/MCA',
            location: body.location || 'India (Hybrid/Remote)',
            workMode: body.workMode || 'hybrid',
            employmentType: body.employmentType || (body.type === 'internship' ? 'Internship' : 'Full-time'),
            salary: body.salary || 'Competitive',
            deadline: body.deadline || '2026-12-31',
            status: 'active',
            applicantsCount: 0,
            shortlistedCount: 0,
            createdAt: new Date().toISOString().split('T')[0]
        };

        currentOpps.unshift(newOpp);
        saveJSON(OPPS_FILE, currentOpps);
        opportunities = currentOpps;

        // Async sync to Python backend on port 5050
        try {
            await axios.post(`${PYTHON_BACKEND_URL}/api/opportunities`, newOpp, { timeout: 2000 });
            console.log(`⚡ [Opportunities Route] Synced "${newOpp.title}" to Python Backend (5050)`);
        } catch (e) {
            // Warning log
        }

        console.log(`✨ [Opportunities Backend] New opportunity published: "${newOpp.title}" by ${companyName}`);

        res.status(201).json({
            success: true,
            opportunity: newOpp,
            company: comp
        });
    } catch (e) {
        console.error('Error creating opportunity:', e);
        res.status(500).json({ success: false, error: e.message });
    }
});

// APPS_FILE for application persistence
const APPS_FILE = path.join(DATA_DIR, 'applications.json');

// ============================================================
// Who is allowed to read an application
// ============================================================
// Applying is open — a candidate has no account and must not need one.
// READING applications is not: they carry a named person's email, phone and
// resume. This endpoint used to answer anyone, with the company to filter by
// passed in the query string, which is a request, not proof. Every
// application in the store came back to whoever asked.
//
// The company now comes from the recruiter's signed token and the filtering
// happens here, so a caller cannot widen their own scope.
const { requireRecruiter } = require('./connectAuth');

function sameName(a, b) {
    if (!a || !b) return false;
    return String(a).trim().toLowerCase() === String(b).trim().toLowerCase();
}

// An application belongs to a company when it says so, or when the job it was
// sent to belongs to them. Older records carry no companyId at all, which is
// why the opportunity is checked as well.
function applicationBelongsTo(app, companyId, companyName, oppsById) {
    if (!app) return false;
    if (companyId && app.companyId && String(app.companyId) === String(companyId)) return true;
    if (sameName(app.companyName, companyName)) return true;
    const opp = app.opportunityId ? oppsById.get(app.opportunityId) : null;
    if (!opp) return false;
    if (companyId && opp.companyId && String(opp.companyId) === String(companyId)) return true;
    return sameName(opp.companyName, companyName);
}

function applicationsFor(recruiter) {
    const opps = loadJSON(OPPS_FILE, opportunities);
    const oppsById = new Map(opps.filter(o => o && o.id).map(o => [o.id, o]));
    return loadJSON(APPS_FILE, [])
        .filter(a => applicationBelongsTo(a, recruiter.companyId, recruiter.companyName, oppsById));
}

// ============================================================
// Resume uploads
// ============================================================
// The apply modal used to send a made-up string (`/resumes/<filename>`) and
// throw the file away, so a recruiter opening an application had nothing to
// read. The file is now stored here and served back by id, which is the only
// reason the Connect inbox can show a real resume.
const multer = require('multer');
const RESUME_DIR = path.join(DATA_DIR, 'resumes');
if (!fs.existsSync(RESUME_DIR)) {
    fs.mkdirSync(RESUME_DIR, { recursive: true });
}

const RESUME_EXTENSIONS = new Set(['.pdf', '.doc', '.docx']);

const resumeUpload = multer({
    storage: multer.diskStorage({
        destination: (req, file, cb) => cb(null, RESUME_DIR),
        // The uploaded name reaches the filesystem, so strip anything that is
        // not a plain filename character and keep the extension we allowed.
        filename: (req, file, cb) => {
            const ext = path.extname(file.originalname || '').toLowerCase();
            const stem = path.basename(file.originalname || 'resume', ext)
                .replace(/[^a-zA-Z0-9._-]+/g, '_')
                .slice(0, 60) || 'resume';
            cb(null, `${Date.now()}-${stem}${RESUME_EXTENSIONS.has(ext) ? ext : '.pdf'}`);
        }
    }),
    limits: { fileSize: 8 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const ext = path.extname(file.originalname || '').toLowerCase();
        if (!RESUME_EXTENSIONS.has(ext)) {
            return cb(new Error('Resume must be a PDF, DOC or DOCX file.'));
        }
        cb(null, true);
    }
});

function splitList(raw) {
    if (Array.isArray(raw)) return raw.map(s => String(s).trim()).filter(Boolean);
    return String(raw || '').split(/[,|\n]/).map(s => s.trim()).filter(Boolean);
}

// A real overlap between the job's required skills and what the applicant
// listed. The old flow hardcoded 92 for everyone, which told a recruiter
// nothing. Returns null when there is nothing to compare, so the inbox can
// show "—" instead of a fake 0%.
function scoreAgainstOpportunity(opp, skills) {
    const required = ((opp && opp.requiredSkills) || [])
        .map(s => String((s && s.name) || s || '').toLowerCase())
        .filter(Boolean);
    const have = skills.map(s => String(s).toLowerCase()).filter(Boolean);
    if (!required.length || !have.length) return { score: null, matched: [], missing: required };

    const matched = required.filter(r => have.some(h => h.includes(r) || r.includes(h)));
    const missing = required.filter(r => !matched.includes(r));
    return {
        score: Math.round((matched.length / required.length) * 100),
        matched,
        missing
    };
}

// One record shape for both apply routes. They differ only in how the resume
// arrives — as an uploaded file or as a URL somebody already has.
function recordApplication(body, resumeUrl) {
    const opportunityId = body.opportunityId || body.jobId || 'opp-demo-1';
    const companyName = body.companyName || 'Verified HR Partner';

    const currentOpps = loadJSON(OPPS_FILE, opportunities);
    const currentApps = loadJSON(APPS_FILE, []);

    const targetOpp = currentOpps.find(o => o.id === opportunityId || o.companyName === companyName);
    if (targetOpp) {
        targetOpp.applicantsCount = (targetOpp.applicantsCount || 0) + 1;
        saveJSON(OPPS_FILE, currentOpps);
    }

    let profileIn = (body.profile && typeof body.profile === 'object') ? body.profile : {};
    // Multipart sends every field as text, so a profile object arrives as JSON.
    if (typeof body.profile === 'string' && body.profile.trim()) {
        try { profileIn = JSON.parse(body.profile); } catch { profileIn = {}; }
    }

    const studentName = body.studentName || body.fullName || profileIn.fullName || 'Candidate';
    // Lowercased: this is the key that joins an application to the
    // student's practice sessions, so casing must not break it.
    const email = String(body.email || profileIn.email || 'candidate@hiero.in')
        .trim()
        .toLowerCase();
    const skills = splitList(profileIn.skills || body.skills);

    const profile = {
        fullName: profileIn.fullName || studentName,
        email: profileIn.email || email,
        phone: profileIn.phone || body.phone || '',
        college: profileIn.college || '',
        degree: profileIn.degree || '',
        branch: profileIn.branch || '',
        graduationYear: profileIn.graduationYear || '',
        cgpa: profileIn.cgpa || '',
        city: profileIn.city || profileIn.location || body.city || '',
        candidateType: profileIn.candidateType || body.candidateType || 'student',
        headline: profileIn.headline || profileIn.targetRole || body.headline || '',
        linkedin: profileIn.linkedin || '',
        github: profileIn.github || '',
        portfolio: profileIn.portfolio || '',
        skills,
        softSkills: splitList(profileIn.softSkills),
        experienceYears: profileIn.experienceYears || body.experienceYears || '',
        experienceSummary: profileIn.experienceSummary || body.experienceSummary || '',
        projects: profileIn.projects || '',
        about: profileIn.about || body.about || '',
        verifiedSkills: Array.isArray(profileIn.verifiedSkills) ? profileIn.verifiedSkills : (body.verifiedSkills || [])
    };

    const match = scoreAgainstOpportunity(targetOpp, skills);
    const sentScore = typeof body.matchScore === 'number'
        ? body.matchScore
        : (body.matchScore ? parseInt(body.matchScore, 10) : null);

    const newApp = {
        id: `app-${Date.now()}`,
        opportunityId: targetOpp ? targetOpp.id : opportunityId,
        companyName: companyName,
        companyId: body.companyId || (targetOpp && targetOpp.companyId) || '',
        jobTitle: body.jobTitle || (targetOpp && targetOpp.title) || '',
        studentId: body.studentId || email,
        studentName,
        email,
        phone: profile.phone,
        status: 'applied',
        matchScore: Number.isFinite(sentScore) ? sentScore : match.score,
        atsScore: body.atsScore || profileIn.atsScore || null,
        appliedAt: new Date().toISOString(),
        resumeUrl: resumeUrl || body.resumeUrl || profileIn.resumeUrl || '',
        resumeName: body.resumeName || '',
        skillsMatch: body.skillsMatch || {
            matched: match.matched.length ? match.matched : skills.slice(0, 8),
            missing: match.missing
        },
        verifiedSkills: profile.verifiedSkills,
        profile
    };

    currentApps.unshift(newApp);
    saveJSON(APPS_FILE, currentApps);

    console.log(`📩 [Opportunities Backend] New application from ${newApp.email} for "${companyName}" (Role: ${newApp.jobTitle || 'Unknown role'})`);
    return newApp;
}

// POST /api/opportunities/apply - Candidate applies to an opportunity
router.post('/apply', (req, res) => {
    try {
        const application = recordApplication(req.body || {}, '');
        res.status(201).json({ success: true, application });
        // After the response. The applicant should not wait on SMTP to find
        // out whether their application went through.
        notify.newApplication(application);
    } catch (e) {
        console.error('Error submitting application:', e);
        res.status(500).json({ success: false, error: e.message });
    }
});

// POST /api/opportunities/apply-with-resume — apply and upload the resume in
// one multipart request. This is what the HIERO job pages use, so the
// recruiter inbox gets a file it can actually open.
router.post('/apply-with-resume', (req, res) => {
    resumeUpload.single('resume')(req, res, (uploadErr) => {
        if (uploadErr) {
            return res.status(400).json({ success: false, error: uploadErr.message });
        }
        try {
            const body = req.body || {};
            if (!req.file && !body.resumeUrl) {
                return res.status(400).json({ success: false, error: 'Attach a resume to apply.' });
            }
            const resumeUrl = req.file
                ? `/api/opportunities/resumes/${encodeURIComponent(req.file.filename)}`
                : body.resumeUrl;
            if (req.file) body.resumeName = req.file.originalname || req.file.filename;

            const application = recordApplication(body, resumeUrl);
            res.status(201).json({ success: true, application });
            notify.newApplication(application);
        } catch (e) {
            console.error('Error submitting application:', e);
            res.status(500).json({ success: false, error: e.message });
        }
    });
});

// GET /api/opportunities/resumes/:file — serve a stored resume to the
// recruiter inbox. basename() keeps the path inside RESUME_DIR; without it a
// crafted name could walk out of the folder.
router.get('/resumes/:file', requireRecruiter, (req, res) => {
    const name = path.basename(String(req.params.file || ''));
    const full = path.join(RESUME_DIR, name);
    if (!name || !full.startsWith(RESUME_DIR + path.sep) || !fs.existsSync(full)) {
        return res.status(404).json({ success: false, error: 'Resume not found.' });
    }
    // A resume is one person's CV handed to one employer. Knowing the
    // filename is not authorisation: the recruiter asking must own the
    // application it came in on.
    const owns = applicationsFor(req.recruiter)
        .some(a => String(a.resumeUrl || '').endsWith(encodeURIComponent(name))
                || String(a.resumeUrl || '').endsWith(name));
    if (!owns) {
        return res.status(403).json({ success: false, error: 'This resume was not sent to your company.' });
    }
    if (path.extname(name).toLowerCase() === '.pdf') {
        res.setHeader('Content-Type', 'application/pdf');
    }
    res.setHeader('Content-Disposition', `inline; filename="${name}"`);
    res.sendFile(full);
});

// GET /api/opportunities/applications - Fetch applications for Connect-Portal HR Inbox
router.get('/applications', requireRecruiter, (req, res) => {
    try {
        // Scope first, from the token. A companyId in the query is ignored:
        // it is the caller's claim about themselves.
        let apps = applicationsFor(req.recruiter);
        const { opportunityId } = req.query;
        if (opportunityId) {
            apps = apps.filter(a => a.opportunityId === opportunityId);
        }
        res.json({
            success: true,
            applications: apps
        });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

// POST /api/opportunities/applications/status — recruiter shortlist / selection from Connect
router.post('/applications/status', requireRecruiter, (req, res) => {
    try {
        const body = req.body || {};
        const apps = loadJSON(APPS_FILE, []);
        const status = body.status || 'shortlisted';
        let app = apps.find(a =>
            a.id === body.applicationId ||
            (body.studentId && body.opportunityId && a.studentId === body.studentId && a.opportunityId === body.opportunityId) ||
            (body.email && a.email && String(a.email).toLowerCase() === String(body.email).toLowerCase())
        );
        if (!app) {
            app = {
                id: body.applicationId || `app-${Date.now()}`,
                opportunityId: body.opportunityId,
                companyName: body.companyName,
                studentId: body.studentId,
                studentName: body.studentName,
                email: body.email,
                matchScore: body.matchScore || 0,
                appliedAt: new Date().toISOString(),
                resumeUrl: body.resumeUrl,
            };
            apps.unshift(app);
        }
        app.status = status;
        app.notes = body.notes || app.notes;
        app.notifiedAt = new Date().toISOString();
        saveJSON(APPS_FILE, apps);

        const currentOpps = loadJSON(OPPS_FILE, opportunities);
        const targetOpp = currentOpps.find(o => o.id === app.opportunityId);
        if (targetOpp && (status === 'shortlisted' || status === 'selected')) {
            targetOpp.shortlistedCount = (targetOpp.shortlistedCount || 0) + 1;
            saveJSON(OPPS_FILE, currentOpps);
        }

        console.log(`✅ [Opportunities Backend] ${status} recorded for ${app.studentName || app.email}`);
        res.json({ success: true, application: app });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

// ============================================================
// GET /api/opportunities/practice/:studentId
// Recruiter-facing summary of the practice interviews a student ran on
// HIERO before applying. Two rules hold here:
//   1. It is released only to a company the student actually applied to.
//   2. It is only ever a summary — scores, skills and areas to improve.
//      Transcripts, answers, recordings and video/audio URLs belong to the
//      student and never leave HIERO.
// NOTE: this router has no authentication, so companyId is a claim, not
// proof. The application check below is a real restriction but not a
// substitute for signing recruiters in. Tighten this once Connect has login.
// ============================================================

const mongoose = require('mongoose');

// The student must have an application to one of this company's opportunities.
function findConsentingApplication(apps, studentId, companyId, companyName) {
    const sid = String(studentId || '').trim().toLowerCase();
    const cid = String(companyId || '').trim().toLowerCase();
    const cname = String(companyName || '').trim().toLowerCase();
    if (!sid || (!cid && !cname)) return null;

    const currentOpps = loadJSON(OPPS_FILE, opportunities);
    const companyOppIds = new Set(
        currentOpps
            .filter(o =>
                (cid && String(o.companyId || '').toLowerCase() === cid) ||
                (cname && String(o.companyName || '').toLowerCase() === cname)
            )
            .map(o => o.id)
    );

    return apps.find(a => {
        const isStudent =
            String(a.studentId || '').toLowerCase() === sid ||
            String(a.email || '').toLowerCase() === sid;
        if (!isStudent) return false;
        return (
            companyOppIds.has(a.opportunityId) ||
            (cid && String(a.companyId || '').toLowerCase() === cid) ||
            (cname && String(a.companyName || '').toLowerCase() === cname)
        );
    }) || null;
}

// Applications identify a student by email; interview sessions use the HIERO
// user id. Resolve one to the other so both spellings find the sessions.
const USERS_FILE = path.join(__dirname, '..', 'users.json');

function normaliseEmail(value) {
    return String(value || '').trim().toLowerCase();
}

async function resolveSessionUserIds(studentId) {
    const raw = String(studentId).trim();
    const ids = new Set([raw]);

    // Legacy accounts live in users.json with short numeric ids, and their
    // sessions still carry those. Resolving here beats migrating 200+ session
    // documents, and it keeps working for accounts that never moved to Mongo.
    try {
        const legacy = JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
        const hit = legacy.find(u =>
            normaliseEmail(u.email) === normaliseEmail(raw) || String(u.id) === raw
        );
        if (hit) {
            if (hit.id !== undefined && hit.id !== null) ids.add(String(hit.id));
            if (hit.email) ids.add(normaliseEmail(hit.email));
        }
    } catch (e) {
        // No legacy file, or unreadable: the Mongo lookup below still applies.
    }

    if (mongoose.connection.readyState === 1) {
        try {
            const User = require('../models/User');
            const user = await User.findOne({
                $or: [
                    { email: String(studentId).toLowerCase() },
                    { username: String(studentId) }
                ]
            }).select('_id email username').lean();
            if (user) {
                // A session's userId is whatever the JWT carried: the Mongo id
                // for database accounts, but it falls back to the email, so
                // try every spelling this account is known by.
                ids.add(user._id.toString());
                if (user.email) ids.add(user.email);
                if (user.username) ids.add(user.username);
            }
        } catch (e) {
            // No user record, or the lookup failed: fall back to the raw id.
        }
    }
    return Array.from(ids);
}

function firstFiniteNumber(...values) {
    for (const v of values) {
        const n = Number(v);
        if (v !== null && v !== undefined && v !== '' && Number.isFinite(n)) return n;
    }
    return undefined;
}

// Question skills are typed freehand, so one field can hold a comma-joined
// list ("python, fastapi, redis") and the same skill appears as "sql", "SQL"
// and "Sql". Split and canonicalise so a recruiter sees one row per skill.
const SKILL_ACRONYMS = {
    sql: 'SQL', api: 'API', apis: 'APIs', rest: 'REST', css: 'CSS', html: 'HTML',
    aws: 'AWS', gcp: 'GCP', ci: 'CI', cd: 'CD', orm: 'ORM', jwt: 'JWT', oop: 'OOP',
    postgresql: 'PostgreSQL', postgres: 'Postgres', mysql: 'MySQL', mongodb: 'MongoDB',
    nodejs: 'Node.js', javascript: 'JavaScript', typescript: 'TypeScript', fastapi: 'FastAPI'
};

function prettySkill(name) {
    const trimmed = String(name || '').trim();
    if (!trimmed) return '';
    // Leave deliberate casing alone (FastAPI, PostgreSQL, Redis).
    if (trimmed !== trimmed.toLowerCase()) return trimmed;
    return trimmed
        .split(/\s+/)
        .map(w => SKILL_ACRONYMS[w] || (w.charAt(0).toUpperCase() + w.slice(1)))
        .join(' ');
}

function splitSkillField(raw) {
    return String(raw || '')
        .split(/[,/|]+/)
        .map(part => prettySkill(part))
        .filter(Boolean);
}

// Join questions to answers on the question index so each session yields one
// score per skill, averaged when a skill came up more than once.
function skillScoresForSession(session) {
    const questions = Array.isArray(session.questions) ? session.questions : [];
    const answers = Array.isArray(session.answers) ? session.answers : [];
    const scoreByIndex = new Map();
    answers.forEach(a => {
        const idx = Number(a && a.questionIndex);
        const score = firstFiniteNumber(a && a.evaluationScore);
        if (Number.isFinite(idx) && score !== undefined) scoreByIndex.set(idx, score);
    });

    const totals = new Map();
    questions.forEach(q => {
        const score = scoreByIndex.get(Number(q && q.index));
        if (score === undefined) return;
        // One question may name several skills; each gets that question's score.
        splitSkillField(q && q.skill).forEach(name => {
            const key = name.toLowerCase();
            const prev = totals.get(key) || { name, sum: 0, count: 0 };
            totals.set(key, { name: prev.name, sum: prev.sum + score, count: prev.count + 1 });
        });
    });

    return Array.from(totals.values()).map(t => ({
        name: t.name,
        score: Math.round((t.sum / t.count) * 10) / 10
    }));
}

// Explicit projection. Never spread a session document into the response:
// it carries transcripts, recordings and the candidate's own answers.
function summariseSession(session, attempt) {
    const card = session.scorecard || {};
    const evaluation = session.evaluation || {};
    const overallScore = firstFiniteNumber(card.overallScore, evaluation.overallScore);
    if (overallScore === undefined) return null;

    const areas = []
        .concat(Array.isArray(card.areasToImprove) ? card.areasToImprove : [])
        .concat(Array.isArray(evaluation.weaknesses) ? evaluation.weaknesses : [])
        .map(a => String(a || '').trim())
        .filter(Boolean);

    return {
        sessionId: String(session.sessionId || ''),
        attempt,
        role: String(session.jobRole || 'Practice interview'),
        overallScore,
        technicalScore: firstFiniteNumber(card.technicalScore, evaluation.technicalScore),
        communicationScore: firstFiniteNumber(card.communicationScore, evaluation.communicationScore),
        problemSolvingScore: firstFiniteNumber(card.problemSolvingScore, evaluation.problemSolvingScore),
        completedAt: session.completedAt || session.createdAt || '',
        skills: skillScoresForSession(session),
        areasToImprove: Array.from(new Set(areas))
    };
}

function buildPracticeRecord(studentId, sessions) {
    const ordered = sessions
        .slice()
        .sort((a, b) =>
            new Date(a.completedAt || a.createdAt || 0) - new Date(b.completedAt || b.createdAt || 0)
        );

    const attempts = ordered
        .map((s, i) => summariseSession(s, i + 1))
        .filter(Boolean)
        .map((a, i) => Object.assign({}, a, { attempt: i + 1 }));

    if (!attempts.length) return null;

    const first = attempts[0];
    const latest = attempts[attempts.length - 1];

    // A skill's trend runs from the earliest attempt that covered it to the
    // most recent one that did.
    const trends = new Map();
    attempts.forEach(a => {
        a.skills.forEach(s => {
            const key = s.name.toLowerCase();
            const prev = trends.get(key);
            if (prev) prev.latest = s.score;
            else trends.set(key, { name: s.name, first: s.score, latest: s.score });
        });
    });

    const outstanding = latest.areasToImprove;
    const outstandingKeys = new Set(outstanding.map(a => a.toLowerCase()));
    const resolved = Array.from(new Set(
        attempts
            .slice(0, -1)
            .reduce((all, a) => all.concat(a.areasToImprove), [])
            .filter(a => !outstandingKeys.has(a.toLowerCase()))
    ));

    return {
        studentId,
        role: latest.role,
        attempts,
        firstScore: first.overallScore,
        latestScore: latest.overallScore,
        bestScore: Math.max.apply(null, attempts.map(a => a.overallScore)),
        firstAt: first.completedAt,
        latestAt: latest.completedAt,
        // Most-improved first, capped: a recruiter card is read at a glance,
        // and a long undifferentiated list buries the movement.
        skills: Array.from(trends.values())
            .sort((a, b) => (b.latest - b.first) - (a.latest - a.first))
            .slice(0, 6),
        resolved,
        outstanding
    };
}

router.get('/practice/:studentId', async (req, res) => {
    try {
        const { studentId } = req.params;
        const { role, companyId, companyName } = req.query;

        const apps = loadJSON(APPS_FILE, []);
        const application = findConsentingApplication(apps, studentId, companyId, companyName);
        if (!application) {
            return res.status(403).json({
                success: false,
                error: 'This student has not applied to your company, so their practice record is not shared with you.'
            });
        }

        if (mongoose.connection.readyState !== 1) {
            return res.json({ success: true, record: null, reason: 'database_unavailable' });
        }

        const userIds = await resolveSessionUserIds(studentId);
        // The application carries the student's email, which is the identifier
        // sessions and applications genuinely share.
        const studentEmail = normaliseEmail(
            application.email || (String(studentId).includes('@') ? studentId : '')
        );
        const identity = { $or: [{ userId: { $in: userIds } }] };
        if (studentEmail) identity.$or.push({ userEmail: studentEmail });

        // Status is written both as 'COMPLETED' and 'completed' in this database.
        let sessions = await InterviewSessionModel()
            .find(Object.assign({}, identity, { status: { $in: ['COMPLETED', 'completed'] } }))
            .sort({ createdAt: 1 })
            .limit(50)
            .lean();

        // Prefer sessions practised for this role; fall back to all of them
        // rather than answering empty when the role strings differ.
        const wanted = String(role || application.jobTitle || '').trim().toLowerCase();
        if (wanted) {
            const matching = sessions.filter(s => {
                const jobRole = String(s.jobRole || '').toLowerCase();
                return jobRole && (jobRole.includes(wanted) || wanted.includes(jobRole));
            });
            if (matching.length) sessions = matching;
        }

        const record = buildPracticeRecord(studentId, sessions);
        if (record) return res.json({ success: true, record });

        // Legacy sessions carry short numeric user ids that no User document
        // links back to, so an empty answer may mean the account could not be
        // matched rather than that the student never practised.
        const anySessions = await InterviewSessionModel().countDocuments(identity);
        res.json({
            success: true,
            record: null,
            reason: anySessions > 0 ? 'no_completed_sessions' : 'no_sessions_for_this_account'
        });
    } catch (e) {
        console.error('[Opportunities API] practice record failed:', e.message);
        res.status(500).json({ success: false, error: e.message });
    }
});

function InterviewSessionModel() {
    return require('../models/InterviewSession');
}

module.exports = router;
// Pure helpers, exported so the summary can be tested without HTTP or data
// fixtures. An express router is a function, so these ride along harmlessly.
module.exports.buildPracticeRecord = buildPracticeRecord;
module.exports.summariseSession = summariseSession;
