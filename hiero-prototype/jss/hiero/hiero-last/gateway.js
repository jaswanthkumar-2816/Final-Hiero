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
  if (req.path.startsWith('/auth') || req.path === '/callback' || req.path === '/github/callback' || req.path === '/login' || req.path === '/signup') {
    console.log(`[GW] ${req.method} ${req.originalUrl}`);
  }
  next();
});

// Base URL for redirects (ENV or per-request)
const PUBLIC_BASE_URL = process.env.PUBLIC_BASE_URL;
const PROXY_LOG_LEVEL = process.env.PROXY_LOG_LEVEL || 'warn';
const PROXY_DEBUG = /^(1|true)$/i.test(process.env.PROXY_DEBUG || 'true');

// Backend service base URLs
const AUTH_BASE = process.env.AUTH_BASE || 'http://localhost:3000';
const DASHBOARD_BASE = process.env.DASHBOARD_BASE || 'http://localhost:8082';

// Helper to compute absolute base URL for this request
function computeBaseUrl(req) {
  if (PUBLIC_BASE_URL) return PUBLIC_BASE_URL;
  const host = req.get('x-forwarded-host') || req.get('host');
  const proto = req.get('x-forwarded-proto') || req.protocol;
  return `${proto}://${host}`;
}

// Common proxy that rewrites redirect Location headers to the public base URL
function gwProxy(opts) {
  const proxyConfig = {
    changeOrigin: true,
    xfwd: true,
    cookieDomainRewrite: '',
    autoRewrite: true,
    logLevel: PROXY_LOG_LEVEL,
    proxyTimeout: 120000,
    timeout: 120000,
    onError(err, req, res) {
      console.error('[GW] Proxy error for', req.url, ':', err.code || err.message);
      if (!res.headersSent) {
        res.status(502).json({ error: 'Bad Gateway', details: err.message });
      }
    },
    ...opts,
    onProxyReq(proxyReq, req, res) {
      try {
        const base = computeBaseUrl(req);
        const u = new URL(base);
        proxyReq.setHeader('x-forwarded-proto', u.protocol.replace(':', ''));
        proxyReq.setHeader('x-forwarded-host', u.host);
        if (u.port) proxyReq.setHeader('x-forwarded-port', u.port);
        proxyReq.setHeader('x-original-host', u.host);
        proxyReq.setHeader('x-original-proto', u.protocol.replace(':', ''));
      } catch { }
      if (typeof opts.onProxyReq === 'function') {
        try { opts.onProxyReq(proxyReq, req, res); } catch { }
      }
    },
    onProxyRes(proxyRes, req, res) {
      if (typeof opts.onProxyRes === 'function') {
        try { opts.onProxyRes(proxyRes, req, res); } catch { }
      }
      const status = proxyRes.statusCode;
      const locHdr = proxyRes.headers && proxyRes.headers['location'];

      if (PROXY_DEBUG && (req.path.startsWith('/auth') || req.path === '/login' || req.path === '/signup')) {
        console.log('[GW] proxyRes', req.method, req.originalUrl, 'status:', status, 'location:', locHdr || '-');
      }

      if (!locHdr) return;
      try {
        const base = computeBaseUrl(req);
        if (locHdr.startsWith('/')) {
          proxyRes.headers['location'] = `${base}${locHdr}`;
          return;
        }
        const u = new URL(locHdr);
        if (['localhost', '127.0.0.1'].includes(u.hostname)) {
          proxyRes.headers['location'] = `${base}${u.pathname}${u.search}${u.hash}`;
          return;
        }
        // Fix OAuth authorize redirect_uri
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
            return;
          }
        }
      } catch (e) { }
    }
  };
  return createProxyMiddleware(proxyConfig);
}

// 1. PATHS
const landingDir = __dirname;
const STARTED_HTML = path.join(landingDir, 'started.html');

// 2. PROXIES
// Auth Backend (port 3000)
const authApiRoutes = [
  '/signup', '/login', '/logout', '/verify-email',
  '/me', '/generate-resume', '/download-resume', '/preview-resume'
];
authApiRoutes.forEach(route => {
  // We use gwProxy but EXLUDE GET /login and GET /signup so we can serve UI
  app.all(route, (req, res, next) => {
    if (req.method === 'GET' && (req.path === '/login' || req.path === '/signup')) {
      return next();
    }
    return gwProxy({ target: AUTH_BASE, ws: true })(req, res, next);
  });
});

// OAuth routes
app.all('/auth/google', gwProxy({ target: AUTH_BASE }));
app.all('/auth/google/callback', gwProxy({ target: AUTH_BASE }));
app.all('/auth/github', gwProxy({ target: AUTH_BASE }));
app.all('/auth/github/callback', gwProxy({ target: AUTH_BASE }));

// Shortened callbacks
app.use('/callback', createProxyMiddleware({ target: DASHBOARD_BASE, changeOrigin: true }));
app.use('/auth/callback', gwProxy({ target: AUTH_BASE, pathRewrite: { '^/auth/callback$': '/auth/google/callback' } }));
app.use('/github/callback', gwProxy({ target: AUTH_BASE, pathRewrite: { '^/github/callback$': '/auth/github/callback' } }));

// Dashboard UI Login Tracking / User Info (proxied to port 3000)
app.use('/api/auth', createProxyMiddleware({ target: AUTH_BASE, pathRewrite: { '^/api/auth': '' } }));

// Dashboard UI (port 8082) fallback
app.use('/dashboard', createProxyMiddleware({
  target: DASHBOARD_BASE,
  changeOrigin: true,
  pathRewrite: { '^/dashboard': '' },
  logLevel: 'warn'
}));

// Resume & Analysis API (port 5003)
app.use(createProxyMiddleware({
  target: 'http://localhost:5003',
  pathFilter: ['/api/resume', '/api/analysis', '/preview-resume', '/download-resume', '/generate-resume', '/download-docx'],
  changeOrigin: true,
  ws: true,
  logLevel: 'debug'
}));

// Previews
app.use('/templates/previews', createProxyMiddleware({ target: 'http://localhost:5003', changeOrigin: true }));

// 3. UI ROUTES
app.get('/', (req, res) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.sendFile(STARTED_HTML);
});

app.get(['/login', '/login.html'], (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get(['/signup', '/signup.html'], (req, res) => {
  res.sendFile(path.join(__dirname, 'signup.html'));
});

app.get('/get-started', (req, res) => {
  res.sendFile(path.join(__dirname, 'role-selection.html'));
});

// Main Dashboard serving
app.get(['/dashboard', '/dashboard.html', '/index.html'], (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/admin-dashboard.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin-dashboard.html'));
});

// 4. STATIC FILES
app.use(express.static(landingDir, { index: false, extensions: ['html'] }));
app.use('/public', express.static(path.join(__dirname, 'public'), { index: false }));

// 5. SPA FALLBACK
app.get('*', (req, res, next) => {
  if (path.extname(req.path) !== '') return next();
  if (
    !req.path.startsWith('/api') &&
    !req.path.startsWith('/dashboard') &&
    !req.path.startsWith('/auth')
  ) {
    return res.sendFile(STARTED_HTML);
  }
  next();
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`\nGateway LIVE at http://localhost:${PORT}`);
});