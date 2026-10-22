/**
 * HIERO — THEME SERVICE
 * =============================================================================
 * The single source of truth for Hiero's colour and type, owned by the backend
 * so it cannot drift into copies. (It already had: `theme.js` existed twice,
 * under four different localStorage keys and three different switching
 * mechanisms, and nothing read anyone else's.)
 *
 * WHAT IT SERVES
 *   GET /theme/hiero.css     the stylesheet, generated from TOKENS below
 *   GET /theme/hiero.js      the client engine (routes/theme-client.js)
 *   GET /theme/tokens.json   the raw tokens, for tooling or a design doc
 *
 * IN EVERY PAGE'S <head>, BEFORE ANY OTHER STYLESHEET OR <style>:
 *
 *     <link rel="stylesheet" href="/theme/hiero.css">
 *     <script src="/theme/hiero.js"></script>
 *
 *   The script must NOT be deferred -- it has to run before the first paint or
 *   a dark-mode user gets a white flash on every page load.
 *
 * TO CHANGE A COLOUR
 *   Edit TOKENS below. Nothing else. Every token is defined twice, once per
 *   theme; a token with only a light value silently stays light in dark mode
 *   and looks broken. The CSS is regenerated on each request, so a change is
 *   live on the next page load with no build step.
 *
 * DO NOT add page-specific values here. If only one page needs it, it belongs
 * in that page.
 */

const express = require('express');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const router = express.Router();

/* ===========================================================================
   TOKENS — the part that gets maintained
   ========================================================================= */

const FONTS = {
    '--font-display': '"Fraunces", Georgia, "Times New Roman", serif',
    '--font-body':    '"Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    '--font-mono':    'ui-monospace, "SF Mono", Menlo, Consolas, monospace'
};

const TOKENS = {
    light: {
        // Brand
        //
        // In LIGHT mode --primary is the readable green, not the neon one.
        // Pages use var(--primary) for text constantly -- scores, labels,
        // headings -- and #07e219 on white is 1.76:1, effectively invisible.
        // Since CSS cannot tell a text colour from a fill, the token itself
        // has to be the readable value here; a deep green also simply looks
        // better on white than neon does. Use --primary-vivid where the bright
        // green is genuinely wanted (a glow, a lit indicator).
        '--primary':        '#0a7d16',   // readable green: text, fills, borders
        '--primary-vivid':  '#07e219',   // the neon brand green, for glows
        '--primary-strong': '#086512',   // pressed/hover state of a filled button
        // The brand green is ~1.9:1 on white -- unreadable as text. This is
        // ~4.6:1. Use it for any green that carries words.
        '--primary-ink':    '#0a7d16',
        '--primary-soft':   'rgba(7, 226, 25, 0.10)',
        '--primary-ring':   'rgba(7, 226, 25, 0.32)',

        // Surfaces
        '--bg-pure':        '#ffffff',
        '--bg-sunken':      '#f6f8f7',
        '--surface':        '#ffffff',
        '--surface-2':      '#f2f5f3',
        '--nav-bg':         'rgba(255, 255, 255, 0.82)',

        // Cards & borders
        '--card-bg':        'rgba(0, 0, 0, 0.02)',
        '--card-hover-bg':  'rgba(0, 0, 0, 0.04)',
        '--card-border':    'rgba(0, 0, 0, 0.08)',
        '--border-soft':    'rgba(0, 0, 0, 0.05)',
        '--border-strong':  'rgba(0, 0, 0, 0.16)',

        // Text
        '--text-main':      '#111418',
        '--text-muted':     '#5b6470',
        // Was #8a929c, which is only 3.15:1 on white -- below the 4.5:1
        // readable threshold, so captions and metadata were washed out.
        // 4.73:1, same cool-grey hue.
        '--text-subtle':    '#6c747e',
        '--text-inverse':   '#ffffff',   // text sitting ON --primary

        // Status
        '--success':        '#0a7d16',
        '--warning':        '#9a6400',
        '--danger':         '#b3261e',
        '--info':           '#0f6156',

        // Incidentals
        '--icon-color':     '#0a7d16',
        '--dot-color':      'rgba(0, 0, 0, 0.05)',
        '--shadow-sm':      '0 1px 2px rgba(0, 0, 0, 0.06)',
        '--shadow-md':      '0 4px 16px rgba(0, 0, 0, 0.08)',
        '--shadow-lg':      '0 12px 40px rgba(0, 0, 0, 0.12)'
    },

    dark: {
        // On a dark ground the neon green IS readable (11:1), so dark mode
        // keeps it as-is.
        '--primary':        '#07e219',
        '--primary-vivid':  '#07e219',
        '--primary-strong': '#2bf03c',
        // Lighter here: on a dark ground the darker green fails contrast.
        '--primary-ink':    '#4ef05d',
        '--primary-soft':   'rgba(7, 226, 25, 0.14)',
        '--primary-ring':   'rgba(7, 226, 25, 0.42)',

        '--bg-pure':        '#0a0c0a',
        '--bg-sunken':      '#060806',
        '--surface':        '#121612',
        '--surface-2':      '#1a201a',
        '--nav-bg':         'rgba(10, 12, 10, 0.82)',

        '--card-bg':        'rgba(255, 255, 255, 0.03)',
        '--card-hover-bg':  'rgba(255, 255, 255, 0.06)',
        '--card-border':    'rgba(255, 255, 255, 0.10)',
        '--border-soft':    'rgba(255, 255, 255, 0.07)',
        '--border-strong':  'rgba(255, 255, 255, 0.22)',

        '--text-main':      '#f2f4f2',
        '--text-muted':     '#a2aaa4',
        '--text-subtle':    '#747d77',
        '--text-inverse':   '#04140a',

        '--success':        '#4ef05d',
        '--warning':        '#f0c050',
        '--danger':         '#ff7a70',
        '--info':           '#5ec9b8',

        '--icon-color':     '#ffffff',
        '--dot-color':      'rgba(255, 255, 255, 0.05)',
        '--shadow-sm':      '0 1px 2px rgba(0, 0, 0, 0.5)',
        '--shadow-md':      '0 4px 16px rgba(0, 0, 0, 0.55)',
        '--shadow-lg':      '0 12px 40px rgba(0, 0, 0, 0.65)'
    }
};

/* ===========================================================================
   CSS GENERATION
   ========================================================================= */

/** Fails loudly at boot rather than shipping a half-dark page. */
function assertTokenParity() {
    const l = Object.keys(TOKENS.light);
    const d = Object.keys(TOKENS.dark);
    const missingDark = l.filter(k => !d.includes(k));
    const missingLight = d.filter(k => !l.includes(k));
    if (missingDark.length || missingLight.length) {
        throw new Error(
            '[THEME] Tokens must be defined in BOTH themes. ' +
            (missingDark.length ? 'Missing from dark: ' + missingDark.join(', ') + '. ' : '') +
            (missingLight.length ? 'Missing from light: ' + missingLight.join(', ') + '.' : '')
        );
    }
}
assertTokenParity();

const declare = (obj, indent = '    ') =>
    Object.entries(obj).map(([k, v]) => `${indent}${k}: ${v};`).join('\n');

function buildCss() {
    return `@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

/* Generated by routes/theme.js — do not edit this output.
   Change colours in TOKENS inside routes/theme.js instead. */

/* LIGHT — the default. Hiero's brand is white and green; dark is the option. */
:root {
    color-scheme: light;
${declare(TOKENS.light)}

${declare(FONTS)}
}

/* DARK */
:root[data-theme="dark"] {
    color-scheme: dark;
${declare(TOKENS.dark)}
}

/* NO-JAVASCRIPT FALLBACK.
   Only applies when the engine has not run -- it always writes a data-theme
   value -- so this can never fight the user's actual choice. */
@media (prefers-color-scheme: dark) {
    :root:not([data-theme]) {
        color-scheme: dark;
${declare(TOKENS.dark, '        ')}
    }
}

/* PAGE BACKGROUND.
   On html, not body, and at the lowest possible specificity, so ANY rule a
   page writes beats it. It exists because several pages set their body to
   transparent in light mode: with html and body both transparent nothing
   paints the page at all, the browser's own canvas shows through, and the
   result was a dark page with white cards floating on it. This fills in only
   when nothing else has. */
html {
    background-color: var(--bg-pure);
    color: var(--text-main);
}

/* BRAND TYPE.
   Loaded here so a page gets the typefaces by connecting the theme, rather
   than each page remembering its own font <link>. */
body {
    font-family: var(--font-body);
}
h1, h2, h3, h4, h5, h6 {
    font-family: var(--font-display);
}

/* LIGHT-MODE COMPATIBILITY LAYER.
   Hiero's pages were built dark, using utility classes that mean "pale text
   for a dark background" -- text-slate-200, text-emerald-300, text-amber-400
   and so on. On white those are invisible or nearly so, and they appear in
   hundreds of places, so fixing them page by page would be endless and would
   break dark mode. Instead each class is remapped once, here, for light mode
   only. Dark mode never sees these rules.

   text-white is deliberately NOT remapped: it is usually correct, sitting on a
   coloured button. Those are handled individually where they are wrong. */
:root[data-theme="light"] {
    /* Pale greys -> real text colours */
    .text-slate-100, .text-slate-200, .text-gray-100, .text-gray-200,
    .text-zinc-100,  .text-zinc-200,  .text-neutral-100, .text-neutral-200 { color: var(--text-main); }

    .text-slate-300, .text-slate-400, .text-gray-300, .text-gray-400,
    .text-zinc-300,  .text-zinc-400,  .text-neutral-300, .text-neutral-400 { color: var(--text-muted); }

    .text-slate-500, .text-gray-500, .text-zinc-500 { color: var(--text-subtle); }

    /* Pastels tuned for a dark ground -> their readable equivalents */
    .text-emerald-200, .text-emerald-300, .text-emerald-400,
    .text-green-300,   .text-green-400                      { color: var(--success); }
    .text-amber-200,   .text-amber-300,   .text-amber-400,
    .text-yellow-300,  .text-yellow-400                      { color: var(--warning); }
    .text-red-300,     .text-red-400,     .text-rose-300,
    .text-rose-400                                            { color: var(--danger); }
    .text-sky-300,     .text-sky-400,     .text-blue-300,
    .text-blue-400,    .text-cyan-300,    .text-cyan-400      { color: var(--info); }

    /* The brand green is a fill colour; as text on white it is 1.76:1. */
    .text-primary { color: var(--primary-ink); }
}

/* NOTHING ELSE ON PURPOSE.
   An earlier draft set a body background on html[data-theme]. That selector
   outranks the plain body rule most pages use,
   so simply linking this file would have forced every deliberately dark page
   -- the interview room, the landing splash -- to white. A theme base hands
   out tokens; it does not decide what a page looks like. Pages opt in by
   using the tokens themselves.
   The two rules below are safe: ::selection is cosmetic, and :where() has zero
   specificity so any page rule beats it. */

/* The transition runs only while the user is actually flipping the switch
   (the engine adds this class for 220ms). Transitioning everything all the
   time makes every page load feel laggy. */
html.hiero-theme-switching,
html.hiero-theme-switching * {
    transition: background-color .2s ease,
                border-color .2s ease,
                color .2s ease,
                fill .2s ease !important;
}
@media (prefers-reduced-motion: reduce) {
    html.hiero-theme-switching,
    html.hiero-theme-switching * { transition: none !important; }
}

::selection { background: var(--primary-ring); color: var(--text-main); }

:where(a):focus-visible,
:where(button):focus-visible,
:where(input, select, textarea):focus-visible {
    outline: 2px solid var(--primary-ink);
    outline-offset: 2px;
}
`;
}

/* ===========================================================================
   SERVING
   ========================================================================= */

const CLIENT_PATH = path.join(__dirname, 'theme-client.js');
const IS_PROD = process.env.NODE_ENV === 'production';

// Built once per boot. A colour change is a code change, so it ships with a
// deploy; in development nodemon or a restart picks it up.
const CSS = buildCss();
const CSS_ETAG = '"' + crypto.createHash('sha1').update(CSS).digest('hex').slice(0, 16) + '"';

let clientCache = null;
function readClient() {
    // Cached in production, re-read in development so editing the engine does
    // not need a restart.
    if (IS_PROD && clientCache) return clientCache;
    try {
        clientCache = fs.readFileSync(CLIENT_PATH, 'utf8');
    } catch (err) {
        console.error('[THEME] Could not read theme-client.js:', err.message);
        // A missing engine must not leave pages unthemed: this minimal
        // fallback still resolves the three modes before first paint.
        clientCache = `(function(){try{var m=localStorage.getItem('hiero.theme')||'system';`
            + `var d=m==='dark'||(m==='system'&&matchMedia('(prefers-color-scheme: dark)').matches);`
            + `document.documentElement.setAttribute('data-theme',d?'dark':'light');}catch(e){}})();`;
    }
    return clientCache;
}

function send(res, body, type, etag) {
    res.set('Content-Type', type);
    res.set('Cache-Control', IS_PROD ? 'public, max-age=3600, must-revalidate' : 'no-cache');
    if (etag) res.set('ETag', etag);
    res.send(body);
}

router.get('/hiero.css', (req, res) => {
    if (req.headers['if-none-match'] === CSS_ETAG) return res.status(304).end();
    send(res, CSS, 'text/css; charset=utf-8', CSS_ETAG);
});

router.get('/hiero.js', (req, res) => {
    const js = readClient();
    send(res, js, 'application/javascript; charset=utf-8');
});

/** The tokens themselves, for tooling, docs, or a design reference. */
router.get('/tokens.json', (req, res) => {
    res.set('Cache-Control', IS_PROD ? 'public, max-age=3600' : 'no-cache');
    res.json({ fonts: FONTS, tokens: TOKENS, modes: ['light', 'dark', 'system'] });
});

module.exports = router;
module.exports.TOKENS = TOKENS;
module.exports.FONTS = FONTS;
