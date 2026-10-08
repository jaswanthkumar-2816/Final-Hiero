const express = require('express');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
const TesterFeedback = require('../models/TesterFeedback');

const transporter = (process.env.EMAIL_USER && process.env.EMAIL_PASS)
    ? nodemailer.createTransport({
        service: 'gmail',
        auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
    })
    : null;

const ESC = (v) => String(v == null ? '' : v)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** Renders the answers a tester actually gave — blank fields are left out. */
function answersTable(rec) {
    const rows = [
        ['Status', rec.status],
        ['Specialisation', rec.specialisation],
        ['Target role', rec.targetRole],
        ['Confidence in CV, before', rec.confidenceBefore ? rec.confidenceBefore + ' / 5' : ''],
        ['Clarity on missing skills, before', rec.clarityBefore ? rec.clarityBefore + ' / 5' : ''],
        ['Biggest problem', rec.biggestProblem],
        ['Ease of use', rec.easeOfUse ? rec.easeOfUse + ' / 5' : ''],
        ['Resume builder', rec.resumeBuilder ? rec.resumeBuilder + ' / 5' : ''],
        ['CV vs job description accuracy', rec.jdAccuracy ? rec.jdAccuracy + ' / 5' : ''],
        ['Skill gap usefulness', rec.skillGapUseful ? rec.skillGapUseful + ' / 5' : ''],
        ['Learning relevance', rec.learningRelevant ? rec.learningRelevant + ' / 5' : ''],
        ['Interview questions relevant', rec.interviewRelevant ? rec.interviewRelevant + ' / 5' : ''],
        ['Felt like a real interview', rec.interviewRealism ? rec.interviewRealism + ' / 5' : ''],
        ['Report usefulness', rec.reportUseful ? rec.reportUseful + ' / 5' : ''],
        ['Confidence in CV, after', rec.confidenceAfter ? rec.confidenceAfter + ' / 5' : ''],
        ['Saved time', rec.savedTime],
        ['Would use again', rec.wouldUseAgain],
        ['Would recommend', rec.recommend != null ? rec.recommend + ' / 10' : ''],
        ['Most useful feature', rec.mostUseful],
        ['Fix this first', rec.improveFirst],
        ['Anything else', rec.anythingElse]
    ].filter(([, v]) => v);

    return rows.map(([k, v]) =>
        `<tr>
           <td style="padding:7px 14px 7px 0;color:#6b7280;font-size:13px;vertical-align:top;white-space:nowrap">${ESC(k)}</td>
           <td style="padding:7px 0;color:#111827;font-size:14px;vertical-align:top">${ESC(v)}</td>
         </tr>`).join('');
}

function shell(heading, intro, rec) {
    return `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;background:#f7f7f5;padding:32px 16px">
      <table align="center" width="100%" style="max-width:580px;background:#fff;border:1px solid #e0e2de;border-radius:4px;border-collapse:separate">
        <tr><td style="padding:26px 28px 0">
          <p style="margin:0 0 6px;font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:#0f6156">Hiero &middot; Tester round</p>
          <h1 style="margin:0 0 10px;font-size:22px;font-weight:600;color:#1a1d1a">${ESC(heading)}</h1>
          <p style="margin:0 0 18px;font-size:14.5px;color:#585e58;line-height:1.55">${intro}</p>
        </td></tr>
        <tr><td style="padding:0 28px 26px">
          <table width="100%" style="border-collapse:collapse;border-top:1px solid #e0e2de">
            ${answersTable(rec)}
          </table>
        </td></tr>
        <tr><td style="padding:16px 28px;background:#f7f7f5;border-top:1px solid #e0e2de;border-radius:0 0 4px 4px">
          <p style="margin:0;font-size:11.5px;color:#8b918b;line-height:1.5">
            Sent because feedback was submitted at hiero.in. Nothing further is needed from you.
          </p>
        </td></tr>
      </table>
    </div>`;
}

/** Fire-and-forget: a failed email must never fail the submission. */
async function sendFeedbackEmails(rec) {
    if (!transporter) {
        console.warn('[FEEDBACK] SMTP not configured; skipping emails.');
        return;
    }
    const from = `"Hiero" <${process.env.EMAIL_USER}>`;

    if (rec.email) {
        try {
            await transporter.sendMail({
                from,
                to: rec.email,
                subject: 'Your Hiero feedback — thank you',
                html: shell(
                    `Thanks${rec.name ? ', ' + ESC(rec.name.split(' ')[0]) : ''}`,
                    'Here is a copy of what you sent. If anything was wrong or you want to add to it, just reply to this email.',
                    rec
                )
            });
            console.log(`[FEEDBACK] Copy sent to tester ${rec.email}`);
        } catch (err) {
            console.error('[FEEDBACK] Tester copy failed:', err.message);
        }
    }

    const adminTo = process.env.ADMIN_EMAIL || process.env.EMAIL_USER;
    if (adminTo) {
        try {
            await transporter.sendMail({
                from,
                to: adminTo,
                replyTo: rec.email || undefined,
                subject: `Hiero feedback from ${rec.name || 'a tester'}${rec.recommend ? ' — ' + rec.recommend + '/5' : ''}`,
                html: shell(
                    'New tester feedback',
                    `From <strong>${ESC(rec.name || 'Anonymous')}</strong>${rec.email ? ' &middot; ' + ESC(rec.email) : ''}. Reply to this email to reach them directly.`,
                    rec
                )
            });
            console.log(`[FEEDBACK] Notification sent to ${adminTo}`);
        } catch (err) {
            console.error('[FEEDBACK] Admin notification failed:', err.message);
        }
    }
}

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'hiero_jwt_super_secret_key_2026';

const ADMIN_EMAILS = [
    process.env.ADMIN_EMAIL,
    'jaswanthkumarmuthoju@gmail.com',
    'hiero@test.com',
    'admin@hiero.com'
].filter(Boolean);

// Local mirror so responses survive a MongoDB outage. Testers get one shot at
// giving feedback; losing it to a transient database problem is not acceptable.
const LOCAL_STORE = path.join(__dirname, '..', 'data', 'tester-feedback.json');

function isMongoConnected() {
    return mongoose.connection && mongoose.connection.readyState === 1;
}

function readLocal() {
    try {
        if (fs.existsSync(LOCAL_STORE)) {
            return JSON.parse(fs.readFileSync(LOCAL_STORE, 'utf8')) || [];
        }
    } catch (err) {
        console.warn('[FEEDBACK] Local store read failed:', err.message);
    }
    return [];
}

function writeLocal(rows) {
    try {
        fs.mkdirSync(path.dirname(LOCAL_STORE), { recursive: true });
        fs.writeFileSync(LOCAL_STORE, JSON.stringify(rows, null, 2));
        return true;
    } catch (err) {
        console.error('[FEEDBACK] Local store write failed:', err.message);
        return false;
    }
}

function requireAdmin(req, res, next) {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) return res.status(401).json({ success: false, error: 'Sign in as an admin to view responses.' });
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        if (!ADMIN_EMAILS.includes(decoded.email)) {
            return res.status(403).json({ success: false, error: 'Admin access required.' });
        }
        req.admin = decoded;
        next();
    } catch (err) {
        return res.status(401).json({ success: false, error: 'Session expired. Sign in again.' });
    }
}

const toNum = (v) => {
    const n = parseInt(v, 10);
    return Number.isFinite(n) && n >= 1 && n <= 5 ? n : null;
};
const toStr = (v, max = 4000) => String(v == null ? '' : v).trim().slice(0, max);
// Recommendation is a 0-10 net promoter score, so 0 is a real answer and must
// not be discarded the way the 1-5 helper would discard it.
const toNps = (v) => {
    const n = parseInt(v, 10);
    return Number.isFinite(n) && n >= 0 && n <= 10 ? n : null;
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/tester-feedback — open on purpose. Testers must not need an account.
// ─────────────────────────────────────────────────────────────────────────────
router.post('/', async (req, res) => {
    try {
        const b = req.body || {};

        const improveFirst = toStr(b.improveFirst || b.fixFirst);
        if (!improveFirst) {
            return res.status(400).json({
                success: false,
                error: 'Please tell us the one thing we should improve first — it is the most useful answer on the form.'
            });
        }

        const record = {
            name: toStr(b.name, 120),
            email: toStr(b.email, 200),
            status: toStr(b.status, 80),
            specialisation: toStr(b.specialisation, 80),
            targetRole: toStr(b.targetRole, 120),

            confidenceBefore: toNum(b.confidenceBefore),
            clarityBefore: toNum(b.clarityBefore),
            biggestProblem: toStr(b.biggestProblem, 120),

            easeOfUse: toNum(b.easeOfUse),
            resumeBuilder: toNum(b.resumeBuilder),
            jdAccuracy: toNum(b.jdAccuracy),
            skillGapUseful: toNum(b.skillGapUseful),
            learningRelevant: toNum(b.learningRelevant),
            interviewRelevant: toNum(b.interviewRelevant),
            interviewRealism: toNum(b.interviewRealism),
            reportUseful: toNum(b.reportUseful),

            confidenceAfter: toNum(b.confidenceAfter),
            savedTime: toStr(b.savedTime, 80),
            wouldUseAgain: toStr(b.wouldUseAgain, 80),
            recommend: toNps(b.recommend),
            mostUseful: toStr(b.mostUseful, 80),

            improveFirst,
            anythingElse: toStr(b.anythingElse),
            userAgent: toStr(req.headers['user-agent'] || '', 500),
            submittedAt: new Date()
        };

        let savedToMongo = false;
        if (isMongoConnected()) {
            try {
                await TesterFeedback.create(record);
                savedToMongo = true;
            } catch (dbErr) {
                console.error('[FEEDBACK] Mongo write failed, falling back to local:', dbErr.message);
            }
        }

        // Always mirror locally, so a Mongo outage never silently loses a response.
        const rows = readLocal();
        rows.push({ ...record, _savedToMongo: savedToMongo });
        writeLocal(rows);

        console.log(`[FEEDBACK] Tester response stored (mongo: ${savedToMongo}) from "${record.name || 'anonymous'}"`);

        // Emails are sent after the response is already safe in storage, and
        // deliberately not awaited: a slow or failing SMTP must not make the
        // tester think their feedback was lost.
        sendFeedbackEmails(record).catch(() => {});

        return res.json({
            success: true,
            message: record.email
                ? 'Thank you — a copy is on its way to your inbox.'
                : 'Thank you — this is genuinely useful.'
        });
    } catch (err) {
        console.error('[FEEDBACK] Submit error:', err);
        return res.status(500).json({ success: false, error: 'Could not save your feedback. Please try again.' });
    }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/tester-feedback — admin only
// ─────────────────────────────────────────────────────────────────────────────
router.get('/', requireAdmin, async (req, res) => {
    try {
        let rows = [];

        if (isMongoConnected()) {
            try {
                rows = await TesterFeedback.find().sort({ submittedAt: -1 }).lean();
            } catch (dbErr) {
                console.warn('[FEEDBACK] Mongo read failed, serving local mirror:', dbErr.message);
            }
        }

        // Fall back to, or top up from, the local mirror.
        if (!rows.length) {
            rows = readLocal().sort(
                (a, b) => new Date(b.submittedAt) - new Date(a.submittedAt)
            );
        }

        const nums = (key) => rows
            .map(r => r[key])
            .filter(v => typeof v === 'number' && !Number.isNaN(v));

        const average = (key) => {
            const vals = nums(key);
            if (!vals.length) return null;
            return Math.round((vals.reduce((s, v) => s + v, 0) / vals.length) * 10) / 10;
        };

        const tally = (key) => rows.reduce((acc, r) => {
            const v = r[key];
            if (v) acc[v] = (acc[v] || 0) + 1;
            return acc;
        }, {});

        // Share of testers who scored a question 4 or 5. "82% found it useful"
        // reads far better in a pitch than "average 4.2", and is the same data.
        const positive = (key) => {
            const vals = nums(key);
            if (!vals.length) return null;
            return Math.round((vals.filter(v => v >= 4).length / vals.length) * 100);
        };

        // Net promoter: promoters (9-10) minus detractors (0-6), as a
        // percentage of all respondents. Runs -100 to +100.
        const npsScores = nums('recommend');
        const nps = npsScores.length
            ? Math.round(
                ((npsScores.filter(v => v >= 9).length - npsScores.filter(v => v <= 6).length)
                  / npsScores.length) * 100)
            : null;

        // The headline. Only testers who answered BOTH count, or the delta
        // would compare two different groups of people.
        const paired = rows.filter(r =>
            typeof r.confidenceBefore === 'number' && typeof r.confidenceAfter === 'number');
        const confidenceShift = paired.length ? {
            before: Math.round((paired.reduce((s, r) => s + r.confidenceBefore, 0) / paired.length) * 10) / 10,
            after:  Math.round((paired.reduce((s, r) => s + r.confidenceAfter, 0) / paired.length) * 10) / 10,
            improved: Math.round((paired.filter(r => r.confidenceAfter > r.confidenceBefore).length / paired.length) * 100),
            n: paired.length
        } : null;

        return res.json({
            success: true,
            total: rows.length,
            // The five numbers worth quoting, pre-computed so the dashboard and
            // any report agree rather than each deriving its own.
            headline: {
                usability:        { avg: average('easeOfUse'),         positivePct: positive('easeOfUse') },
                jdAccuracy:       { avg: average('jdAccuracy'),        positivePct: positive('jdAccuracy') },
                skillGap:         { avg: average('skillGapUseful'),    positivePct: positive('skillGapUseful') },
                mockInterview:    { avg: average('interviewRelevant'), positivePct: positive('interviewRelevant') },
                nps
            },
            confidenceShift,
            averages: {
                easeOfUse: average('easeOfUse'),
                resumeBuilder: average('resumeBuilder'),
                jdAccuracy: average('jdAccuracy'),
                skillGapUseful: average('skillGapUseful'),
                learningRelevant: average('learningRelevant'),
                interviewRelevant: average('interviewRelevant'),
                interviewRealism: average('interviewRealism'),
                reportUseful: average('reportUseful'),
                confidenceBefore: average('confidenceBefore'),
                confidenceAfter: average('confidenceAfter'),
                recommend: average('recommend')
            },
            tallies: {
                status: tally('status'),
                specialisation: tally('specialisation'),
                targetRole: tally('targetRole'),
                biggestProblem: tally('biggestProblem'),
                savedTime: tally('savedTime'),
                wouldUseAgain: tally('wouldUseAgain'),
                mostUseful: tally('mostUseful')
            },
            responses: rows
        });
    } catch (err) {
        console.error('[FEEDBACK] Fetch error:', err);
        return res.status(500).json({ success: false, error: 'Could not load responses.' });
    }
});

module.exports = router;
