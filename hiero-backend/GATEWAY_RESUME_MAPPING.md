# Gateway (2816) to Resume Backend (5003) Route Mapping

## 📋 Complete Route Map

### Gateway Configuration (Line 202-216):
```javascript
app.use('/api/resume', createProxyMiddleware({
  target: 'http://localhost:5003',
  pathRewrite: { '^/api/resume': '' }, // Strips /api/resume prefix
  // ... other config
}));
```

### Route Translation:

| Frontend Request | Gateway Receives | Backend (5003) Receives | Backend Route |
|-----------------|------------------|-------------------------|---------------|
| `/api/resume/health` | `/api/resume/health` | `/health` | ✅ `app.get('/health')` |
| `/api/resume/generate-resume` | `/api/resume/generate-resume` | `/generate-resume` | ✅ `app.post('/generate-resume')` |
| `/api/resume/download-resume` | `/api/resume/download-resume` | `/download-resume` | ✅ `app.post('/download-resume')` |
| `/api/resume/preview-resume` | `/api/resume/preview-resume` | `/preview-resume` | ✅ `app.post('/preview-resume')` |

## 🔧 How pathRewrite Works:

```javascript
pathRewrite: { '^/api/resume': '' }
```

This means:
1. Gateway receives: `/api/resume/health`
2. Regex `^/api/resume` matches and removes it
3. Proxies to: `http://localhost:5003/health`
4. Backend sees: `/health`

## ✅ What's Working:

### From Gateway (2816):
```bash
# Health check
curl http://localhost:2816/api/resume/health
→ Proxies to → http://localhost:5003/health ✅

# Template previews (static assets)
curl http://localhost:2816/templates/previews/classic.png
→ Proxies to → http://localhost:5003/templates/previews/classic.png ✅
```

### Resume Builder Endpoints:
```javascript
// In resume-builder.html:
const BACKEND_URL = "/api/resume";

// When user downloads resume:
fetch('/api/resume/download-resume', {
  method: 'POST',
  body: JSON.stringify(resumeData)
})
```

Flow:
```
Browser → /api/resume/download-resume
   ↓
Gateway (2816) strips /api/resume
   ↓
Proxies to localhost:5003/download-resume
   ↓
server.js handles: app.post('/download-resume', ...)
```

## 🌐 ngrok Access:

### Via ngrok on phone:
```
https://4a0b49ba96a4.ngrok-free.app/api/resume/health
   ↓
ngrok → Gateway (2816) /api/resume/health
   ↓
Gateway strips /api/resume → localhost:5003/health
   ↓
Backend responds
```

## 📝 Available Routes on Backend (5003):

### Resume Generation:
- ✅ `POST /generate-resume` - Create resume
- ✅ `POST /download-resume` - Download PDF
- ✅ `POST /preview-resume` - HTML preview

### Auth (also on 5003):
- ✅ `POST /api/auth/signup`
- ✅ `POST /api/auth/login`
- ✅ `POST /api/auth/demo`

### Other:
- ✅ `GET /health` - Health check
- ✅ `GET /api/test` - Test endpoint
- ✅ `POST /api/ask` - Chatbot

### Static Assets:
- ✅ `/templates/previews/*` - Template images

## ⚠️ Note About Auth Routes:

Lines 154-160 in gateway.js show these routes go to port **3000** (auth backend), NOT 5003:
```javascript
const authApiRoutes = [
  '/signup', '/login', '/logout', '/verify-email',
  '/me', '/generate-resume', '/download-resume', '/preview-resume'
];
authApiRoutes.forEach(route => {
  app.all(route, gwProxy({ target: 'http://localhost:3000', ws: true }));
});
```

This means there's **duplicate routing**:
- `/generate-resume` → Goes to port **3000** (auth backend)
- `/api/resume/generate-resume` → Goes to port **5003** (resume backend)

The resume builder uses `/api/resume/*` so it correctly hits port **5003**. ✅

## 🎯 Summary:

**Resume Builder** → Uses `/api/resume/*` → **Gateway (2816)** → **Backend (5003)** ✅

Everything is correctly configured!

## 🧪 Quick Test:

```bash
# Health check through gateway
curl http://localhost:2816/api/resume/health

# Via ngrok (from phone)
curl https://4a0b49ba96a4.ngrok-free.app/api/resume/health
```

Both should return the same JSON response from backend on port 5003.
