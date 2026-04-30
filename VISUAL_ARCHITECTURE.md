# 🎨 HIERO ANALYSIS - VISUAL ARCHITECTURE & FLOW

```
┌─────────────────────────────────────────────────────────────────┐
│                    SYSTEM ARCHITECTURE                          │
└─────────────────────────────────────────────────────────────────┘

                          FRONTEND
                    (ngrok tunnel to local)
                             ↓
                ┌────────────────────────┐
                │  Browser / Dashboard   │
                │  - upload resume.pdf   │
                │  - upload jd.pdf       │
                │  - OR paste text       │
                └────────────────────────┘
                             ↓
                    🌐 HTTP/HTTPS
                             ↓
        ┌───────────────────────────────────────┐
        │   HIERO BACKEND (Port 5000)           │
        │  - Resume builder templates           │
        │  - Resume storage                     │
        │  - User management                    │
        │  - Proxy to analysis backend          │
        └───────────────────────────────────────┘
                             ↓
                    🌐 HTTP/HTTPS
                             ↓
        ┌───────────────────────────────────────┐
        │  ANALYSIS BACKEND (hiero-analysis-part)
        │  ✅ PRIMARY SERVICE                   │
        │  - PDF parsing                        │
        │  - Text extraction                    │
        │  - Skill detection                    │
        │  - Score calculation                  │
        │  - Response with results              │
        └───────────────────────────────────────┘
```

---

## 📡 API FLOW DIAGRAM

```
USER UPLOADS RESUME + JD
        ↓
    ┌──────────────────────┐
    │ Browser sends FormData:
    │  - resume: PDF file
    │  - jd: PDF file
    └──────────────────────┘
        ↓
POST https://hiero-analysis-part.onrender.com/api/analyze
        ↓
    ┌──────────────────────┐
    │ Backend receives:
    │ 1. Parse PDF (resume)
    │ 2. Parse PDF (jd)
    │ 3. Extract text
    └──────────────────────┘
        ↓
    ┌──────────────────────┐
    │ Processing:
    │ 1. Extract skills from both
    │ 2. Match common skills
    │ 3. Find missing skills
    │ 4. Find extra skills
    │ 5. Calculate score
    │ 6. Detect domain
    └──────────────────────┘
        ↓
    ┌──────────────────────┐
    │ Response JSON:
    │ {
    │   "domain": "it",
    │   "jdSkills": [...],
    │   "resumeSkills": [...],
    │   "matched": [...],
    │   "missing": [...],
    │   "extraSkills": [...],
    │   "score": 80
    │ }
    └──────────────────────┘
        ↓
DISPLAY RESULTS TO USER
```

---

## 🔌 CONNECTION VERIFICATION

### What Should Be Connected

```
┌─────────────────────┐
│   YOUR COMPUTER     │
│  - Frontend code    │ ✅ NGROK: 4a0b49ba96a4.ngrok-free.app
│  - Browser          │           ↓
│  - DevTools         │     https://[tunnel]/dashboard/
└─────────────────────┘
         ↓
┌─────────────────────────────────────┐
│   RENDER - HIERO BACKEND            │
│   https://hiero-resume-backend.     │
│   onrender.com                      │
│   - Serves static files (public/)   │ ✅ RUNNING
│   - Proxies to analysis backend     │
└─────────────────────────────────────┘
         ↓
┌─────────────────────────────────────┐
│   RENDER - ANALYSIS BACKEND         │
│   https://hiero-analysis-part.      │
│   onrender.com                      │
│   - /health                         │ ✅ RESPONDING
│   - /api/analysis/health            │ ✅ RESPONDING
│   - /api/analyze                    │ ✅ RESPONDING
└─────────────────────────────────────┘
```

---

## 🎯 REQUEST/RESPONSE CYCLE

### File Upload Mode

```
BROWSER                            BACKEND
  │                                  │
  ├─ Form Data ───────────────────→  │
  │  (resume.pdf, jd.pdf)            │
  │                                  ├─ Parse PDFs
  │                                  ├─ Extract text
  │                                  ├─ Find skills
  │                                  ├─ Calculate score
  │  ← JSON Response ────────────────┤
  │  {                               │
  │    domain: "it",                 │
  │    matched: [...],               │
  │    missing: [...],               │
  │    score: 80                     │
  │  }                               │
  │                                  │
  └─ Display Results ───────────────→ │
```

### Text Input Mode

```
BROWSER                            BACKEND
  │                                  │
  ├─ JSON Data ───────────────────→  │
  │  {                               │
  │    resumeText: "...",            │
  │    jdText: "..."                 │
  │  }                               │
  │                                  ├─ Parse text directly
  │                                  ├─ Find skills
  │                                  ├─ Calculate score
  │  ← JSON Response ────────────────┤
  │  {                               │
  │    domain: "it",                 │
  │    matched: [...],               │
  │    missing: [...],               │
  │    score: 80                     │
  │  }                               │
  │                                  │
  └─ Display Results ───────────────→ │
```

---

## 🧪 TESTING FLOW

```
Step 1: Check Backend Status
  curl https://hiero-analysis-part.onrender.com/health
  Expected: {"status":"ok"} ✅
       │
       ↓
Step 2: Test Analysis Endpoint
  POST /api/analyze with resumeText & jdText
  Expected: JSON with domain, matched, missing, score ✅
       │
       ↓
Step 3: Check Frontend Configuration
  Open DevTools Console
  Expected: "🔍 Using backend: https://hiero-analysis-part..."  ✅
       │
       ↓
Step 4: Upload Resume
  Choose PDF files
  Click "Analyze"
  Expected: Analysis results ✅
       │
       ↓
Step 5: Verify Results
  Open DevTools Network tab
  Check POST to /api/analyze
  Expected: Status 200, JSON response ✅
```

---

## 📊 DATA FLOW - SKILLS MATCHING

```
RESUME TEXT              JD TEXT
    │                       │
    ├─ Extract Skills ──────┤
    │                       │
    v                       v
["Node.js",            ["Node.js",
 "React",               "React",
 "MongoDB",             "MongoDB",
 "AWS",                 "AWS",
 "Docker",              "Docker",
 "Python",              "Kubernetes"]
 "SQL"]
    │                       │
    └──────────┬────────────┘
               │
               v
    ┌──────────────────────┐
    │   MATCHING LOGIC     │
    ├──────────────────────┤
    │ matched: Items in    │
    │ BOTH arrays          │
    │ = [Node.js, React,   │
    │    MongoDB, AWS,     │
    │    Docker]           │
    │                      │
    │ missing: Items in JD │
    │ but NOT in resume    │
    │ = [Kubernetes]       │
    │                      │
    │ extraSkills: Items   │
    │ in resume but NOT    │
    │ in JD                │
    │ = [Python, SQL]      │
    └──────────────────────┘
               │
               v
    ┌──────────────────────┐
    │ SCORE CALCULATION    │
    ├──────────────────────┤
    │ matched: 5           │
    │ totalJD: 6           │
    │ score: (5/6) × 100   │
    │ = 83%                │
    └──────────────────────┘
```

---

## ✅ VERIFICATION CHECKLIST - VISUAL

```
BACKEND READY?
└─ Health: ✅ Responding
└─ API: ✅ /api/analyze working
└─ Response: ✅ Valid JSON
└─ Fields: ✅ All present

FRONTEND CONFIGURED?
└─ Backend URL: ✅ hiero-analysis-part
└─ Endpoint: ✅ /api/analyze
└─ JSON Keys: ✅ camelCase (resumeText, jdText)
└─ File Upload: ✅ FormData format
└─ Text Input: ✅ JSON format

TESTING PASSED?
└─ Health Check: ✅ 200 OK
└─ Analysis: ✅ 200 OK
└─ Score: ✅ Calculated (0-100)
└─ Skills: ✅ Matched correctly
└─ Browser: ✅ No 404 errors

PRODUCTION READY?
└─ All systems: ✅ GO
└─ Deploy now: ✅ YES
```

---

## 🎯 KEY POINTS

1. **Two Backends:**
   - ✅ `hiero-resume-backend` = Resume builder
   - ✅ `hiero-analysis-part` = Analysis engine

2. **Analysis Only Uses:**
   - ✅ `hiero-analysis-part.onrender.com/api/analyze`

3. **JSON Field Names:**
   - ✅ `resumeText` (NOT resume_text)
   - ✅ `jdText` (NOT jd_text)

4. **Response Always Includes:**
   - ✅ domain
   - ✅ jdSkills
   - ✅ resumeSkills
   - ✅ matched
   - ✅ missing
   - ✅ extraSkills
   - ✅ score

5. **Test Commands:**
   ```bash
   # Health
   curl https://hiero-analysis-part.onrender.com/health
   
   # Analysis
   curl -X POST https://hiero-analysis-part.onrender.com/api/analyze \
     -H "Content-Type: application/json" \
     -d '{"resumeText":"...","jdText":"..."}'
   ```

---

## 🚀 READY TO GO!

Everything is verified, tested, and ready for production use.

**Status:** ✅ COMPLETE ✅

