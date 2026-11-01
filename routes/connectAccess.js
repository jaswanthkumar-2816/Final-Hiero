// ============================================================
// Connect — access requests
// ============================================================
// The sign-up form used to say "email connect@hiero.in" and store nothing,
// so a company asking to join depended on somebody noticing a message. The
// request is recorded here instead, and a HIERO admin approves it.
//
// Approval is what creates the account — Connect still has no public signup,
// because a recruiter reads other people's applications. The difference is
// that the decision now has a queue, a record of who made it, and an email
// to the company either way.
// ============================================================

const express = require('express');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');

const router = express.Router();
const { requireRecruiter } = require('./connectAuth');
const AccessRequest = require('../models/AccessRequest');
const RecruiterAccount = require('../models/RecruiterAccount');
const connectMail = require('./connectMail');
const notify = require('./notify');

const PORTAL_URL = process.env.CONNECT_PORTAL_URL || 'https://connect.hiero.in';

// Only a HIERO admin decides who gets in. An ordinary recruiter account can
// read its own company's applications and nothing else, so it has no business
// granting access to a different company.
function requireAdmin(req, res, next) {
    requireRecruiter(req, res, () => {
        if (req.recruiter.role !== 'admin') {
            return res.status(403).json({ success: false, error: 'This area is for HIERO administrators.' });
        }
        next();
    });
}

function companyIdFrom(companyName) {
    const slug = String(companyName)
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
    return slug ? `c-${slug}` : `c-${Date.now()}`;
}

function nameFromEmail(email) {
    const local = String(email).split('@')[0] || 'Recruiter';
    return local.replace(/[._-]+/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

// Readable on a phone screen, because it gets typed by hand once. Random
// from crypto, not Math.random, and replaced on first sign-in anyway.
function temporaryPassword() {
    const words = ['Salon', 'Hiero', 'Connect', 'Bright', 'Anchor', 'Summit', 'Harbor', 'Lantern'];
    const word = words[crypto.randomInt(0, words.length)];
    const digits = String(crypto.randomInt(1000, 9999));
    return `${word}-${digits}-${crypto.randomBytes(2).toString('hex')}`;
}

async function sendMail(to, subject, text) {
    const transport = connectMail.mailer();
    if (!transport) return { sent: false, reason: 'Mail is not configured on this gateway.' };
    try {
        const info = await transport.sendMail({
            from: `"HIERO Connect" <${connectMail.fromAddress()}>`,
            to,
            subject,
            text
        });
        // Accepted by the mail server is not the same as delivered. Log what
        // it gave back so a message that never arrives can be traced to a
        // send that did happen.
        console.log(`📧 [Connect Access] queued to ${to} (${info.messageId || 'no id'}) — accepted:`,
            (info.accepted || []).join(', ') || 'none',
            (info.rejected || []).length ? `rejected: ${info.rejected.join(', ')}` : '');
        return { sent: true, messageId: info.messageId || null, rejected: info.rejected || [] };
    } catch (e) {
        console.error('[Connect Access] mail failed:', e.message);
        return { sent: false, reason: e.message };
    }
}

// ------------------------------------------------------------
// POST /api/connect/access/request — the public sign-up form
// ------------------------------------------------------------
router.post('/request', async (req, res) => {
    const body = req.body || {};
    const companyName = String(body.companyName || '').trim();
    const email = String(body.email || '').trim().toLowerCase();

    if (!companyName) {
        return res.status(400).json({ success: false, error: 'Company name is required.' });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({ success: false, error: 'A valid work email is required.' });
    }

    try {
        const existingAccount = await RecruiterAccount.findOne({ email });

        // A removed company still has its account, disabled, so that its job
        // posts and applicants keep an owner. That used to mean the address
        // could never ask again: the form said "thanks", created nothing, and
        // the sign-in it was asking for stayed switched off. A dead end with
        // a cheerful message on it.
        //
        // A disabled account is therefore treated as no account at all here.
        // Approving the new request switches the old one back on.
        const blockedByAccount = Boolean(existingAccount) && existingAccount.status === 'active';
        const existing = await AccessRequest.findOne({ email, status: 'pending' });

        // Only a genuinely new row is worth an email. Someone resubmitting
        // the form, or an address that already has an account, should not
        // ring the bell again.
        let waiting = null;

        if (existing) {
            existing.companyName = companyName;
            existing.lastRequestedAt = new Date();
            if (body.contactName) existing.contactName = String(body.contactName).trim();
            if (body.phone) existing.phone = String(body.phone).trim();
            if (body.industry) existing.industry = String(body.industry).trim();
            await existing.save();
        } else if (!blockedByAccount) {
            waiting = await AccessRequest.create({
                companyName,
                email,
                industry: String(body.industry || 'general').trim(),
                contactName: String(body.contactName || '').trim(),
                phone: String(body.phone || '').trim()
            });
        }

        // The same answer either way. Telling a stranger whether an address
        // already has an account turns this form into a way to find out who
        // uses Connect.
        res.json({
            success: true,
            message: 'Thanks — your request is with the HIERO team. You will get an email when your account is ready.'
        });

        // After the response, and never awaited: a company asking to join
        // should not wait on our mail server, and a mail failure must not
        // lose their request.
        if (waiting) notify.newAccessRequest(waiting);
    } catch (e) {
        console.error('[Connect Access] request failed:', e.message);
        res.status(500).json({ success: false, error: 'Could not record your request. Try again shortly.' });
    }
});

// ------------------------------------------------------------
// GET /api/connect/access/requests — the admin queue
// ------------------------------------------------------------
router.get('/requests', requireAdmin, async (req, res) => {
    const status = String(req.query.status || '').trim();
    const filter = ['pending', 'approved', 'rejected'].includes(status) ? { status } : {};
    try {
        const rows = await AccessRequest.find(filter).sort({ createdAt: -1 }).limit(200);
        const pending = await AccessRequest.countDocuments({ status: 'pending' });
        res.json({ success: true, pending, requests: rows.map(r => r.toSafeJSON()) });
    } catch (e) {
        res.status(503).json({ success: false, error: 'Could not reach the request store.' });
    }
});

// ------------------------------------------------------------
// POST /api/connect/access/requests/:id/approve
// ------------------------------------------------------------
router.post('/requests/:id/approve', requireAdmin, async (req, res) => {
    try {
        const request = await AccessRequest.findById(req.params.id);
        if (!request) return res.status(404).json({ success: false, error: 'No such request.' });
        if (request.status !== 'pending') {
            return res.status(409).json({ success: false, error: `This request was already ${request.status}.` });
        }

        const email = request.email;
        let account = await RecruiterAccount.findOne({ email });
        const password = temporaryPassword();
        const passwordHash = await bcrypt.hash(password, 12);

        if (account) {
            // Re-approving an address that already has an account resets it
            // rather than failing, so a company that lost its password is not
            // stuck waiting for someone to run a script.
            account.passwordHash = passwordHash;
            account.mustChangePassword = true;
            account.status = 'active';
            await account.save();
        } else {
            account = await RecruiterAccount.create({
                email,
                passwordHash,
                name: request.contactName || nameFromEmail(email),
                phone: request.phone || '',
                companyId: companyIdFrom(request.companyName),
                companyName: request.companyName,
                industry: request.industry || 'general',
                role: 'recruiter',
                mustChangePassword: true
            });
        }

        request.status = 'approved';
        request.decidedAt = new Date();
        request.decidedBy = req.recruiter.email;
        request.accountId = account._id.toString();
        await request.save();

        const mail = await sendMail(
            email,
            `Your HIERO Connect account for ${request.companyName}`,
            `Hello,

Your HIERO Connect account is ready.

Sign in:   ${PORTAL_URL}
Email:     ${email}
Password:  ${password}

You will be asked to choose your own password the first time you sign in.

From there you can post a role, see everyone who applies with their resume,
and invite candidates to an interview.

— HIERO Connect`
        );

        // The password is shown to the admin exactly once, and only when the
        // email did not go out. Otherwise it is never returned anywhere.
        res.json({
            success: true,
            request: request.toSafeJSON(),
            emailed: mail.sent,
            emailError: mail.sent ? undefined : mail.reason,
            temporaryPassword: mail.sent ? undefined : password
        });
    } catch (e) {
        console.error('[Connect Access] approve failed:', e.message);
        res.status(500).json({ success: false, error: 'Could not approve this request.' });
    }
});

// ------------------------------------------------------------
// POST /api/connect/access/requests/:id/resend
// ------------------------------------------------------------
// Approval emails a password, and email is not guaranteed to arrive — it
// lands in spam, or the address turns out not to exist. Approving again is
// refused because the request is no longer pending, which left a company
// approved, with an account, and no way to get into it.
//
// This issues a fresh password and sends it again. The old one stops working,
// so a copy sitting in a stranger's inbox is not left valid either.
router.post('/requests/:id/resend', requireAdmin, async (req, res) => {
    try {
        const request = await AccessRequest.findById(req.params.id);
        if (!request) return res.status(404).json({ success: false, error: 'No such request.' });
        if (request.status !== 'approved') {
            return res.status(409).json({ success: false, error: 'Only an approved request has credentials to send.' });
        }

        const account = await RecruiterAccount.findOne({ email: request.email });
        if (!account) {
            return res.status(404).json({ success: false, error: 'That account no longer exists.' });
        }

        const password = temporaryPassword();
        account.passwordHash = await bcrypt.hash(password, 12);
        account.mustChangePassword = true;
        account.status = 'active';
        await account.save();

        const mail = await sendMail(
            request.email,
            `Your HIERO Connect account for ${request.companyName}`,
            `Hello,

Here are your HIERO Connect sign-in details again. The password below replaces any earlier one.

Sign in:   ${PORTAL_URL}
Email:     ${request.email}
Password:  ${password}

You will be asked to choose your own password the first time you sign in.

— HIERO Connect`
        );

        console.log(`🔁 [Connect Access] credentials resent for ${request.email} by ${req.recruiter.email}`);
        res.json({
            success: true,
            emailed: mail.sent,
            emailError: mail.sent ? undefined : mail.reason,
            temporaryPassword: mail.sent ? undefined : password
        });
    } catch (e) {
        console.error('[Connect Access] resend failed:', e.message);
        res.status(500).json({ success: false, error: 'Could not resend the credentials.' });
    }
});

// ------------------------------------------------------------
// POST /api/connect/access/requests/:id/reject
// ------------------------------------------------------------
router.post('/requests/:id/reject', requireAdmin, async (req, res) => {
    try {
        const request = await AccessRequest.findById(req.params.id);
        if (!request) return res.status(404).json({ success: false, error: 'No such request.' });
        if (request.status !== 'pending') {
            return res.status(409).json({ success: false, error: `This request was already ${request.status}.` });
        }

        request.status = 'rejected';
        request.decidedAt = new Date();
        request.decidedBy = req.recruiter.email;
        request.note = String((req.body && req.body.note) || '').trim();
        await request.save();

        // Only tell them if there is something to tell. A bare "no" with no
        // reason is worse than silence.
        let emailed = false;
        if (request.note) {
            const mail = await sendMail(
                request.email,
                'About your HIERO Connect request',
                `Hello,

Thank you for your interest in HIERO Connect. We are not able to set up an account for ${request.companyName} at this time.

${request.note}

If you think this is a mistake, reply to this email.

— HIERO Connect`
            );
            emailed = mail.sent;
        }

        res.json({ success: true, request: request.toSafeJSON(), emailed });
    } catch (e) {
        console.error('[Connect Access] reject failed:', e.message);
        res.status(500).json({ success: false, error: 'Could not reject this request.' });
    }
});

// ------------------------------------------------------------
// DELETE /api/connect/access/requests/:id
// ------------------------------------------------------------
// Takes a company off the list. The list had become a pile: the same salon
// asked three times from three addresses, and every one of them stayed on
// screen for ever with no way to clear it.
//
// Removing an approved company also closes the door behind it. Deleting only
// the row would leave an account that still signs in and still reads its
// applications, which is the opposite of what "remove this company" looks
// like it did.
//
// The account is disabled, not deleted. Their applications and job posts
// carry their companyId, and deleting the account would orphan all of it —
// disabling stops the sign-in and keeps the record. Approving them again
// later turns it back on.
router.delete('/requests/:id', requireAdmin, async (req, res) => {
    try {
        const request = await AccessRequest.findById(req.params.id);
        if (!request) return res.status(404).json({ success: false, error: 'No such request.' });

        const email = request.email;
        const companyName = request.companyName;

        let accountDisabled = false;
        if (request.status === 'approved') {
            const account = await RecruiterAccount.findOne({ email });
            // An admin removing their own row would lock themselves out of
            // this page, and there is no second admin to undo it.
            if (account && account.role === 'admin') {
                return res.status(409).json({
                    success: false,
                    error: 'That is an admin account. Removing it would lock you out of this page.'
                });
            }
            if (account && account.status === 'active') {
                account.status = 'disabled';
                await account.save();
                accountDisabled = true;
            }
        }

        await AccessRequest.deleteOne({ _id: request._id });
        console.log(`[Connect Access] ${req.recruiter.email} removed ${companyName} <${email}>` +
            (accountDisabled ? ' and disabled its sign-in' : ''));

        res.json({ success: true, companyName, email, accountDisabled });
    } catch (e) {
        console.error('[Connect Access] remove failed:', e.message);
        res.status(500).json({ success: false, error: 'Could not remove this company.' });
    }
});

module.exports = router;
