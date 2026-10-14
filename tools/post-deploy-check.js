#!/usr/bin/env node
/* Post-deploy check for Hiero.
 *
 *   node tools/post-deploy-check.js                 # checks https://hiero.in
 *   node tools/post-deploy-check.js http://localhost:2816
 *
 * Read-only: it fetches pages and makes one unauthenticated API call. It
 * creates nothing and changes nothing. Run it against your own deployment.
 */

const jwt = require('jsonwebtoken');

const BASE = (process.argv[2] || 'https://hiero.in').replace(/\/+$/, '');

// The value every route falls back to when JWT_SECRET is unset. It is in the
// source, so if the deployment accepts a token signed with it, anyone who can
// read the repository can sign in as any user.
const PUBLISHED_FALLBACK = 'hiero_jwt_super_secret_key_2026';

const results = [];
function record(ok, name, detail) {
    results.push({ ok, name, detail });
    const mark = ok === true ? '  PASS' : ok === false ? '  FAIL' : '  WARN';
    console.log(`${mark}  ${name}${detail ? '\n        ' + detail : ''}`);
}

async function get(path, headers) {
    const res = await fetch(BASE + path, {
        headers: headers || {},
        redirect: 'manual'
    });
    return { status: res.status, res };
}

async function main() {
    console.log(`\nChecking ${BASE}\n${'-'.repeat(52)}`);

    // 1 — the site is up at all
    try {
        const { status } = await get('/');
        record(status < 500, 'Site responds', `GET / returned ${status}`);
    } catch (e) {
        record(false, 'Site responds', e.message);
        return done();
    }

    // 2 — the session fix is actually deployed
    try {
        const { status, res } = await get('/auth-session.js');
        const body = status === 200 ? await res.text() : '';
        const present = body.includes('X-Refreshed-Token');
        record(status === 200 && present, 'auth-session.js is served',
            status !== 200 ? `got ${status} — the login fix is NOT live`
                           : present ? 'contains the refresh handler'
                                     : 'served, but is an old copy without the refresh handler');
    } catch (e) {
        record(false, 'auth-session.js is served', e.message);
    }

    // 2b — the pages must actually REFERENCE it. Serving the file proves
    // nothing: the repo has several copies of each page and only the ones
    // under hiero-prototype/.../public are served, so a fix applied to the
    // wrong copy deploys cleanly and changes nothing a user sees.
    for (const p of ['/', '/index.html', '/dashboard.html']) {
        try {
            const { status, res } = await get(p);
            const body = status === 200 ? await res.text() : '';
            const refs = body.includes('auth-session.js');
            record(status === 200 && refs, `${p} loads auth-session.js`,
                status !== 200 ? `got ${status}`
                               : refs ? null
                                      : 'page served but does NOT reference it — the session fix is inert here');
        } catch (e) {
            record(false, `${p} loads auth-session.js`, e.message);
        }
    }

    // 2c — logout must not leave jwtToken behind, or every later page revives
    // the dead session and bounces the user back to the login screen.
    try {
        const { status, res } = await get('/logout.html');
        if (status === 200) {
            const body = await res.text();
            const t = (body.match(/removeItem\(['"]token['"]\)/g) || []).length;
            const j = (body.match(/removeItem\(['"]jwtToken['"]\)/g) || []).length;
            record(t === 0 || t === j, 'logout clears both token keys',
                t === j ? `${t} cleared, both keys` :
                `clears token x${t} but jwtToken x${j} — logging out leaves a dead token that bounces users to login`);
        } else {
            record(null, 'logout clears both token keys', `/logout.html returned ${status}`);
        }
    } catch (e) {
        record(null, 'logout clears both token keys', e.message);
    }

    // 3 — the policy pages
    for (const p of ['/privacy.html', '/terms.html', '/legal.css', '/hiero-mark.png']) {
        try {
            const { status } = await get(p);
            record(status === 200, `${p}`, status === 200 ? null : `got ${status}`);
        } catch (e) {
            record(false, p, e.message);
        }
    }

    // 4 — the one that matters: is the published fallback secret in use?
    const forged = jwt.sign(
        { userId: 99, name: 'deploy-check', email: 'deploy-check@invalid.test' },
        PUBLISHED_FALLBACK,
        { expiresIn: '5m' }
    );
    try {
        const { status } = await get('/api/me', { Authorization: `Bearer ${forged}` });
        if (status === 401 || status === 403) {
            record(true, 'JWT_SECRET is set in the environment',
                `a token signed with the published fallback was rejected (${status})`);
        } else if (status === 404) {
            record(false, 'JWT_SECRET is NOT set — using the published fallback',
                'the forged token passed verification (404 = token accepted, user absent).\n        '
                + 'Anyone who can read the repo can sign in as any user. Set JWT_SECRET in Render now.');
        } else if (status === 200) {
            record(false, 'JWT_SECRET is NOT set — using the published fallback',
                'the forged token was accepted and resolved to a real account (200).\n        '
                + 'Set JWT_SECRET in Render immediately.');
        } else {
            record(null, 'JWT_SECRET check inconclusive', `/api/me returned ${status}`);
        }
    } catch (e) {
        record(null, 'JWT_SECRET check inconclusive', e.message);
    }

    // 5 — a garbage token must always be refused
    try {
        const { status } = await get('/api/me', { Authorization: 'Bearer not.a.token' });
        record(status === 401 || status === 403, 'Invalid tokens are refused',
            `got ${status}`);
    } catch (e) {
        record(null, 'Invalid tokens are refused', e.message);
    }

    done();
}

function done() {
    const fails = results.filter(r => r.ok === false).length;
    const warns = results.filter(r => r.ok === null).length;
    console.log('-'.repeat(52));
    console.log(fails === 0
        ? `All clear${warns ? ` (${warns} inconclusive)` : ''}.\n`
        : `${fails} problem${fails > 1 ? 's' : ''} found — see FAIL above.\n`);
    process.exit(fails === 0 ? 0 : 1);
}

main().catch(e => { console.error('check crashed:', e.message); process.exit(2); });
