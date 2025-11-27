const express = require('express');
const path = require('path');
const compression = require('compression');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
const PORT = process.env.PORT || 2816; // Gateway runs here

// Trust proxy so OAuth callbacks build correct absolute URLs behind the gateway
app.set('trust proxy', 1);

app.use(compression());
app.use(express.json({ limit: '20mb' }));

// Debug log for auth/OAuth routes
app.use((req, res, next) => {
  if (req.path.startsWith('/auth') || req.path === '/callback' || req.path === '/github/callback') {
    console.log(`[GW] ${req.method} ${req.originalUrl}`);
  }
  next();
});

// Base URL for redirects (ENV or per-request)
const PUBLIC_BASE_URL = process.env.PUBLIC_BASE_URL;
const PROXY_LOG_LEVEL = process.env.PROXY_LOG_LEVEL || 'warn';
const PROXY_DEBUG = /^(1|true)$/i.test(process.env.PROXY_DEBUG || '');

// Backend service base URLs (Render uses env, local uses localhost)
const AUTH_BASE = process.env.AUTH_BASE || 'http://localhost:3000';

// Common proxy that rewrites redirect Location headers to the public base URL
function gwProxy(opts) {
  const proxyConfig = {
    changeOrigin: true,
    xfwd: true,
    cookieDomainRewrite: '',
    autoRewrite: true,
    logLevel: PROXY_LOG_LEVEL,
    // increased timeouts for long-running ops (resume generation / preview)
    proxyTimeout: 120000,
    timeout: 120000,
    onError(err, req, res) {
      console.error('[GW] Proxy error for', req.url, ':', err.code || err.message);
      if (!res.headersSent) {
        // Return JSON so frontend doesn't try to parse HTML
        res.status(502).json({ error: 'Bad Gateway', details: err.message });
      }
    },
    ...opts,
    onProxyReq(proxyReq, req, res) {
      try {
        const base = computeBaseUrl(req);
        const u = new URL(base);
        // Force accurate forwarded headers for auth servers behind ngrok
        proxyReq.setHeader('x-forwarded-proto', u.protocol.replace(':',''));
        proxyReq.setHeader('x-forwarded-host', u.host);
        if (u.port) proxyReq.setHeader('x-forwarded-port', u.port);
        // Some stacks read these
        proxyReq.setHeader('x-original-host', u.host);
        proxyReq.setHeader('x-original-proto', u.protocol.replace(':',''));
        if (PROXY_DEBUG && (req.path.startsWith('/auth') || req.path.endsWith('/callback'))) {
          console.log('[GW] onProxyReq set forwarded', { proto: u.protocol, host: u.host, port: u.port || (u.protocol==='https:'?'443':'80') });
        }
      } catch {}
      if (typeof opts.onProxyReq === 'function') {
        try { opts.onProxyReq(proxyReq, req, res); } catch {}
      }
    },
    onProxyRes(proxyRes, req, res) {
      if (typeof opts.onProxyRes === 'function') {
        try { opts.onProxyRes(proxyRes, req, res); } catch {}
      }
      const status = proxyRes.statusCode;
      const locHdr = proxyRes.headers && proxyRes.headers['location'];
      const origLoc = locHdr;

      // Always print status/Location for auth paths in debug mode
      if (PROXY_DEBUG && (req.path.startsWith('/auth') || req.path === '/callback' || req.path === '/github/callback')) {
        console.log('[GW] proxyRes', req.method, req.originalUrl, 'status:', status, 'location:', origLoc || '-');
      }

      if (!locHdr) return;
      try {
        const base = computeBaseUrl(req);
        // 1) Rewrite relative redirects
        if (locHdr.startsWith('/')) {
          proxyRes.headers['location'] = `${base}${locHdr}`;
          if (PROXY_DEBUG) console.log('[GW] rewrite Location (relative)', req.originalUrl, '→', proxyRes.headers['location']);
          return;
        }
        const u = new URL(locHdr);
        // 2) Map localhost redirects to public base
        if ([ 'localhost', '127.0.0.1' ].includes(u.hostname)) {
          proxyRes.headers['location'] = `${base}${u.pathname}${u.search}${u.hash}`;
          if (PROXY_DEBUG) console.log('[GW] rewrite Location (localhost)', req.originalUrl, '\n   from:', origLoc, '\n     to:', proxyRes.headers['location']);
          return;
        }
        // 3) Fix OAuth authorize redirect_uri to public base
        const isGoogle = u.hostname.endsWith('accounts.google.com');
        const isGitHub = u.hostname === 'github.com' && u.pathname.startsWith('/login/oauth/authorize');
        if (isGoogle || isGitHub) {
          const sp = u.searchParams;
          const ru = sp.get('redirect_uri');
          if (ru && (ru.includes('localhost') || ru.includes('127.0.0.1'))) {
            let cb = '/auth/google/callback';
            if (req.path && req.path.startsWith('/auth/github')) cb = '/auth/github/callback';
            sp.set('redirect_uri', `${base}${cb}`);
            proxyRes.headers['location'] = u.toString();
            if (PROXY_DEBUG) console.log('[GW] rewrite OAuth redirect_uri', req.originalUrl, '\n   from:', origLoc, '\n     to:', proxyRes.headers['location']);
            return;
          }
        }
        // If we didn’t rewrite, log pass-through
        if (PROXY_DEBUG) console.log('[GW] pass-through Location', req.originalUrl, '→', locHdr);
      } catch (e) {
        if (PROXY_DEBUG) console.log('[GW] onProxyRes error', e.message);
      }
    }
  };
  return createProxyMiddleware(proxyConfig);
}

// ------------------------------------------------------------------
// 1. PATHS
// ------------------------------------------------------------------
// Use the directory containing gateway.js (and started.html) as the landing root
const landingDir = __dirname;
const STARTED_HTML = path.join(landingDir, 'started.html');
const dashboardDir = path.join(__dirname, 'dashboard-build'); // <- Put your 8082 build here

// ------------------------------------------------------------------
// 2. PROXIES (MUST COME BEFORE STATIC FILES)
// ------------------------------------------------------------------

// AUTH BACKEND (port 3000) - API routes
const authApiRoutes = [
  '/signup', '/login', '/logout', '/verify-email',
  '/me', '/generate-resume', '/download-resume', '/preview-resume'
];
authApiRoutes.forEach(route => {
  app.all(route, gwProxy({ target: AUTH_BASE, ws: true }));
});

// Google OAuth endpoints → preserve /auth prefix (no pathRewrite)
app.all('/auth/google', gwProxy({ target: AUTH_BASE }));
app.all('/auth/google/callback', gwProxy({ target: AUTH_BASE }));

// GitHub OAuth endpoints → preserve /auth prefix (no pathRewrite)
app.all('/auth/github', gwProxy({ target: AUTH_BASE }));
app.all('/auth/github/callback', gwProxy({ target: AUTH_BASE }));

// General Auth endpoints → login/signup/verify etc.
app.all('/auth/login', gwProxy({ target: AUTH_BASE, changeOrigin: true }));
app.all('/auth/signup', gwProxy({ target: AUTH_BASE, changeOrigin: true }));
app.all('/auth/verify', gwProxy({ target: AUTH_BASE, changeOrigin: true }));
app.all('/auth/verify-email', gwProxy({ target: AUTH_BASE, changeOrigin: true }));

// Support shortened callback paths (if backend initiated with '/callback' or '/github/callback')
// Frontend callback → proxy to dashboard (avoid 404 if a client lands on /callback)
app.use('/callback', createProxyMiddleware({
  target: 'http://localhost:8082',
  changeOrigin: true,
  logLevel: 'warn'
}));
app.use('/auth/callback', gwProxy({ target: AUTH_BASE, pathRewrite: { '^/auth/callback$': '/auth/google/callback' } }));
app.use('/github/callback', gwProxy({ target: AUTH_BASE, pathRewrite: { '^/github/callback$': '/auth/github/callback' } }));

// REMOVED: Catch-all /auth proxy was interfering with OAuth routes
// Static auth pages will be served from landing directory instead

// DASHBOARD UI (port 8082) → /
app.use('/dashboard', createProxyMiddleware({
  target: 'http://localhost:8082',
  changeOrigin: true,
  pathRewrite: { '^/dashboard': '' },
  logLevel: 'warn'
}));

// RESUME API (port 5003)
app.use('/api/resume', createProxyMiddleware({
  target: 'http://localhost:5003',
  changeOrigin: true,
  ws: true,
  logLevel: 'debug',
  proxyTimeout: 120000,
  timeout: 120000
}));

// ANALYSIS API (port 5001)
app.use('/api/analysis', createProxyMiddleware({
  target: 'http://localhost:5001',
  changeOrigin: true,
  ws: true,
  logLevel: 'warn',
  proxyTimeout: 120000,
  timeout: 120000
}));

// PREVIEW IMAGES FROM RESUME SERVICE
app.use('/templates/previews', createProxyMiddleware({
  target: 'http://localhost:5003',
  changeOrigin: true,
  logLevel: 'warn'
}));

// ------------------------------------------------------------------
// 3. STATIC FILES
// ------------------------------------------------------------------

// Serve started.html & assets from the landing directory
// IMPORTANT: do not serve static for /auth/* so proxy can handle OAuth
const landingStatic = express.static(landingDir, {
  index: false,
  extensions: ['html']
});
app.use((req, res, next) => {
  // Skip static for OAuth and auth pages
  if (req.path === '/auth' || req.path.startsWith('/auth/')) {
    return next();
  }
  return landingStatic(req, res, next);
});

// Serve dashboard build (if you want to serve it statically instead of proxy)
// Uncomment below if you build dashboard to `dashboard-build` folder
/*
app.use('/dashboard', express.static(dashboardDir, {
  index: 'index.html',
  extensions: ['html']
}));
*/

// ------------------------------------------------------------------
// 4. ROUTES
// ------------------------------------------------------------------

// Root → started.html
app.get('/', (req, res) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.sendFile(STARTED_HTML);
});

// Support started.html's current "Get Started" target without changing its design
app.get('/dashboard.html', (req, res) => {
  // Redirect to the actual dashboard UI file served statically from landingDir/public
  return res.redirect('/public/index.html');
});

// Fix accidental ".login.html" path without editing the page design
app.get('/.login.html', (req, res) => {
  return res.redirect('/login.html');
});

// After login → redirect to dashboard
// (Your auth backend should redirect to /dashboard after login)
app.get('/dashboard*', (req, res) => {
  // If using proxy (live dev server on 8082)
  res.redirect('/dashboard' + req.path.replace(/^\/dashboard/, ''));

  // OR if serving static build:
  // res.sendFile(path.join(dashboardDir, 'index.html'));
});

// ------------------------------------------------------------------
// 5. SPA FALLBACK (ONLY for frontend routes)
// ------------------------------------------------------------------
app.get('*', (req, res, next) => {
  const filePath = path.join(landingDir, req.path);

  // Serve any real existing file (HTML, JS, CSS, images, etc.)
  if (require('fs').existsSync(filePath)) {
    return res.sendFile(filePath);
  }

  // Only fallback to started.html for unmatched frontend routes (no extension)
  // Ensure we don't catch API, dashboard or auth routes
  if (
    !req.path.startsWith('/api') &&
    !req.path.startsWith('/dashboard') &&
    !req.path.startsWith('/auth') &&
    path.extname(req.path) === ''
  ) {
    return res.sendFile(STARTED_HTML);
  }

  next();
});

// ------------------------------------------------------------------
// 6. START SERVER
// ------------------------------------------------------------------
app.listen(PORT, '0.0.0.0', () => {
  console.log(`\nGateway LIVE at http://localhost:${PORT}`);
  console.log(`   Landing dir          → ${landingDir}`);
  console.log('   started.html        → /');
  console.log('   Sign-up/Login       → /auth/signup, /auth/login');
  console.log('   Google OAuth        → /auth/google, /auth/google/callback');
  console.log('   GitHub OAuth        → /auth/github, /auth/github/callback');
  console.log('   Dashboard UI        → /dashboard (proxied from :8082)');
  console.log('   Resume API          → /api/resume/*     (:5003)');
  console.log('   Analysis API        → /api/analysis/*   (:5001)');
  console.log(`   Base URL Mode       → ${process.env.PUBLIC_BASE_URL ? 'ENV ' + process.env.PUBLIC_BASE_URL : 'Dynamic (x-forwarded headers)'}`);
  console.log(`   Proxy Log Level     → ${PROXY_LOG_LEVEL}`);
  console.log();
});