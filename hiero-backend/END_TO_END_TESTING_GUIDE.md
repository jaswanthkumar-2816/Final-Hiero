# 🎯 End-to-End Testing Guide

**Date:** November 20, 2025  
**Status:** ✅ Ready for Testing

---

## 📊 System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      USER BROWSER                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  1️⃣  analysis.html                                              │
│      └─ Upload Resume + Job Description                         │
│      └─ Click "Analyze Resume"                                  │
│                ↓                                                  │
│  2️⃣  script.js                                                  │
│      └─ Sends FormData to backend                               │
│      └─ POST https://hiero-analysis-part.onrender.com/api/analyze
│                ↓                                                  │
└─────────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────────┐
│            HIERO ANALYSIS BACKEND (Render)                       │
│     https://hiero-analysis-part.onrender.com                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  1️⃣  Parse Resume PDF → Extract text                           │
│  2️⃣  Parse Job Description PDF → Extract text                  │
│  3️⃣  Extract skills from both                                   │
│  4️⃣  Compare & calculate score                                  │
│  5️⃣  Return complete analysis:                                  │
│      {                                                            │
│        domain: "it",                                             │
│        jdSkills: [...],                                          │
│        resumeSkills: [...],                                      │
│        matched: [...],                                           │
│        missing: [...],                                           │
│        extraSkills: [...],                                       │
│        score: 65,                                                │
│        videos: { skill: "url", ... }                             │
│      }                                                            │
│                ↓                                                  │
└─────────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────────┐
│                      USER BROWSER (CONT)                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  3️⃣  script.js receives response                                │
│      └─ Transforms data                                          │
│      └─ Stores in localStorage                                   │
│      └─ Redirects to result.html                                 │
│                ↓                                                  │
│  4️⃣  result.html                                                │
│      └─ Reads from localStorage                                  │
│      └─ Displays:                                                │
│         • Overall Match Score (animated)                         │
│         • Matched Skills (green badges)                          │
│         • Missing Skills (red badges)                            │
│         • Recommended Projects                                   │
│         • Mock Interview button                                  │
│      └─ User can click "Begin Learning Path"                     │
│                ↓                                                  │
│  5️⃣  learn-redirect.js                                          │
│      └─ Stores selected skill in localStorage                    │
│      └─ Navigates to learn.html with skill parameter             │
│                ↓                                                  │
│  6️⃣  learn.html                                                 │
│      └─ Reads from localStorage                                  │
│      └─ Gets video URL from backend response                     │
│      └─ Displays:                                                │
│         • Video player                                           │
│         • Learning resources                                     │
│         • Recommended courses                                    │
│         • Practice projects                                      │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔍 Step-by-Step Testing

### **Step 1: Access Analysis Page**
```
URL: https://hiero-resume-backend.onrender.com/dashboard/analysis.html
or
URL: http://localhost:ngrok-url/dashboard/analysis.html
```

**Expected:**
- ✅ Form loads with two input areas
- ✅ "Upload Resume (PDF)" button
- ✅ "Upload Job Description (PDF)" button
- ✅ "Analyze Resume" button (green)

---

### **Step 2: Upload Files**

**Option A: File Upload Mode**
1. Click "Choose File" for Resume → Select a PDF
2. Click "Choose File" for Job Description → Select a PDF
3. Check DevTools Console (F12) → Should see:
   ```
   🔍 Using backend: https://hiero-analysis-part.onrender.com
   📤 Sending to backend: https://hiero-analysis-part.onrender.com/api/analyze
   ```

**Option B: Text Mode**
1. Click "Text Mode" tab
2. Paste resume text
3. Paste job description text
4. Same console output expected

---

### **Step 3: Monitor Backend**

**In Backend Logs (Render Dashboard):**
```
📥 /api/analyze request received
👤 Resume parsed: X pages, Y skills extracted
📋 JD parsed: Z skills extracted
📊 Analysis: 
   - Domain: it
   - Matched: [skill1, skill2, ...]
   - Missing: [skill3, skill4, ...]
   - Score: 65%
✅ Response sent
```

---

### **Step 4: Check Frontend Reception**

**In Browser Console (DevTools → Console):**
```
📝 Form submitted
Resume file: resume.pdf (5000 bytes)
JD file: job.pdf (2000 bytes)

📤 Sending to backend: https://hiero-analysis-part.onrender.com/api/analyze

✅ Response received:
   Status: 200
   Content-Type: application/json

📊 Backend Response Data:
   Full response: {domain: 'it', jdSkills: [...], ...}
   Domain: it
   Score: 65
   Matched skills: 3
   Missing skills: 5

💾 Stored in localStorage:
   Score: 65
   Missing Skills: 5
   Matched Skills: 3
   Project Suggestions: 3

⏳ Redirecting in 2 seconds...
🔄 Redirecting to result.html
```

---

### **Step 5: Verify Result Page**

**URL Should Be:** `result.html` (redirected automatically)

**Page Should Display:**
- ✅ Animated score circle (e.g., 65%)
- ✅ "Overall Match Score" heading
- ✅ Matched Skills section (with green badges)
- ✅ Missing Skills section (with red badges)
- ✅ "Priority Skill to Learn" button
- ✅ Recommended Projects
- ✅ Mock Interview button
- ✅ Timestamp showing analysis time

---

### **Step 6: Test Learning Path**

**Click "Begin Learning Path" Button**
```
Expected Console Output:
🎓 Navigating to learn skill: React
📍 Source: analysis
💾 Setting localStorage: selectedSkill=React
🚀 Redirecting to: learn.html?skill=React
```

**Result Page Should:**
- ✅ Redirect to learn.html
- ✅ Load learning resources for React
- ✅ Display video player with tutorial

---

### **Step 7: Verify Learn Page**

**URL Should Be:** `learn.html?skill=React`

**Page Should Display:**
- ✅ Selected skill name (e.g., "React")
- ✅ Learning category
- ✅ Video player (if video available)
- ✅ Recommended courses
- ✅ Practice projects
- ✅ Resources and links

**Video Source:**
- From backend response in analysis stage
- Stored in `videos.React` field
- Should be YouTube or similar

---

### **Step 8: Test Mock Interview**

**Go Back to Result Page → Click "Mock Interview"**

**Expected:**
- ✅ Modal opens
- ✅ Interview questions load
- ✅ Can type answers
- ✅ Next/Previous navigation works
- ✅ Submit button enabled on last question
- ✅ Feedback generated
- ✅ Close button works

---

## 🔧 DevTools Network Tab Checklist

**When analyzing resume, you should see:**

### ✅ Correct Request
```
POST https://hiero-analysis-part.onrender.com/api/analyze
Status: 200 OK
Content-Type: application/json
```

### ❌ Wrong Request (If you see this, cache bust)
```
POST https://hiero-resume-backend.onrender.com/api/analyze
Status: 404 Not Found
```

### Response Headers Should Include:
```
Content-Type: application/json
Access-Control-Allow-Origin: *
Content-Length: [size]
```

### Response Body Should Look Like:
```json
{
  "domain": "it",
  "jdSkills": ["JavaScript", "React", "Node.js", "MongoDB"],
  "resumeSkills": ["Python", "JavaScript", "AWS", "Docker"],
  "matched": ["JavaScript"],
  "missing": ["React", "Node.js", "MongoDB"],
  "extraSkills": ["Python", "AWS", "Docker"],
  "score": 25,
  "videos": {
    "React": "https://youtube.com/watch?v=...",
    "Node.js": "https://youtube.com/watch?v=...",
    "MongoDB": "https://youtube.com/watch?v=..."
  }
}
```

---

## 🐛 Troubleshooting

### Issue: 404 Error on `/api/analyze`
**Solution:**
1. Hard refresh: `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows)
2. Clear Site Data in DevTools → Application → Storage
3. Close all tabs and reopen
4. Check that `ANALYSIS_BACKEND_URL` is `https://hiero-analysis-part.onrender.com`

### Issue: Result page shows "No analysis data"
**Solution:**
1. Check localStorage: DevTools → Application → Storage → localStorage
2. Look for `analysisResult` key
3. Should contain all analysis data
4. If missing, check that analysis request returned 200 OK

### Issue: Videos not loading in learn.html
**Solution:**
1. Check that backend response includes `videos` field
2. Check that video URLs are valid
3. Verify YouTube/source allows embedding
4. Check browser console for CORS errors

### Issue: Mock interview doesn't work
**Solution:**
1. Check that JavaScript is enabled
2. Check browser console for errors
3. Verify modal CSS is loading
4. Check that questions are populated from response

---

## 📋 Complete Test Checklist

- [ ] **Analysis Page Loads**
  - [ ] Form displays correctly
  - [ ] Upload buttons work
  - [ ] Console shows correct backend URL

- [ ] **Analysis Submission**
  - [ ] File upload works
  - [ ] Backend processes (check logs)
  - [ ] Returns 200 status
  - [ ] Response includes all fields

- [ ] **Result Page**
  - [ ] Loads automatically
  - [ ] Score displays correctly
  - [ ] Skills show in correct sections
  - [ ] Projects suggested
  - [ ] Buttons are clickable

- [ ] **Learning Path**
  - [ ] "Begin Learning" button works
  - [ ] Navigates to learn.html
  - [ ] Skill parameter in URL
  - [ ] Resources load
  - [ ] Videos display

- [ ] **Mock Interview**
  - [ ] Modal opens
  - [ ] Questions display
  - [ ] Can answer
  - [ ] Navigation works
  - [ ] Submit generates feedback

- [ ] **localStorage Data**
  - [ ] `analysisResult` stored
  - [ ] `selectedSkill` stored
  - [ ] Data persists across pages
  - [ ] Data survives page reload

---

## 🎯 Success Criteria

✅ **All items checked?** → System is **FULLY FUNCTIONAL** 🎉

**Expected User Journey:**
1. Upload resume + JD
2. See analysis results
3. View score and skills
4. Learn missing skills
5. Take mock interview
6. Get feedback

---

**Last Updated:** November 20, 2025  
**Backend Status:** ✅ Running  
**Frontend Status:** ✅ Deployed  
**Ready for:** Full End-to-End Testing
