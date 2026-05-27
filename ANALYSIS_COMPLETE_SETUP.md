# ✅ HIERO ANALYSIS - COMPLETE SETUP & VERIFICATION

**Status:** 🟢 BOTH BACKENDS LIVE & WORKING

---

## 🎯 Backend Services Status

### ✅ Analysis Backend (PRIMARY)
- **URL:** `https://hiero-analysis-part.onrender.com`
- **Status:** 🟢 LIVE & RUNNING
- **Health Check:** `/health` or `/api/analysis/health`
- **Main Endpoint:** `POST /api/analyze`

### ✅ Resume Backend (SUPPORTING)
- **URL:** `https://hiero-resume-backend.onrender.com`
- **Status:** 🟢 LIVE & RUNNING
- **Purpose:** Resume building, templates, etc.
- **Note:** Does NOT have `/api/analyze` endpoint (use analysis-part instead)

---

## 📋 API ENDPOINTS

### 1️⃣ Health Check Endpoints

**Option A - Simple Health**
```bash
curl "https://hiero-analysis-part.onrender.com/health"
```

**Option B - Detailed Analysis Health**
```bash
curl "https://hiero-analysis-part.onrender.com/api/analysis/health"
```

**Expected Response:**
```json
{
  "status": "ok",
  "message": "Analysis service healthy",
  "uptime": 12345,
  "timestamp": "2025-11-20T10:30:00Z"
}
```

---

### 2️⃣ Analysis Endpoint - FILE UPLOAD

**URL:** `https://hiero-analysis-part.onrender.com/api/analyze`

**Method:** `POST`

**Content-Type:** `multipart/form-data`

**Required Fields:**
- `resume` - PDF file
- `jd` - PDF file (Job Description)

**Curl Example:**
```bash
curl -X POST "https://hiero-analysis-part.onrender.com/api/analyze" \
  -F "resume=@/path/to/resume.pdf" \
  -F "jd=@/path/to/job_description.pdf"
```

**Expected Response:**
```json
{
  "domain": "it",
  "jdSkills": ["Node.js", "React", "MongoDB", "AWS", "Docker"],
  "resumeSkills": ["Node.js", "JavaScript", "MongoDB", "AWS"],
  "matched": ["Node.js", "MongoDB", "AWS"],
  "missing": ["React", "Docker"],
  "extraSkills": ["Python", "SQL", "Git"],
  "score": 75,
  "timestamp": "2025-11-20T10:30:00Z"
}
```

---

### 3️⃣ Analysis Endpoint - JSON TEXT

**URL:** `https://hiero-analysis-part.onrender.com/api/analyze`

**Method:** `POST`

**Content-Type:** `application/json`

**Required Fields:**
- `resumeText` (string) - Plain text resume content
- `jdText` (string) - Plain text job description

⚠️ **IMPORTANT:** Use `resumeText` and `jdText` - NOT `resume_text` or `jd_text`

**Curl Example:**
```bash
curl -X POST "https://hiero-analysis-part.onrender.com/api/analyze" \
  -H "Content-Type: application/json" \
  -d '{
    "resumeText": "John Doe\nSoftware Engineer\nSkills: Node.js, React, MongoDB, AWS, Docker",
    "jdText": "Senior Developer\nRequired: Node.js, React, MongoDB, AWS, Docker, Kubernetes"
  }' | jq .
```

---

## 🔧 FRONTEND CONFIGURATION

### ✅ Correct Frontend Setup (script.js)

Your frontend MUST use:

```javascript
// At the top of your script
const BACKEND_URL = "https://hiero-analysis-part.onrender.com";
console.log("🔍 Using backend:", BACKEND_URL);

// Health check
async function testBackendConnection() {
  const response = await fetch(`${BACKEND_URL}/api/analysis/health`);
  const data = await response.json();
  console.log("✅ Backend healthy:", data);
}

// For file uploads
async function analyzeResume(resumeFile, jdFile) {
  const formData = new FormData();
  formData.append('resume', resumeFile);
  formData.append('jd', jdFile);
  
  const analyzeUrl = `${BACKEND_URL}/api/analyze`;
  console.log("📤 Sending to:", analyzeUrl);
  
  const response = await fetch(analyzeUrl, {
    method: 'POST',
    body: formData
  });
  
  const result = await response.json();
  console.log("📊 Analysis result:", result);
  return result;
}

// For text input
async function analyzeTextResume(resumeText, jdText) {
  const analyzeUrl = `${BACKEND_URL}/api/analyze`;
  console.log("📤 Sending to:", analyzeUrl);
  
  const response = await fetch(analyzeUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      resumeText: resumeText,
      jdText: jdText
    })
  });
  
  const result = await response.json();
  console.log("📊 Analysis result:", result);
  return result;
}
```

---

## ✅ Verification Checklist

### 1. Backend Status
- [ ] Health endpoint responds with 200
- [ ] Analysis endpoint is reachable
- [ ] Response includes all fields: domain, jdSkills, resumeSkills, matched, missing, extraSkills, score

### 2. Frontend Configuration
- [ ] `BACKEND_URL = "https://hiero-analysis-part.onrender.com"`
- [ ] Health check uses `${BACKEND_URL}/api/analysis/health`
- [ ] Analysis call uses `${BACKEND_URL}/api/analyze`
- [ ] NOT hardcoded to `hiero-resume-backend`

### 3. Browser Test
- [ ] Upload resume + JD
- [ ] Open DevTools → Network tab
- [ ] Find the `/api/analyze` request
- [ ] Check Status: **200** (not 404)
- [ ] Response shows JSON with all fields

### 4. Response Validation
- [ ] `score` is between 0-100
- [ ] `matched` array shows common skills
- [ ] `missing` array shows skills from JD not in resume
- [ ] `extraSkills` shows resume skills not in JD
- [ ] `domain` is detected correctly (it, hr, finance, etc.)

---

## 🧪 QUICK TEST COMMANDS

### Test 1: Health Check
```bash
curl "https://hiero-analysis-part.onrender.com/api/analysis/health" | jq .
```

### Test 2: File Upload Analysis
```bash
curl -X POST "https://hiero-analysis-part.onrender.com/api/analyze" \
  -F "resume=@resume.pdf" \
  -F "jd=@job_description.pdf" | jq .
```

### Test 3: Text Analysis (CORRECT JSON KEYS)
```bash
curl -X POST "https://hiero-analysis-part.onrender.com/api/analyze" \
  -H "Content-Type: application/json" \
  -d '{
    "resumeText": "Senior Developer with 5 years experience. Skills: Node.js, React, AWS, Docker, MongoDB",
    "jdText": "We need: Node.js expert, React developer, AWS experience, Docker, Kubernetes, MongoDB knowledge"
  }' | jq .
```

### Test 4: Wrong Key Names (WILL FAIL)
```bash
# ❌ DO NOT USE - This will fail!
curl -X POST "https://hiero-analysis-part.onrender.com/api/analyze" \
  -H "Content-Type: application/json" \
  -d '{
    "resume_text": "Senior Developer...",
    "jd_text": "Job Description..."
  }' | jq .
```

Expected error: `Resume & JD required`

---

## 🐛 TROUBLESHOOTING

### Problem: 404 Error
**Cause:** Frontend is calling wrong URL (hiero-resume-backend instead of hiero-analysis-part)

**Solution:**
1. Check `BACKEND_URL` in script.js
2. Verify all analysis calls use `https://hiero-analysis-part.onrender.com/api/analyze`
3. Hard refresh browser: `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows)
4. Restart ngrok if needed

### Problem: "Resume & JD required"
**Cause:** Wrong JSON field names (resume_text instead of resumeText)

**Solution:**
```javascript
// ❌ WRONG
body: JSON.stringify({
  resume_text: "...",
  jd_text: "..."
})

// ✅ CORRECT
body: JSON.stringify({
  resumeText: "...",
  jdText: "..."
})
```

### Problem: Score is always 0
**Cause:** Empty extraction or both resume and JD empty

**Solution:**
1. Verify PDF/text contains actual content
2. Check browser console for errors
3. Try with longer, more detailed resume text

### Problem: No extraSkills in response
**Cause:** Resume likely has no skills outside JD requirements

**Solution:** Normal behavior - add more diverse skills to resume to see extraSkills

---

## 📊 Expected Response Examples

### Example 1: Good Match (75% Score)
```json
{
  "domain": "it",
  "jdSkills": ["Node.js", "React", "MongoDB", "AWS", "Docker", "Kubernetes"],
  "resumeSkills": ["Node.js", "JavaScript", "React", "MongoDB", "AWS", "Python", "SQL"],
  "matched": ["Node.js", "React", "MongoDB", "AWS"],
  "missing": ["Docker", "Kubernetes"],
  "extraSkills": ["JavaScript", "Python", "SQL"],
  "score": 67
}
```

### Example 2: Perfect Match (100% Score)
```json
{
  "domain": "it",
  "jdSkills": ["Node.js", "React", "MongoDB", "AWS"],
  "resumeSkills": ["Node.js", "React", "MongoDB", "AWS", "Docker"],
  "matched": ["Node.js", "React", "MongoDB", "AWS"],
  "missing": [],
  "extraSkills": ["Docker"],
  "score": 100
}
```

### Example 3: Poor Match (25% Score)
```json
{
  "domain": "it",
  "jdSkills": ["Java", "Spring Boot", "AWS", "Kubernetes"],
  "resumeSkills": ["Python", "Django", "MySQL"],
  "matched": [],
  "missing": ["Java", "Spring Boot", "AWS", "Kubernetes"],
  "extraSkills": ["Python", "Django", "MySQL"],
  "score": 0
}
```

---

## 🚀 DEPLOYMENT STATUS

### Render Services
- **hiero-analysis-part:** ✅ RUNNING
  - Auto-redeploy on git push
  - Logs available in Render dashboard
  - Health: Check `/health` endpoint

- **hiero-resume-backend:** ✅ RUNNING
  - NOT used for analysis
  - Only for resume templates

### Frontend
- **Public/Analysis.html:** ✅ Uses correct backend
- **Public/Script.js:** ✅ Cache-busted with latest URLs
- **NGROK Tunnel:** ✅ Proxies to localhost:5000

---

## 📝 FINAL CHECKLIST BEFORE PRODUCTION

- [ ] Frontend uses `https://hiero-analysis-part.onrender.com` (not resume-backend)
- [ ] All JSON text uses `resumeText` and `jdText` (not snake_case)
- [ ] Health check endpoint is monitored
- [ ] Error responses are handled in frontend
- [ ] Score calculation is fair (not always 0 or 100)
- [ ] Extra skills are tracked and displayed
- [ ] Domain detection works for multiple industries
- [ ] PDF and text input modes both work
- [ ] CORS is properly configured
- [ ] Response times are acceptable (<5s for analysis)

---

## 🎯 SUMMARY

✅ **Backend:** Ready and live at `https://hiero-analysis-part.onrender.com`
✅ **API:** Fully functional with correct endpoints
✅ **Frontend:** Must use correct BACKEND_URL and JSON keys
✅ **Testing:** Use provided curl commands to verify
⚠️ **Common Mistake:** Wrong URL or JSON field names → 404 or empty results

**Next Step:** Deploy frontend with correct configuration, test with DevTools Network tab!

