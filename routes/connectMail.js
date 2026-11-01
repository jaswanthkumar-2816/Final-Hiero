// ============================================================
// Connect — recruiter mail
// ============================================================
// Sending the interview invite is the last step of the hiring loop and the
// one that was missing: the portal could shortlist a candidate but nothing
// ever reached their inbox.
//
// Every route here is recruiter-authenticated. The mail goes out from the
// HIERO mailbox with the recruiter's own address as Reply-To, so a candidate
// replying talks to the company, not to us.
// ============================================================

const express = require('express');
const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');

const router = express.Router();
const { requireRecruiter } = require('./connectAuth');

const APPS_FILE = path.join(__dirname, '..', 'data', 'applications.json');

const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;

// Built once. Gmail is what the rest of the gateway already uses for signup
// and verification mail, so there is no second mail setup to keep working.
let transporter = null;
function mailer() {
    if (!EMAIL_USER || !EMAIL_PASS) return null;
    if (!transporter) {
        transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: { user: EMAIL_USER, pass: EMAIL_PASS }
        });
    }
    return transporter;
}

function loadApps() {
    try {
        if (fs.existsSync(APPS_FILE)) return JSON.parse(fs.readFileSync(APPS_FILE, 'utf8'));
    } catch (e) {
        console.error('[Connect Mail] Could not read applications.json:', e.message);
    }
    return [];
}

function saveApps(apps) {
    try {
        fs.writeFileSync(APPS_FILE, JSON.stringify(apps, null, 2), 'utf8');
    } catch (e) {
        console.error('[Connect Mail] Could not write applications.json:', e.message);
    }
}

// What a mail of each kind means for the application's state. The recruiter
// sends one message; the pipeline moves with it, so the inbox and the
// candidate never disagree about where things stand.
const KINDS = {
    interview: { status: 'interview', stamp: 'interviewMailSentAt' },
    selection: { status: 'selected', stamp: 'selectionNotifiedAt' },
    rejection: { status: 'rejected', stamp: 'rejectionNotifiedAt' },
    message: { status: null, stamp: 'lastContactedAt' }
};

function escapeHtml(value) {
    return String(value || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

// The recruiter types plain text. Gmail renders the HTML part, so the line
// breaks they typed have to survive as line breaks.
function asHtml(body) {
    return `<div style="font-family:Inter,Arial,sans-serif;font-size:15px;line-height:1.6;color:#111;white-space:pre-wrap">${escapeHtml(body)}</div>`;
}

// POST /api/connect/mail/send
router.post('/send', requireRecruiter, async (req, res) => {
    const body = req.body || {};
    const kind = KINDS[body.kind] ? body.kind : 'message';
    const to = String(body.to || '').trim().toLowerCase();
    const subject = String(body.subject || '').trim();
    const text = String(body.body || '').trim();

    if (!to || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
        return res.status(400).json({ success: false, error: 'A valid candidate email is required.' });
    }
    if (!subject || !text) {
        return res.status(400).json({ success: false, error: 'Subject and message are both required.' });
    }

    const transport = mailer();
    if (!transport) {
        return res.status(503).json({
            success: false,
            error: 'Mail is not configured on the gateway (EMAIL_USER / EMAIL_PASS are missing).'
        });
    }

    const companyName = req.recruiter.companyName || 'HIERO Connect';
    let messageId = null;
    try {
        const info = await transport.sendMail({
            from: `"${companyName}" <${EMAIL_USER}>`,
            replyTo: req.recruiter.email,
            to,
            subject,
            text,
            html: asHtml(text)
        });
        messageId = info.messageId || null;
    } catch (e) {
        console.error('[Connect Mail] send failed:', e.message);
        return res.status(502).json({ success: false, error: `Could not send the mail: ${e.message}` });
    }

    // Record it against the application so the inbox shows what was sent and
    // when, and so a second click does not look like the first.
    let application = null;
    const apps = loadApps();
    const match = apps.find(a =>
        (body.applicationId && a.id === body.applicationId) ||
        (!body.applicationId && String(a.email || '').toLowerCase() === to &&
            (!body.opportunityId || a.opportunityId === body.opportunityId))
    );
    if (match) {
        const rule = KINDS[kind];
        if (rule.status) match.status = rule.status;
        match[rule.stamp] = new Date().toISOString();
        match.lastMailSubject = subject;
        if (body.scheduledAt) match.interviewAt = body.scheduledAt;
        match.notes = `${kind === 'message' ? 'Message' : kind[0].toUpperCase() + kind.slice(1)} mail sent to ${to}.`;
        saveApps(apps);
        application = match;
    }

    console.log(`📤 [Connect Mail] ${kind} mail sent to ${to} by ${req.recruiter.email} (${companyName})`);
    res.json({ success: true, messageId, application });
});

// GET /api/connect/mail/health — does this gateway have a mailbox at all?
// The portal asks before offering a Send button it cannot honour.
router.get('/health', requireRecruiter, (req, res) => {
    res.json({ success: true, configured: Boolean(EMAIL_USER && EMAIL_PASS), from: EMAIL_USER || null });
});

module.exports = router;
// Shared so the access-request routes can send an account's first email
// without standing up a second mail setup that can drift from this one.
module.exports.mailer = mailer;
module.exports.fromAddress = () => EMAIL_USER || null;
