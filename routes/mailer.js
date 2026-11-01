// ============================================================
// How mail actually leaves this server
// ============================================================
// Render's free plan blocks outbound traffic to the SMTP ports (25, 465 and
// 587), so nodemailer talking to Gmail hangs until it times out and no mail
// has ever left production. It works on a laptop, which is exactly why it
// went unnoticed: every test passed somewhere that is not blocked.
//
// Ordinary web traffic on 443 is not blocked. So when RESEND_API_KEY is set
// we hand the message to an HTTPS API instead, and nothing about where the
// server runs has to change.
//
// Both paths present the same object as nodemailer — sendMail(message) that
// resolves to { messageId } — so every caller is unchanged.
//
// Setting it up:
//   1. resend.com, free, no card. Create an API key.
//   2. Verify hiero.in there (it gives you DNS records for GoDaddy).
//      Until a domain is verified Resend only delivers to your own address,
//      which is enough to test but not to send a company its password.
//   3. On Render set:
//        RESEND_API_KEY=re_...
//        MAIL_FROM=HIERO Connect <noreply@hiero.in>
//
// With no key set, this falls back to Gmail over SMTP, which is still the
// right thing on a developer machine.

const fs = require('fs');
const nodemailer = require('nodemailer');

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const MAIL_FROM = process.env.MAIL_FROM;
const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;

const SEND_TIMEOUT_MS = 20000;

// Resend wants the bytes inline; nodemailer callers pass a path. Read it here
// so no caller has to know which transport it is talking to.
function encodeAttachments(attachments) {
    return (attachments || []).map(a => {
        const buffer = a.content
            ? Buffer.from(a.content)
            : (a.path ? fs.readFileSync(a.path) : null);
        if (!buffer) return null;
        return { filename: a.filename || 'attachment', content: buffer.toString('base64') };
    }).filter(Boolean);
}

// "HIERO Connect" <x@y> or x@y — Resend takes either, but it must be on a
// domain verified in that account. A gmail.com address will be refused.
function resolveFrom(messageFrom) {
    if (!MAIL_FROM) return messageFrom || (EMAIL_USER ? `HIERO Connect <${EMAIL_USER}>` : null);

    // The caller's display name is worth keeping — a candidate should see the
    // salon's name in their inbox — but the address has to be one the API is
    // allowed to send from, so only that part is replaced.
    const name = /^\s*"?([^"<]+?)"?\s*</.exec(String(messageFrom || ''));
    const address = /<([^>]+)>/.exec(MAIL_FROM);
    if (name && address) return `"${name[1].trim()}" <${address[1]}>`;
    return MAIL_FROM;
}

function httpTransport() {
    return {
        async sendMail(message) {
            const from = resolveFrom(message.from);
            if (!from) throw new Error('No from address. Set MAIL_FROM.');

            const to = Array.isArray(message.to)
                ? message.to
                : String(message.to || '').split(',').map(s => s.trim()).filter(Boolean);
            if (!to.length) throw new Error('No recipient.');

            const payload = {
                from,
                to,
                subject: message.subject || '',
                text: message.text || undefined,
                html: message.html || undefined
            };
            if (message.replyTo) payload.reply_to = message.replyTo;

            const attachments = encodeAttachments(message.attachments);
            if (attachments.length) payload.attachments = attachments;

            // Without this an unreachable API would hang the request the same
            // way blocked SMTP did, which is the problem we are fixing.
            const abort = new AbortController();
            const timer = setTimeout(() => abort.abort(), SEND_TIMEOUT_MS);

            let res;
            try {
                res = await fetch('https://api.resend.com/emails', {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${RESEND_API_KEY}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(payload),
                    signal: abort.signal
                });
            } catch (e) {
                throw new Error(e.name === 'AbortError' ? 'Mail API timed out.' : e.message);
            } finally {
                clearTimeout(timer);
            }

            const body = await res.json().catch(() => ({}));
            if (!res.ok) {
                // Say what the API said. "Could not send" on its own has cost
                // us a day already.
                throw new Error(body.message || body.error || `Mail API returned ${res.status}.`);
            }
            return { messageId: body.id || null };
        }
    };
}

let smtp = null;
function smtpTransport() {
    if (!smtp) {
        smtp = nodemailer.createTransport({
            service: 'gmail',
            auth: { user: EMAIL_USER, pass: EMAIL_PASS },
            // Fail in twenty seconds rather than two minutes. Where SMTP is
            // blocked the caller still fails, but it finds out quickly and
            // the admin sees the password to pass on by hand.
            connectionTimeout: SEND_TIMEOUT_MS,
            greetingTimeout: SEND_TIMEOUT_MS,
            socketTimeout: SEND_TIMEOUT_MS
        });
    }
    return smtp;
}

function transport() {
    if (RESEND_API_KEY) return httpTransport();
    if (EMAIL_USER && EMAIL_PASS) return smtpTransport();
    return null;
}

function bareAddress() {
    const full = describe().from;
    if (!full) return null;
    const inAngles = /<([^>]+)>/.exec(full);
    return (inAngles ? inAngles[1] : full).trim();
}

function describe() {
    if (RESEND_API_KEY) return { configured: true, via: 'https', from: resolveFrom(null) };
    if (EMAIL_USER && EMAIL_PASS) return { configured: true, via: 'smtp', from: EMAIL_USER };
    return { configured: false, via: null, from: null };
}

module.exports = { transport, describe, bareAddress };
