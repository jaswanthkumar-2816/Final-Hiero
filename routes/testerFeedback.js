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
        ['What they tried', rec.tried],
        ['Felt like a real interview', rec.feltReal],
        ['What felt off', rec.whatWasOff],
        ['The voice', rec.voice],
        ['Follow-up quality', rec.followUps ? rec.followUps + ' / 5' : ''],
        ['Difficulty', rec.difficulty],
        ['Waiting between questions', rec.pauses],
        ['What broke', rec.broke],
        ['Report fairness', rec.reportFair ? rec.reportFair + ' / 5' : ''],
        ['Recording playback', rec.playback],
        ['Wanted from the report', rec.reportWish],
        ['Resume extraction', rec.extract ? rec.extract + ' / 5' : ''],
        ['Resume got wrong', rec.extractMissed],
        ['PDF good enough to send', rec.pdfReady],
        ['Would use again', rec.wouldUse],
        ['Would recommend', rec.recommend ? rec.recommend + ' / 5' : ''],
        ['Fix this first', rec.fixFirst],
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

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/tester-feedback — open on purpose. Testers must not need an account.
// ─────────────────────────────────────────────────────────────────────────────
router.post('/', async (req, res) => {
    try {
        const b = req.body || {};

        const fixFirst = toStr(b.fixFirst);
        if (!fixFirst) {
            return res.status(400).json({
                success: false,
                error: 'Please tell us the one thing to fix first — it is the most useful answer on the form.'
            });
        }

        const record = {
            name: toStr(b.name, 120),
            email: toStr(b.email, 200),
            tried: toStr(b.tried, 80),
            feltReal: toStr(b.feltReal, 80),
            whatWasOff: toStr(b.whatWasOff),
            voice: toStr(b.voice, 80),
            followUps: toNum(b.followUps),
            difficulty: toStr(b.difficulty, 80),
            pauses: toStr(b.pauses, 80),
            broke: toStr(b.broke),
            reportFair: toNum(b.reportFair),
            playback: toStr(b.playback, 80),
            reportWish: toStr(b.reportWish),
            extract: toNum(b.extract),
            extractMissed: toStr(b.extractMissed),
            pdfReady: toStr(b.pdfReady, 80),
            wouldUse: toStr(b.wouldUse, 80),
            recommend: toNum(b.recommend),
            fixFirst,
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
            .filter(v => typeof v === 'number' && v >= 1 && v <= 5);

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

        return res.json({
            success: true,
            total: rows.length,
            averages: {
                followUps: average('followUps'),
                reportFair: average('reportFair'),
                extract: average('extract'),
                recommend: average('recommend')
            },
            tallies: {
                tried: tally('tried'),
                feltReal: tally('feltReal'),
                voice: tally('voice'),
                difficulty: tally('difficulty'),
                pauses: tally('pauses'),
                playback: tally('playback'),
                pdfReady: tally('pdfReady'),
                wouldUse: tally('wouldUse')
            },
            responses: rows
        });
    } catch (err) {
        console.error('[FEEDBACK] Fetch error:', err);
        return res.status(500).json({ success: false, error: 'Could not load responses.' });
    }
});

module.exports = router;
