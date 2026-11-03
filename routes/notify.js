// ============================================================
// Telling the person who has to act
// ============================================================
// Two things used to happen in silence. A candidate applied and the company
// was never told; a company asked to join and HIERO was never told. Both
// landed correctly in a list, and the list was the problem: it only works for
// somebody who thinks to go and look.
//
// A salon owner is cutting hair. He is not refreshing a web page.
//
// Everything here is best effort and nothing here is awaited by the request
// that triggered it. A candidate's application must be recorded whether or
// not Gmail is reachable, and the applicant should never wait on SMTP to see
// that their application went through.

const path = require('path');
const fs = require('fs');

const connectMail = require('./connectMail');
const RecruiterAccount = require('../models/RecruiterAccount');

const PORTAL_URL = process.env.CONNECT_PORTAL_URL || 'https://connect.hiero.in';
const RESUME_DIR = path.join(__dirname, '..', 'data', 'resumes');

// Gmail rejects very large attachments outright, and a resume that big is
// unusual enough to be worth a link instead of a failed send.
const MAX_ATTACHMENT_BYTES = 7 * 1024 * 1024;

function send({ to, subject, text, attachments }) {
    const transport = connectMail.mailer();
    const from = connectMail.fromAddress();
    if (!transport || !from) {
        console.warn('[Notify] Mail is not configured; skipped:', subject);
        return Promise.resolve(false);
    }
    return transport
        .sendMail({
            from: `"HIERO Connect" <${from}>`,
            to,
            subject,
            text,
            attachments: attachments && attachments.length ? attachments : undefined
        })
        .then(() => true)
        .catch(e => {
            console.error('[Notify] Could not send:', subject, '—', e.message);
            return false;
        });
}

// A resume that is on this disk travels with the email. The whole point is
// that the owner can read it on the phone in his hand without signing in to
// anything.
function resumeAttachment(resumeUrl) {
    try {
        if (!resumeUrl) return null;
        const name = decodeURIComponent(String(resumeUrl).split('/').pop() || '');
        if (!name || name.includes('/') || name.includes('..')) return null;
        const file = path.join(RESUME_DIR, name);
        if (!file.startsWith(RESUME_DIR)) return null;
        if (!fs.existsSync(file)) return null;
        if (fs.statSync(file).size > MAX_ATTACHMENT_BYTES) return null;
        return { filename: name.replace(/^\d+-/, ''), path: file };
    } catch (e) {
        return null;
    }
}

// ------------------------------------------------------------
// Someone applied
// ------------------------------------------------------------
async function newApplication(application, opportunity) {
    try {
        const companyId = (application && application.companyId) || (opportunity && opportunity.companyId);
        const companyName = (opportunity && opportunity.companyName) || (application && application.companyName) || 'your company';
        if (!companyId) return;

        // Everyone who can act on it. A salon with two managers on the
        // account should not depend on which of them happens to log in.
        const accounts = await RecruiterAccount.find({ companyId, status: 'active' });
        if (!accounts.length) {
            console.warn(`[Notify] ${companyName} has no active account; nobody to tell about a new application.`);
            return;
        }

        const role = (opportunity && opportunity.title) || application.jobTitle || 'your opening';
        const name = application.studentName || 'A candidate';
        const attachment = resumeAttachment(application.resumeUrl);
        const skills = (application.profile && application.profile.skills) || application.skills || [];

        const lines = [
            `${name} has applied for ${role} at ${companyName}.`,
            '',
            `Name:   ${name}`,
            `Email:  ${application.email || '—'}`,
            application.phone ? `Phone:  ${application.phone}` : null,
            skills.length ? `Skills: ${skills.join(', ')}` : null,
            '',
            attachment
                ? 'Their resume is attached.'
                : 'Their resume is on their application in the portal.',
            '',
            `Open the application:  ${PORTAL_URL}/industry/applications`,
            '',
            'From there you can read the resume, invite them to an interview,',
            'or reply to them directly.',
            '',
            '— HIERO Connect'
        ].filter(line => line !== null);

        const to = accounts.map(a => a.email).join(', ');
        const sent = await send({
            to,
            subject: `New application — ${name} for ${role}`,
            text: lines.join('\n'),
            attachments: attachment ? [attachment] : undefined
        });
        if (sent) console.log(`[Notify] Told ${to} that ${name} applied for ${role}.`);
    } catch (e) {
        console.error('[Notify] newApplication failed:', e.message);
    }
}

// ------------------------------------------------------------
// A company asked to join
// ------------------------------------------------------------
async function newAccessRequest(request) {
    try {
        // ADMIN_EMAIL wins when it is set; otherwise every active admin is
        // told, so this does not depend on one address being configured.
        const wanted = String(process.env.ADMIN_EMAIL || '').trim().toLowerCase();
        const admins = wanted
            ? await RecruiterAccount.find({ email: wanted, role: 'admin', status: 'active' })
            : await RecruiterAccount.find({ role: 'admin', status: 'active' });

        if (!admins.length) {
            console.warn('[Notify] No active admin to tell about a new access request.');
            return;
        }

        const lines = [
            `${request.companyName} has asked for a HIERO Connect account.`,
            '',
            `Company:  ${request.companyName}`,
            `Email:    ${request.email}`,
            request.contactName ? `Contact:  ${request.contactName}` : null,
            request.phone ? `Phone:    ${request.phone}` : null,
            request.industry ? `Trade:    ${request.industry}` : null,
            '',
            `Approve or reject:  ${PORTAL_URL}/admin/access`,
            '',
            'Approving creates their account and emails them a password.',
            '',
            '— HIERO Connect'
        ].filter(line => line !== null);

        const to = admins.map(a => a.email).join(', ');
        const sent = await send({
            to,
            subject: `Waiting to be let in — ${request.companyName}`,
            text: lines.join('\n')
        });
        if (sent) console.log(`[Notify] Told ${to} that ${request.companyName} is waiting.`);
    } catch (e) {
        console.error('[Notify] newAccessRequest failed:', e.message);
    }
}


// ------------------------------------------------------------
// An interview finished
// ------------------------------------------------------------
// The scorecard existed only behind a button in the portal, so a recruiter
// learned a candidate had been interviewed by going and looking — the same
// problem the application alert fixes, one step further along.
//
// Scores and the recommendation only. The recording and the transcript stay
// with the candidate: the company asked them questions, it did not buy the
// tape.
async function interviewFinished(session) {
    try {
        const userId = String((session && session.userId) || '');
        if (!userId.startsWith('connect-app-')) return;          // not a Connect interview
        const applicationId = userId.slice('connect-app-'.length);

        const store = require('./store');
        const app = store.read('applications').find(a => a.id === applicationId);
        if (!app) return;

        const accounts = await RecruiterAccount.find({ companyId: app.companyId, status: 'active' });
        if (!accounts.length) return;

        const card = session.scorecard || session.evaluation || {};
        const scores = card.scores || {};
        const scoreLines = Object.keys(scores)
            .filter(k => typeof scores[k] === 'number')
            .map(k => `  ${k.replace(/([A-Z])/g, ' $1').toLowerCase().trim()}: ${scores[k]}`);

        const name = app.studentName || 'The candidate';
        const role = app.jobTitle || 'your opening';

        const lines = [
            `${name} has finished the interview for ${role}.`,
            '',
            typeof card.overall === 'number' ? `Overall: ${card.overall} of 100` : null,
            card.recommendation ? `Recommendation: ${card.recommendation}` : null,
            scoreLines.length ? '' : null,
            ...scoreLines,
            card.summary ? '' : null,
            card.summary || null,
            '',
            'A score supports your decision. It does not replace meeting them.',
            '',
            `See the full result:  ${PORTAL_URL}/industry/applications`,
            '',
            '— HIERO Connect'
        ].filter(line => line !== null);

        const to = accounts.map(a => a.email).join(', ');
        const sent = await send({
            to,
            subject: `Interview finished — ${name} for ${role}`,
            text: lines.join('\n')
        });
        if (sent) console.log(`[Notify] Told ${to} that ${name} finished the interview.`);
    } catch (e) {
        console.error('[Notify] interviewFinished failed:', e.message);
    }
}

module.exports = { newApplication, newAccessRequest, interviewFinished };
