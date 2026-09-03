/**
 * HIERO — Email Service
 * Single source of truth for all email sending.
 */

const nodemailer = require('nodemailer');

let transporter = null;

function getTransporter() {
    if (transporter) return transporter;

    const { EMAIL_USER, EMAIL_PASS } = process.env;
    if (!EMAIL_USER || !EMAIL_PASS) {
        console.warn('⚠️  Email not configured (missing EMAIL_USER/EMAIL_PASS)');
        return null;
    }

    transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: { user: EMAIL_USER, pass: EMAIL_PASS },
    });
    return transporter;
}

async function sendEmail({ to, subject, html, text }) {
    const t = getTransporter();
    if (!t) {
        console.warn('[Email] Skipped — no transporter configured');
        return false;
    }

    try {
        await t.sendMail({
            from: process.env.EMAIL_USER,
            to,
            subject,
            html,
            text,
        });
        return true;
    } catch (err) {
        console.error('[Email] Failed:', err.message);
        return false;
    }
}

module.exports = { sendEmail };
