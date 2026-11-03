// ============================================================
// Connect — AI interview invites
// ============================================================
// The interview engine in routes/interview.js already runs the hard part:
// questions from a job description, voice in and out, per-answer scoring, a
// report at the end. It was built for a student practising alone, so it has
// no idea what an employer's application is.
//
// This is the join. A recruiter sends an invite against an application; the
// candidate opens one link and talks; the report comes back on that
// application. Three rules hold here:
//
//   1. The job description is NOT uploaded. It is the job the recruiter
//      already posted — title, description and required skills — so the
//      questions are about the role that was actually advertised.
//   2. The candidate needs no account. A salon manager applying for a job
//      should not have to sign up for anything, so the link itself is the
//      credential: signed, expiring, and good for one interview.
//   3. The recruiter gets the report, not the recording. Scores, strengths
//      and a recommendation cross back; audio, video and transcripts stay
//      with the candidate.
// ============================================================

const express = require('express');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const router = express.Router();
const { requireRecruiter } = require('./connectAuth');

const DATA_DIR = path.join(__dirname, '..', 'data');
const APPS_FILE = path.join(DATA_DIR, 'applications.json');
const OPPS_FILE = path.join(DATA_DIR, 'opportunities.json');

const JWT_SECRET = process.env.JWT_SECRET || 'hiero_jwt_super_secret_key_2026';
const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000;
// The candidate's working token. Short, because it only has to outlive one
// sitting — and it is a HIERO identity, so it should not linger.
const CANDIDATE_TTL = '3h';
const QUESTION_MINUTES = 10;

// Same store as the job routes. These used to read data/*.json straight off
// disk, so after those moved to MongoDB this file was looking at a different,
// and on Render an empty, set of applications — an interview invite could not
// find the application it was for.
const store = require('./store');

function keyFor(file) {
    if (file === APPS_FILE) return 'applications';
    if (file === OPPS_FILE) return 'opportunities';
    return null;
}

function loadJSON(file, fallback = []) {
    const key = keyFor(file);
    if (key) return store.read(key);
    try {
        if (fs.existsSync(file)) return JSON.parse(fs.readFileSync(file, 'utf8'));
    } catch (e) {
        console.error('[Connect Interview] read failed:', e.message);
    }
    return fallback;
}

function saveJSON(file, data) {
    const key = keyFor(file);
    if (key) { store.write(key, data); return; }
    try {
        fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
    } catch (e) {
        console.error('[Connect Interview] write failed:', e.message);
    }
}

function sameName(a, b) {
    return Boolean(a && b) && String(a).trim().toLowerCase() === String(b).trim().toLowerCase();
}

// Same ownership rule as the inbox: the application says so, or the job it
// came in on belongs to them.
function ownsApplication(app, recruiter, opp) {
    if (!app) return false;
    if (recruiter.companyId && app.companyId && String(app.companyId) === String(recruiter.companyId)) return true;
    if (sameName(app.companyName, recruiter.companyName)) return true;
    if (!opp) return false;
    if (recruiter.companyId && opp.companyId && String(opp.companyId) === String(recruiter.companyId)) return true;
    return sameName(opp.companyName, recruiter.companyName);
}

// The questions come from here. Everything the recruiter typed into the job
// post is folded into one block of text, because that is what the engine
// reads a role out of.
function jdTextFor(opp, app) {
    if (!opp) return `Role: ${app.jobTitle || 'this role'}.`;
    const skills = (opp.requiredSkills || [])
        .map(s => String((s && s.name) || s || '').trim())
        .filter(Boolean);
    return [
        `Role: ${opp.title}`,
        opp.companyName ? `Company: ${opp.companyName}` : '',
        opp.employmentType ? `Employment type: ${opp.employmentType}` : '',
        opp.location ? `Location: ${opp.location}` : '',
        opp.eligibility ? `Who we are looking for: ${opp.eligibility}` : '',
        '',
        opp.description || '',
        '',
        skills.length ? `Required skills: ${skills.join(', ')}` : ''
    ].filter(Boolean).join('\n').trim();
}

// What the interview page needs in sessionStorage to start. Deliberately the
// shape routes/interview.js already reads, so that page needs no changes.
function interviewContext(app, opp) {
    return {
        candidateName: app.studentName || 'Candidate',
        company: app.companyName || (opp && opp.companyName) || 'the company',
        roleTitle: app.jobTitle || (opp && opp.title) || 'this role',
        level: (opp && opp.employmentType) || 'Experienced',
        duration: QUESTION_MINUTES,
        jdText: jdTextFor(opp, app),
        // The skills the recruiter actually listed on the post. Sent
        // explicitly so the engine does not have to guess them out of prose —
        // guessing is what produced a Go question for a salon manager.
        skills: ((opp && opp.requiredSkills) || [])
            .map(sk => String((sk && sk.name) || sk || '').trim())
            .filter(Boolean)
    };
}

// Resolve an invite id to its application. Scanning is fine at this size and
// keeps the link's meaning in one place: an id is valid only while the
// application still points at it.
function resolveInvite(inviteId) {
    const id = String(inviteId || '');
    if (!id) return { error: 'This interview link is incomplete.', code: 400 };

    const apps = loadJSON(APPS_FILE, []);
    const app = apps.find(a => a.interviewInvite && a.interviewInvite.jti === id);
    if (!app) return { error: 'This interview link is not valid.', code: 401 };

    const invite = app.interviewInvite;
    if (invite.expiresAt && Date.parse(invite.expiresAt) < Date.now()) {
        return { error: 'This interview link has expired. Ask the company to send a new one.', code: 401 };
    }
    if (invite.status === 'started' || invite.status === 'completed') {
        return { error: 'This interview has already been taken.', code: 409 };
    }

    const opps = loadJSON(OPPS_FILE, []);
    const opp = opps.find(o => o.id === app.opportunityId) || null;
    return { apps, app, opp, invite };
}

function findApplication(applicationId) {
    const apps = loadJSON(APPS_FILE, []);
    const app = apps.find(a => a.id === applicationId) || null;
    const opps = loadJSON(OPPS_FILE, []);
    const opp = app ? opps.find(o => o.id === app.opportunityId) || null : null;
    return { apps, app, opp };
}

// The pseudo-identity the engine files this interview under. It is derived
// from the application, so the report can be found again, and it belongs to
// no real account.
function candidateUserId(applicationId) {
    return `connect-app-${applicationId}`;
}

function publicBase(req) {
    if (process.env.PUBLIC_URL) return process.env.PUBLIC_URL.replace(/\/+$/, '');
    return `${req.protocol}://${req.get('host')}`;
}

// ------------------------------------------------------------
// POST /api/connect/interview/invite — recruiter creates the link
// ------------------------------------------------------------
router.post('/invite', requireRecruiter, (req, res) => {
    const applicationId = String((req.body && req.body.applicationId) || '').trim();
    if (!applicationId) {
        return res.status(400).json({ success: false, error: 'applicationId is required.' });
    }

    const { apps, app, opp } = findApplication(applicationId);
    if (!app) return res.status(404).json({ success: false, error: 'No such application.' });
    if (!ownsApplication(app, req.recruiter, opp)) {
        return res.status(403).json({ success: false, error: 'That application was not sent to your company.' });
    }

    // A short opaque id, not a signed blob. The invite's state lives on the
    // application either way, so putting the claims in the URL only bought a
    // 180-character link that wraps and breaks in a mail client. 128 bits of
    // randomness is not guessable, and it fits on one line.
    //
    // A fresh id each time, and the application only honours the newest one,
    // so re-sending retires the previous link rather than leaving two ways in.
    const inviteId = crypto.randomBytes(16).toString('base64url');

    app.interviewInvite = {
        jti: inviteId,
        status: 'sent',
        sentAt: new Date().toISOString(),
        sentBy: req.recruiter.email,
        expiresAt: new Date(Date.now() + INVITE_TTL_MS).toISOString(),
        startedAt: null
    };
    saveJSON(APPS_FILE, apps);

    const url = `${publicBase(req)}/interview/${inviteId}`;
    console.log(`🎙️  [Connect Interview] invite created for ${app.email} (${app.jobTitle}) by ${req.recruiter.email}`);
    res.json({ success: true, url, expiresInDays: 7, context: interviewContext(app, opp) });
});

// ------------------------------------------------------------
// GET /api/connect/interview/invite/:token — what the candidate sees
// ------------------------------------------------------------
// Open on purpose: the token is the credential. It says nothing about the
// candidate that they do not already know.
router.get('/invite/:token', (req, res) => {
    const found = resolveInvite(req.params.token);
    if (found.error) return res.status(found.code).json({ success: false, error: found.error });

    const ctx = interviewContext(found.app, found.opp);
    res.json({
        success: true,
        candidateName: ctx.candidateName,
        company: ctx.company,
        role: ctx.roleTitle,
        minutes: QUESTION_MINUTES,
        questions: QUESTION_MINUTES,
        intro: `You have been invited to an interview for the ${ctx.roleTitle} position at ${ctx.company}. It takes about ${QUESTION_MINUTES} minutes and is run by HIERO's AI interviewer. You will be asked to speak your answers.`
    });
});

// ------------------------------------------------------------
// POST /api/connect/interview/invite/:token/begin — hand over to the engine
// ------------------------------------------------------------
router.post('/invite/:token/begin', (req, res) => {
    const found = resolveInvite(req.params.token);
    if (found.error) return res.status(found.code).json({ success: false, error: found.error });
    const { apps, app, opp, invite } = found;

    // Burned here, not at the end. A link that stayed open until the
    // interview was submitted could be started twice in two tabs.
    invite.status = 'started';
    invite.startedAt = new Date().toISOString();
    app.interviewInvite = invite;
    if (app.status === 'applied') app.status = 'under-review';
    saveJSON(APPS_FILE, apps);

    // The engine reads identity from a HIERO token. Issuing one for a
    // pseudo-user derived from the application is what files the session
    // where the recruiter's report can find it — without the candidate ever
    // having an account, and without editing the interview page.
    const candidateToken = jwt.sign(
        {
            userId: candidateUserId(app.id),
            email: String(app.email || '').toLowerCase(),
            name: app.studentName || 'Candidate',
            connectApplicationId: app.id
        },
        JWT_SECRET,
        { expiresIn: CANDIDATE_TTL }
    );

    res.json({ success: true, token: candidateToken, context: interviewContext(app, opp) });
});

// ------------------------------------------------------------
// GET /api/connect/interview/report/:applicationId — recruiter reads it
// ------------------------------------------------------------
router.get('/report/:applicationId', requireRecruiter, async (req, res) => {
    const applicationId = String(req.params.applicationId || '');
    const { app, opp } = findApplication(applicationId);
    if (!app) return res.status(404).json({ success: false, error: 'No such application.' });
    if (!ownsApplication(app, req.recruiter, opp)) {
        return res.status(403).json({ success: false, error: 'That application was not sent to your company.' });
    }

    let session = null;
    try {
        const InterviewSession = require('../models/InterviewSession');
        session = await InterviewSession
            .findOne({ userId: candidateUserId(applicationId) })
            .sort({ createdAt: -1 })
            .lean();
    } catch (e) {
        console.error('[Connect Interview] report lookup failed:', e.message);
        return res.status(503).json({ success: false, error: 'Could not reach the interview store.' });
    }

    if (!session) {
        return res.json({
            success: true,
            state: (app.interviewInvite && app.interviewInvite.status) || 'none',
            report: null
        });
    }

    const card = session.scorecard || {};
    const evalv = session.evaluation || {};
    const pick = (...vals) => vals.find(v => typeof v === 'number' && Number.isFinite(v)) ?? null;

    // Scores and words only. Recordings, transcripts and per-answer audio
    // belong to the candidate and are not in this response.
    res.json({
        success: true,
        state: session.status === 'COMPLETED' ? 'completed' : 'in_progress',
        report: {
            sessionStatus: session.status,
            completedAt: session.completedAt || null,
            questionsAsked: (session.questions || []).length,
            questionsAnswered: (session.answers || []).length,
            overall: pick(card.overallScore, evalv.overallScore),
            scores: {
                communication: pick(card.communicationScore, evalv.communicationScore),
                problemSolving: pick(card.problemSolvingScore, evalv.problemSolvingScore),
                roleKnowledge: pick(card.technicalScore, evalv.technicalScore),
                relevance: pick(evalv.relevanceScore, card.resumeAlignmentScore),
                confidence: pick(evalv.confidenceScore)
            },
            strengths: card.strengths && card.strengths.length ? card.strengths : (evalv.strengths || []),
            areasToImprove: card.areasToImprove && card.areasToImprove.length ? card.areasToImprove : (evalv.weaknesses || []),
            recommendation: card.recommendation || '',
            summary: card.summary || ''
        }
    });
});

module.exports = router;
