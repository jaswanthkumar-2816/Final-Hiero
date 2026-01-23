# 🚀 Quick Start: Test Your LLM Analysis System

**Time to Test:** 5-10 minutes  
**Status:** ✅ Ready to Go

---

## ✅ Pre-flight Checklist

Before you start:

- [ ] Node.js installed (`node --version` should work)
- [ ] `.env` file in `hiero backend/` with:
  ```
  OPENROUTER_API_KEY=your_key_here
  YOUTUBE_API_KEY=your_key_here
  PORT=5001
  ```
- [ ] Have a test resume PDF (yours or sample)
- [ ] Have a test job description PDF (or text)
- [ ] Terminal access

---

## 🎬 Step 1: Start the Backend

```bash
# Navigate to backend folder
cd "/Users/jaswanthkumar/Desktop/shared folder/hiero backend"

# Install dependencies (first time only)
npm install

# Start the server
npm start
```

**Expected Output:**
```
Analysis server running on port 5001
/api/get-videos endpoint ready
/api/ask chatbot endpoint ready
OpenRouter API configured (model: mistralai/mistral-7b-instruct)
```

---

## 🎬 Step 2: Test Backend Health Check

Open a new terminal:

```bash
# Test if backend is running
curl http://localhost:5001/api/health
```

**Expected Response:**
```json
{ "status": "ok", "message": "Backend is running!" }
```

---

## 🎬 Step 3: Open Frontend in Browser

1. Open your analysis page (usually `analysis.html`)
   - Local: `file:///path/to/hiero%20last/public/analysis.html`
   - Or: `http://localhost:3000` (if you have a dev server)

2. You should see:
   - Upload Resume button
   - Upload JD button (or paste text option)
   - Analyze button
   - Connection status (should show ✅)

---

## 🎬 Step 4: Upload Files & Analyze

1. **Click "Upload Resume"** → Select your resume PDF
2. **Click "Upload JD"** → Select job description PDF
   - OR paste JD text in text area if available
3. **Click "Analyze"** button

**You should see:**
- Loading spinner appears
- Status updates in console

---

## 🎬 Step 5: Monitor Console Logs

### Backend Console (Terminal)

Watch for these logs:

```
📥 /api/analyze request received
📄 Extracting Resume from file: uploads/timestamp-resume.pdf
✅ Resume extracted, length: 1523

🤖 === USING LLM-POWERED ANALYSIS ===
🤖 Calling OpenRouter LLM for analysis...
✅ LLM response received, parsing JSON...
✅ LLM JSON parsed successfully

✅ LLM analysis complete
   Domain: it
   JD Skills: 3 ["python", "sql", "react"]
   Resume Skills: 2 ["python", "html"]
   Matched: 1 ["python"]
   Missing: 2 ["sql", "react"]
   Score: 33

📚 === BUILDING LEARNING PLAN ===
Building plans for 2 missing skills...
🎯 Building learning plan for: sql
📺 Fetching videos: sql (telugu) - query: "sql tutorial telugu for beginners"
✅ Retrieved 3 videos for sql (telugu)
📺 Fetching videos: sql (hindi) - query: "sql tutorial hindi for beginners"
✅ Retrieved 3 videos for sql (hindi)
[... for each language ...]
✅ Learning plan built for sql: 3 Telugu videos, 3 easy problems

✅ === ANALYSIS COMPLETE ===
Response summary:
  score: 33
  matched: 1
  missing: 2
  learningPlanCount: 2
```

### Browser Console (F12 → Console)

Watch for these logs:

```
🔍 Using backend: https://hiero-analysis-part.onrender.com
✅ Backend Ready
📝 Form submitted
Resume file: resume.pdf (1234 bytes)
JD file: job.pdf (5678 bytes)

📤 Sending to backend: .../api/analyze

✅ Response received:
   Status: 200 OK
   Content-Type: application/json

📊 Backend Response Data:
   Domain: it
   JD Skills: 3 ["python", "sql", "react"]
   Resume Skills: 2 ["python", "html"]
   Matched: 1 ["python"]
   Missing: 2 ["sql", "react"]
   Extra Skills: 1 ["html"]
   Score: 33%

💾 Stored in localStorage:
   Score: 33
   Domain: it
   Matched Skills: 1 ["python"]
   Missing Skills: 2 ["sql", "react"]

📚 Learning Plan stored: 2 skills
   - sql: 3 projects, videos: telugu:3, hindi:3, tamil:3, english:3, kannada:3
   - react: 3 projects, videos: telugu:3, hindi:3, tamil:3, english:3, kannada:3
```

---

## ✅ Step 6: Verify localStorage

In browser console (F12):

```javascript
// Check storage
JSON.parse(localStorage.getItem('hieroLearningPlan'));

// You should see:
[
  {
    skill: "sql",
    miniProjects: ["3 project ideas"],
    videos: {
      telugu: [3 video objects],
      hindi: [3 video objects],
      tamil: [3 video objects],
      english: [3 video objects],
      kannada: [3 video objects]
    },
    problems: {
      easy: [3 problems with URLs],
      medium: [3 problems with URLs],
      hard: [3 problems with URLs]
    },
    llmProblems: {
      easy: ["3 problem descriptions"],
      medium: ["3 problem descriptions"],
      hard: ["3 problem descriptions"]
    }
  },
  {
    skill: "react",
    // ... same structure ...
  }
]
```

---

## 🎯 Step 7: Check Result Page

After 2 seconds, you should be redirected to `result.html`.

**You should see:**
- ✅ Match score displayed
- ✅ Matched skills shown
- ✅ Missing skills listed
- ✅ Button to view learning roadmap

---

## 🎯 Step 8: Navigate to Learn Page

Click the "Learn Your Missing Skills" button (or navigate to `learn.html`).

**Debug in browser console:**
```javascript
// Check if learning plan loaded
const plan = JSON.parse(localStorage.getItem('hieroLearningPlan'));
console.log('Skills to learn:', plan.map(p => p.skill));
console.log('First skill videos:', plan[0].videos.telugu.length, 'videos');
console.log('First skill problems:', Object.keys(plan[0].problems));
```

---

## 🐛 Troubleshooting

### ❌ Problem: "Backend connection failed"

**Solution:**
```bash
# Check if backend is running
curl http://localhost:5001/api/health

# If no response, restart backend
cd "hiero backend"
npm start

# Check .env file has correct PORT
cat .env | grep PORT
```

### ❌ Problem: LLM Error "OPENROUTER_API_KEY missing"

**Solution:**
```bash
# Check .env
cat .env | grep OPENROUTER

# Add key if missing:
echo "OPENROUTER_API_KEY=sk_..." >> .env

# Restart backend
npm start
```

### ❌ Problem: "Analysis failed" in frontend

**Solution:**
```javascript
// Check backend response error
const response = await fetch('...../api/analyze', {...});
const data = await response.json();
console.log('Error:', data.error, data.details);

// Common errors:
// - "JD & Resume required" → Upload both files
// - "OpenRouter failed" → Check API key
// - "YouTube API error" → Check YouTube key
```

### ❌ Problem: Videos not loading

**Solution:**
```javascript
// Check if videos in localStorage
const plan = JSON.parse(localStorage.getItem('hieroLearningPlan'));
plan.forEach(skill => {
  console.log(`${skill.skill}:`, 
    Object.entries(skill.videos)
      .map(([lang, vids]) => `${lang}: ${vids.length}`)
      .join(', ')
  );
});

// If empty, check backend logs for YouTube API errors
```

### ❌ Problem: Problems not showing links

**Solution:**
```javascript
// Check if problems in response
const plan = JSON.parse(localStorage.getItem('hieroLearningPlan'));
plan.forEach(skill => {
  console.log(`${skill.skill} problems:`, skill.problems);
  console.log(`${skill.skill} problem URLs:`, 
    skill.problems.easy?.map(p => p.url)
  );
});

// If URLs are null/missing, they're using LLM fallback descriptions
```

---

## 📊 Data Validation Checklist

### ✅ In Backend Response

```javascript
const response = {
  domain: "string",              // ✅ Should be "it", "hr", etc.
  jdSkills: ["array", "of", "strings"],    // ✅ Non-empty
  resumeSkills: ["array"],                 // ✅ Non-empty
  matched: ["subset"],                     // ✅ Subset of jdSkills
  missing: ["subset"],                     // ✅ Subset of jdSkills
  extraSkills: ["subset"],                 // ✅ Subset of resumeSkills
  score: 50,                               // ✅ 0-100
  learningPlan: [
    {
      skill: "string",                     // ✅ String
      miniProjects: ["3", "ideas"],        // ✅ 3 strings
      videos: {
        telugu: [3, "video", "objects"],   // ✅ 3 videos
        hindi: [3, "video", "objects"],    // ✅ 3 videos
        // ... other languages ...
      },
      problems: {
        easy: [3, "problem", "objects"],   // ✅ 3 with URLs
        medium: [3, "problem", "objects"], // ✅ 3 with URLs
        hard: [3, "problem", "objects"]    // ✅ 3 with URLs
      }
    }
    // ... for each missing skill ...
  ]
};
```

---

## 🎓 Next Steps After Testing

1. **Build learn.html UI** (if not done)
   - Display mini projects
   - Show videos by language (tabs)
   - List problems by difficulty
   - Make it pretty! 🎨

2. **Test with multiple resumes** and JD types
   - IT roles
   - HR roles
   - Finance roles
   - etc.

3. **Add tracking** (optional but nice)
   - Save watched videos
   - Track completed problems
   - Progress bar per skill

4. **Optimize** (for production)
   - Cache frequent skills' videos
   - Compress learning plan JSON
   - Add error recovery

5. **Deploy!**
   - Push to production
   - Monitor errors
   - Iterate based on user feedback

---

## 🎯 Success Criteria

Your system is working ✅ if:

- [ ] Backend starts without errors
- [ ] Upload resume + JD successfully
- [ ] LLM analysis completes in <10 seconds
- [ ] Result page shows correct score & skills
- [ ] localStorage contains full learning plan
- [ ] Learning plan has 3+ videos per language
- [ ] Videos are real YouTube embeds (not broken)
- [ ] Problems have real HackerRank/LeetCode links
- [ ] Mini projects are creative and relevant
- [ ] learn.html loads learning plan from storage

---

## 📱 Production Checklist

Before going live:

- [ ] Use deployed backend URL (not localhost)
- [ ] Environment variables set on production server
- [ ] Error handling works gracefully
- [ ] Loading states are visible to user
- [ ] Timeouts set for API calls (>30s)
- [ ] CORS enabled on backend
- [ ] Rate limiting on YouTube/OpenRouter APIs
- [ ] Fallbacks work if APIs fail
- [ ] localStorage cleared between users (if shared device)
- [ ] Mobile responsive design

---

## 📞 Support Commands

```bash
# Check backend health
curl http://localhost:5001/api/health

# Check specific endpoint
curl -X POST http://localhost:5001/api/analyze \
  -F "resume=@path/to/resume.pdf" \
  -F "jd=@path/to/jd.pdf"

# View backend logs
tail -f "hiero backend/backend.log"

# Kill backend process (if stuck)
lsof -ti :5001 | xargs kill -9
```

---

## 🎉 You Did It!

Your LLM-powered analysis system is now:

✅ Using OpenRouter as the brain (LLM)  
✅ Using YouTube API for real videos  
✅ Using curated problem mappings for real links  
✅ Providing complete learning roadmaps  
✅ Handling errors gracefully  
✅ Storing everything for learn.html  

**Now build the UI and ship it! 🚀**

---

## 📚 Related Documents

- `LLM_ANALYSIS_IMPLEMENTATION_GUIDE.md` - Complete technical guide
- `PRACTICE_PROBLEMS_INTEGRATION_GUIDE.md` - How HackerRank integration works
- `ANALYSIS_FLOW_DIAGRAM.md` - Visual data flow
- `simple-analysis-server.js` - Full backend code
- `script.js` - Frontend integration code

**Happy analyzing! 🎓**
