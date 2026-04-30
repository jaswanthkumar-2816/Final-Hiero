# Architecture: Before vs After

## ❌ BEFORE (Separate Servers)

```
┌─────────────────────────────────────────────────────────────┐
│                         FRONTEND                            │
│                      (Port 8082)                            │
└────────────┬────────────────────────────┬───────────────────┘
             │                            │
             │ HTTP Requests              │ HTTP Requests
             │                            │
             ▼                            ▼
┌────────────────────────┐   ┌──────────────────────────┐
│   Login System         │   │   Resume Backend         │
│   (Port 2816)          │   │   (Port 5003)            │
│                        │   │                          │
│   - /signup            │   │   - /api/resume/...      │
│   - /login             │   │   - /generate-resume     │
│   - /auth/google       │   │   - /download-resume     │
│   - /auth/github       │   │                          │
│                        │   │                          │
│   ❌ Standalone App    │   │   ❌ Standalone App      │
│   app.listen(2816)     │   │   app.listen(5003)       │
└────────────────────────┘   └──────────────────────────┘

Issues:
- Multiple servers to manage
- Complex CORS configuration
- Hard to maintain
- EXPENSIVE on Render (multiple instances)
```

## ✅ AFTER (Unified Gateway)

```
┌─────────────────────────────────────────────────────────────┐
│                         FRONTEND                            │
│                      (Port 8082)                            │
└────────────────────────────┬───────────────────────────────┘
                             │
                             │ ALL HTTP Requests
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                    GATEWAY SERVER                           │
│                      (Port 3000)                            │
│                                                             │
│   ┌───────────────────────────────────────────────┐       │
│   │  app.use('/', authRoutes)                     │       │
│   │                                                │       │
│   │  ✅ Auth Router (routes/auth.js)              │       │
│   │     - POST /signup                            │       │
│   │     - POST /login                             │       │
│   │     - GET /auth/google                        │       │
│   │     - GET /auth/github                        │       │
│   │     - GET /me                                 │       │
│   │     - POST /download-resume                   │       │
│   └───────────────────────────────────────────────┘       │
│                                                             │
│   ┌───────────────────────────────────────────────┐       │
│   │  app.use('/api/resume', resumeRoutes)         │       │
│   │                                                │       │
│   │  ✅ Resume Router (routes/resume.js)          │       │
│   │     - POST /api/resume/generate               │       │
│   │     - GET /api/resume/:id                     │       │
│   └───────────────────────────────────────────────┘       │
│                                                             │
│   ┌───────────────────────────────────────────────┐       │
│   │  app.use('/api/analysis', analysisRoutes)     │       │
│   │                                                │       │
│   │  ✅ Analysis Router (routes/analysis.js)      │       │
│   │     - POST /api/analysis/analyze              │       │
│   └───────────────────────────────────────────────┘       │
│                                                             │
│   🎯 Single Server: app.listen(3000)                      │
└─────────────────────────────────────────────────────────────┘

Benefits:
✅ ONE server to manage
✅ Simple CORS (all routes on same domain)
✅ Easy to maintain
✅ CHEAP on Render (single instance)
✅ Internal route calls (no network latency)
```

## 🔧 How the Router Works

### Old Way (Standalone App)
```javascript
// login system/main.js
const app = express();

app.post('/signup', ...);
app.post('/login', ...);
app.get('/auth/google', ...);

app.listen(2816);  // Starts its own server
```

### New Way (Router Module)
```javascript
// routes/auth.js
const router = express.Router();

router.post('/signup', ...);
router.post('/login', ...);
router.get('/auth/google', ...);

module.exports = router;  // Exports for use elsewhere
```

### Gateway (Combines Everything)
```javascript
// gateway.js
const app = express();
const authRoutes = require('./routes/auth');

app.use('/', authRoutes);  // Mounts all auth routes

app.listen(3000);  // ONE server for everything
```

## 🌐 Request Flow Example

### User Signs Up

```
1. Frontend makes request:
   POST http://localhost:3000/signup
   
2. Gateway receives request:
   app.use('/', authRoutes)
   
3. Auth router handles it:
   router.post('/signup', async (req, res) => {
     // Create user
     // Send verification email
     // Return response
   })
   
4. Response sent back to frontend:
   { message: "Account created!", email: "..." }
```

### User Logs in with Google

```
1. Frontend redirects to:
   http://localhost:3000/auth/google
   
2. Gateway receives request:
   app.use('/', authRoutes)
   
3. Auth router handles it:
   router.get('/auth/google', 
     passport.authenticate('google', { scope: [...] })
   )
   
4. User redirects to Google
   
5. Google redirects back to:
   http://localhost:3000/auth/google/callback?code=...
   
6. Auth router processes callback:
   router.get('/auth/google/callback', ...)
   
7. Redirect to dashboard with token:
   http://localhost:3000/dashboard?token=...
```

## 📦 File Structure

```
shared folder/
├── gateway.js              ← MAIN SERVER (runs everything)
│
├── routes/
│   ├── auth.js            ← Authentication (converted from main.js)
│   ├── resume.js          ← Resume CRUD (to be added)
│   └── analysis.js        ← Resume analysis (to be added)
│
├── login system/
│   ├── main.js            ← OLD standalone server (keep as backup)
│   └── index.html
│
├── hiero backend/
│   └── server.js          ← OLD standalone server (to be converted)
│
└── hiero last prtotype/
    └── ...                ← Frontend files
```

## 🎯 Migration Path

### Step 1: ✅ DONE - Convert Login System
```
login system/main.js → routes/auth.js
```

### Step 2: Convert Other Services
```
hiero backend/server.js → routes/resume.js + routes/analysis.js
```

### Step 3: Update Frontend
```javascript
// Before
fetch('http://localhost:2816/login', ...)
fetch('http://localhost:5003/api/resume/generate', ...)

// After  
fetch('/login', ...)                    // Same server!
fetch('/api/resume/generate', ...)      // Same server!
```

### Step 4: Deploy
```
Deploy ONLY gateway.js to Render
All routes work from single URL
```

---

**Summary:** Your login system is now a modular router that plugs into the gateway. All other services can follow the same pattern!
