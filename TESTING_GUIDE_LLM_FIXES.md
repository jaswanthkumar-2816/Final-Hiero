# Testing Guide: LLM JSON Parsing Fixes

## Quick Start

### Prerequisites
- Node.js and npm installed
- `.env` file with `OPENROUTER_API_KEY` and `YOUTUBE_API_KEY`
- Sample resume and job description PDFs

### Steps

#### 1. Start the Backend
```bash
cd "/Users/jaswanthkumar/Desktop/shared folder/hiero backend"
npm start
```

**Expected output**:
```
Analysis server running on port 5001
/api/get-videos endpoint ready
/api/ask chatbot endpoint ready
OpenRouter API configured (model: mistralai/mistral-7b-instruct)
```

#### 2. Open Frontend
```
http://localhost:3000/analysis.html
```

#### 3. Upload Files
- Resume PDF
- Job Description PDF (or paste text)

#### 4. Click Analyze

#### 5. Check Logs
Open browser DevTools → Console
Should see detailed logs showing data flow

---

## What to Look For

### ✅ Success Indicators

**In Backend Console** (terminal):
```
📋 === COMPUTING RULE-BASED ANALYSIS ===
✅ Rule-based analysis complete
   Matched: 3 [...]
   Missing: 3 [...]
   Score: 50%

🤖 === USING LLM-POWERED ENHANCEMENT ===
✅ LLM response received, parsing JSON...
✅ LLM JSON parsed successfully
✅ LLM analysis complete
   Score: 30

📚 === BUILDING LEARNING PLAN ===
✅ Learning plans built: 3 skills

✅ === ANALYSIS COMPLETE ===
Response summary: { score: 30, matched: 3, missing: 3, learningPlanCount: 3 }
```

**In Frontend Console** (DevTools):
```
✅ Response received: Status 200
📊 RAW Backend Response: { ... score: 30, matched: [3 items], missing: [3 items], ... }
💾 Stored in localStorage:
   Score: 30
   Domain: it
   Matched Skills: 3 [...]
   Missing Skills: 3 [...]
   Learning Plan stored: 3 skills
```

**On result.html**:
```
📦 Raw stored data: { success: true, data: {...}, ... }
✅ Extracted wrapped data: {...}
✅ Data validation passed
⚙️ setAnalysisData called with: {...}
✅ Score updated: 30%
✅ Score ring animated
✅ Missing skills list updated: 3 skills
✅ Learn first skill updated: ...
✅ Projects list updated: 3 projects
✅ Timestamp updated
🎉 setAnalysisData completed successfully
```

### ❌ Error Indicators

**What NOT to see**:
- `Unexpected end of JSON input` (old error, should be gone)
- `score: 0, matched: 0, missing: 0` (all zeros = problem)
- Silent failures with no console output

**If you see errors**:

#### Error: "Unexpected end of JSON input"
```
Status: ❌ LLM JSON parsing still failing
Cause: safeParseLLMJson not working correctly
Fix: Check if safeParseLLMJson is in the file
Command: grep -n "safeParseLLMJson" simple-analysis-server.js
Expected: 3 matches (definition + 2 uses)
```

#### Error: All zeros (score: 0, matched: 0, missing: 0)
```
Status: ❌ Rule-based not running or failing
Cause: Logic reversion didn't work
Fix: Check line ~607 for "COMPUTING RULE-BASED ANALYSIS"
Command: grep -n "COMPUTING RULE-BASED" simple-analysis-server.js
Expected: 1 match
```

#### Error: "score: -5" or negative numbers
```
Status: ⚠️ Validation not working
Cause: LLM returned invalid values
Fix: Check validation logic (Math.min/Math.max)
Command: grep -n "if (finalScore < 0)" simple-analysis-server.js
Expected: Score clamped to 0-100
```

---

## Test Scenarios

### Scenario 1: Happy Path (Everything Works)

**Input**: Quality resume + clear job description

**Expected Flow**:
```
✅ Rule-based: domain detected, skills extracted, score=50%
✅ LLM: response parsed, score=72
✅ Final: score=72, matched=3, missing=2
✅ Learning plans: 2 skills with videos/problems
```

**What to check**:
- [x] Console shows both rule-based and LLM sections
- [x] Score is non-zero (30-100)
- [x] Matched > 0
- [x] Missing > 0
- [x] Learning plans > 0
- [x] No error messages

---

### Scenario 2: LLM Fails (Test Fallback)

**Setup**: 
1. Temporarily disable OPENROUTER_API_KEY in `.env`:
   ```
   OPENROUTER_API_KEY=invalid_key_12345
   ```
2. Restart backend
3. Upload resume and JD

**Expected Flow**:
```
✅ Rule-based: domain detected, score=50%
❌ LLM: API error or invalid key
ℹ️ Continuing with rule-based analysis only
✅ Final: score=50% (from rule-based)
✅ Learning plans: Generated from rule-based missing skills
```

**What to check**:
- [x] Console shows: "❌ LLM enhancement failed"
- [x] Console shows: "ℹ️ Continuing with rule-based analysis only"
- [x] Score is STILL non-zero (from rule-based) ✅
- [x] No crash or blank page
- [x] Learning plans still generated

---

### Scenario 3: Empty Skill Arrays (Test Validation)

**Setup**: 
1. Upload very mismatched resume/JD
   - Resume: "Photography enthusiast, Adobe Lightroom, Photoshop"
   - JD: "Senior Python Engineer with 10+ years DevOps"

**Expected Flow**:
```
✅ Rule-based: No matching skills
   Matched: 0
   Missing: 10+ (all JD skills)
✅ LLM: May return better analysis
✅ Final: Score low but non-zero, learning plan for all missing skills
```

**What to check**:
- [x] Console shows different matched/missing counts
- [x] Still generates learning plans for missing skills
- [x] No crash with empty arrays

---

### Scenario 4: Perfect Match

**Setup**:
1. Upload same content for resume and JD
   - Resume: "Python, Docker, Kubernetes, AWS, CI/CD"
   - JD: "Python, Docker, Kubernetes, AWS, CI/CD"

**Expected Flow**:
```
✅ Rule-based: All skills matched
   Matched: 5
   Missing: 0
   Score: 100%
✅ LLM: Confirms perfect match
✅ Final: score=100, matched=5, missing=0
✅ Learning plans: 0 (nothing to learn)
```

**What to check**:
- [x] Console shows: Score: 100%
- [x] Console shows: Missing: 0
- [x] Learning plans: 0 (or empty array)
- [x] Frontend shows "Perfect match!" or similar

---

## Debugging Commands

### Check if safeParseLLMJson exists
```bash
grep -n "safeParseLLMJson" simple-analysis-server.js
```
Expected: 3 lines (definition + 2 uses)

### Check if rule-based runs first
```bash
grep -n "COMPUTING RULE-BASED" simple-analysis-server.js
```
Expected: 1 line (should be before LLM section)

### Check if validation logic exists
```bash
grep -n "Math.min.*Math.max" simple-analysis-server.js
```
Expected: Find score validation

### View recent logs
```bash
# Last 50 lines of logs
tail -50 backend.log

# Watch logs in real-time
tail -f backend.log
```

### Test API directly with curl
```bash
# Test health check
curl http://localhost:5001/api/analysis/health

# Upload files for analysis (you'll need actual PDF files)
curl -X POST http://localhost:5001/api/analyze \
  -F "resume=@/path/to/resume.pdf" \
  -F "jd=@/path/to/jd.pdf"
```

---

## Performance Baseline

**Normal execution time** (after fixes):

| Step | Duration |
|------|----------|
| PDF extraction | 1-2 seconds |
| Rule-based analysis | 100-500ms |
| LLM API call | 2-5 seconds |
| LLM JSON parsing | 10-50ms |
| YouTube API calls (5 langs × 3 skills) | 3-10 seconds |
| Problem fetching | 100-300ms |
| **Total** | 8-20 seconds |

**If slower**: Check network, API rate limits, or server load

---

## Common Issues & Fixes

### Issue: "EACCES: permission denied"
```
Cause: Port already in use or permission issue
Fix: Kill process on port 5001
Command: lsof -ti:5001 | xargs kill -9
Or use different port: PORT=5002 npm start
```

### Issue: "Cannot find module 'pdf-parse'"
```
Cause: Dependencies not installed
Fix: npm install
```

### Issue: "OPENROUTER_API_KEY missing"
```
Cause: .env not configured
Fix: Add to .env file:
OPENROUTER_API_KEY=sk-or-v1-...
YOUTUBE_API_KEY=AIzaSy...
```

### Issue: Logs show score=0 still
```
Cause: Old code still running
Fix: 
1. Stop backend (Ctrl+C)
2. Check git status: git status
3. Verify changes: grep "COMPUTING RULE-BASED" analysis/simple-analysis-server.js
4. If not there, changes didn't save:
   - git pull origin main (if remote has changes)
   - Or re-apply changes manually
5. Restart: npm start
```

### Issue: Frontend shows blank/error
```
Cause: Backend returning invalid data
Fix:
1. Check backend logs for "❌" or "ERROR"
2. Open DevTools → Network tab
3. Check /api/analyze response
4. Should see: { domain, jdSkills, matched, missing, score, learningPlan }
5. If response is {}, backend failed silently
```

---

## Success Checklist

- [ ] Backend starts without errors
- [ ] Frontend uploads files successfully
- [ ] Analysis completes in <25 seconds
- [ ] Backend console shows full flow with ✅ marks
- [ ] Score is non-zero (30-100)
- [ ] Matched > 0 or = 0 (depending on resume)
- [ ] Missing > 0 (if not perfect match)
- [ ] Learning plans count > 0 (if missing > 0)
- [ ] result.html displays with data
- [ ] Console logs show setAnalysisData completed
- [ ] No red error messages
- [ ] No crashes

---

## Need Help?

If tests fail:
1. **Check backend logs** - look for ❌ messages
2. **Check frontend console** - look for errors
3. **Verify code changes** - run grep commands above
4. **Test API directly** - use curl to check response
5. **Check .env** - ensure keys are set
6. **Restart everything** - sometimes needed after code updates

See `LLM_JSON_PARSING_FIX.md` for technical details.
