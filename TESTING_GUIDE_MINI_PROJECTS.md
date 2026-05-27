# Testing Guide: Mini Projects & Learning Plans

## Quick Test Checklist

### Test Case 1: LLM JSON Parsing Failure Scenario
**Setup:** Use a resume + JD that previously caused "Unexpected end of JSON input" error

**Steps:**
1. Upload the problematic resume + JD
2. Open browser console (F12 → Console tab)
3. Look for logs

**Expected Results:**
- ✅ Backend logs show mini projects being generated
- ✅ No TypeError or empty arrays
- ✅ Response has learningPlanCount > 0
- ✅ learn.html shows projects tab with content

**Console logs to see:**
```
🚀 Generating mini projects for: SkillName
✅ Generated 3 mini projects for SkillName
✅ Learning plan built for SkillName: 3 Telugu videos, 3 projects, 3 easy problems
```

---

### Test Case 2: Perfect Match (No Missing Skills)
**Setup:** Upload resume + JD where candidate has all required skills

**Steps:**
1. Upload matching resume + JD
2. Open browser console

**Expected Results:**
- ✅ Backend shows: `score: 100` or `score: 95+`
- ✅ Backend shows: `missing: 0` or `missing: []`
- ✅ BUT learningPlanCount > 0
- ✅ Console shows: "Building learning plans for top resume skills for practice & mastery"
- ✅ learn.html loads and shows learning content

**Console logs to see:**
```
✅ No missing skills detected
📚 Building learning plans for top resume skills for practice & mastery...
Building plans for 3 skills...
✅ Learning plans built: 3 skills
Response summary: { score: 100, matched: 5, missing: 0, learningPlanCount: 3 }
```

---

### Test Case 3: Partial Match (Some Missing Skills)
**Setup:** Normal use case - resume has some but not all required skills

**Steps:**
1. Upload resume + JD with 2-3 missing skills
2. Open browser console

**Expected Results:**
- ✅ Backend shows: `missing: 2-3`
- ✅ learningPlanCount matches missing count
- ✅ Mini projects shown for each missing skill
- ✅ learn.html shows learning roadmap

**Console logs to see:**
```
Building plans for 3 missing skills...
🎯 Building learning plan for: MissingSkill1
   Using LLM mini projects: 3 projects (or generating if missing)
✅ Learning plan built for MissingSkill1: 3 Telugu videos, 3 projects, 3 easy problems
✅ Learning plans built: 3 skills
```

---

### Test Case 4: Videos Display
**Setup:** Any resume/JD combination

**Steps:**
1. Upload and analyze
2. Click on a skill in results → goes to learn.html
3. Scroll down to videos section
4. Open browser console

**Expected Results:**
- ✅ Videos appear in multiple languages
- ✅ Console shows: `✅ Iframe loaded: [Video Title]`
- ✅ Video thumbnails visible
- ✅ YouTube embeds working (not broken)

**Console logs to see:**
```
learn.html?skill=python:1 ✅ Iframe loaded: Learn Python - Full Course
learn.html?skill=python:1 ✅ Iframe loaded: Python Basics - Getting Started
```

---

### Test Case 5: Projects Tab
**Setup:** After analyzing a resume

**Steps:**
1. Click "Learn" on any missing skill
2. Go to learn.html?skill=SkillName
3. Look for Projects/Mini Projects section
4. Check console for generation logs

**Expected Results:**
- ✅ Projects section visible and populated
- ✅ 3 project ideas shown
- ✅ Each has title and description
- ✅ Console shows mini projects generation

**Console logs to see:**
```
🎯 Building learning plan for: Python
   Using LLM mini projects: 3 projects
(or if regenerated)
   No mini projects from LLM, generating for Python...
🚀 Generating mini projects for: Python
✅ Generated 3 mini projects for Python
```

---

### Test Case 6: Problems Section
**Setup:** After analyzing a resume

**Steps:**
1. Go to learn.html for a skill
2. Scroll to Problems section
3. Check for Easy/Medium/Hard categories
4. Check console

**Expected Results:**
- ✅ Easy problems shown (3 items)
- ✅ Medium problems shown (3 items)
- ✅ Hard problems shown (3 items)
- ✅ Links are clickable (HackerRank/LeetCode/Kaggle)
- ✅ No errors in console about missing problems

---

### Test Case 7: Console Errors Check
**Setup:** Complete analysis flow

**Steps:**
1. Upload resume + JD
2. Wait for redirect to result.html
3. Open console
4. Check result.html for errors
5. Go to learn.html
6. Check learn.html for errors

**Expected Results:**
- ✅ No TypeError about null/undefined elements
- ✅ No "Unexpected end of JSON input" errors
- ✅ No blank learning plans
- ✅ All data loading successfully

**Errors to NOT see:**
```
❌ Cannot read properties of null (reading 'style')
❌ Unexpected end of JSON input
❌ Cannot push to undefined array
```

---

## Full Flow Test (End-to-End)

### Step 1: Prepare Test Files
- Get a sample resume PDF
- Get a sample job description PDF
- Mix scenarios: perfect match, partial match, no match

### Step 2: Test Analysis Page
```
1. Go to analysis.html
2. Upload resume
3. Upload JD
4. Click "Analyze"
5. ✅ Check console for all debug logs
```

### Step 3: Test Result Page
```
1. Wait for redirect to result.html
2. ✅ Check score displays correctly
3. ✅ Check missing skills show
4. ✅ Check matched skills show
5. ✅ Check projects section shows
6. Check backend response summary:
   - score > 0
   - matched >= 0
   - missing >= 0
   - learningPlanCount >= 0 (should be > 0!)
```

### Step 4: Test Learn Page
```
1. Click on a missing skill
2. Go to learn.html?skill=SkillName
3. ✅ Check header with skill name
4. ✅ Check mini projects tab has content
5. ✅ Check videos section shows
6. ✅ Check problems section shows
7. ✅ Check console has no errors
```

### Step 5: Verify Console Logs
```
Open browser console (F12 → Console tab)

Expected to see (in order):
✅ Backend receives request
✅ PDF extraction
✅ LLM analysis (success or with generateMiniProjects)
✅ Learning plan building
✅ Video fetching
✅ Problems loading
✅ Analysis complete with non-zero counts
```

---

## Debugging Commands

### Check Backend Logs
```bash
cd /Users/jaswanthkumar/Desktop/shared\ folder/hiero\ backend
npm logs
# or check the running server output
```

### Check if OpenRouter is Configured
```bash
echo $OPENROUTER_API_KEY
# Should not be empty
```

### Check if YouTube API is Configured
```bash
echo $YOUTUBE_API_KEY
# Should not be empty
```

### Test LLM Mini Projects Generation
```bash
# On backend console, manually test:
const projects = await generateMiniProjects('Python', 'it');
console.log(projects);
# Should return array of 3 strings
```

---

## Expected Console Output Sequence

### Perfect Match Scenario:
```
📥 /api/analyze request received
📄 Extracting Resume from file: uploads/...pdf
✅ Resume extracted, length: 3091
📋 === COMPUTING RULE-BASED ANALYSIS ===
✅ Rule-based analysis complete
   Domain: it
   JD Skills: 5
   CV Skills: 8
   Matched: 5
   Missing: 0
   Score: 100%
🤖 === USING LLM-POWERED ENHANCEMENT ===
✅ LLM analysis complete
✅ LLM values accepted and merged
✅ No missing skills detected
📚 Building learning plans for top resume skills for practice & mastery...
Building plans for 3 skills...
🎯 Building learning plan for: Python
   Using LLM mini projects: 3 projects
📺 Fetching videos: Python (telugu) - query: "..."
✅ Retrieved 3 videos for Python (telugu)
✅ Learning plan built for Python: 3 Telugu videos, 3 projects, 3 easy problems
✅ Learning plans built: 3 skills
✅ === ANALYSIS COMPLETE ===
Response summary: { score: 100, matched: 5, missing: 0, learningPlanCount: 3 }
```

### Partial Match Scenario:
```
📥 /api/analyze request received
...
✅ Rule-based analysis complete
   Missing: 2 [Docker, Kubernetes]
   Score: 60%
🤖 === USING LLM-POWERED ENHANCEMENT ===
✅ LLM analysis complete
📚 === BUILDING LEARNING PLAN ===
Building plans for 2 missing skills...
🎯 Building learning plan for: Docker
   No mini projects from LLM, generating for Docker...
🚀 Generating mini projects for: Docker
✅ Generated 3 mini projects for Docker
✅ Learning plan built for Docker: 3 Telugu videos, 3 projects, 3 easy problems
✅ Learning plans built: 2 skills
Response summary: { score: 60, matched: 3, missing: 2, learningPlanCount: 2 }
```

---

## Success Criteria

✅ All 4 scenarios work (perfect, partial, no match, JSON fail)
✅ No TypeError or null reference errors
✅ learningPlanCount > 0 in all cases
✅ Mini projects always populated
✅ Videos showing in console
✅ learn.html displays all sections
✅ No empty arrays in learning plans
✅ All console logs clean and informative

---

## Troubleshooting

### Problem: learningPlanCount still 0
**Check:**
1. Is finalMissing or finalResumeSkills empty?
2. Is OPENROUTER_API_KEY set?
3. Look for "OpenRouter not configured" in logs

**Fix:**
```bash
# Set env var
export OPENROUTER_API_KEY=your_key
npm start
```

### Problem: Mini projects still empty
**Check:**
1. See "Generated N mini projects" in logs?
2. Is LLM call failing?
3. Check OpenRouter API status

**Debug:**
```
🚀 Generating mini projects for: Skill
(should follow with success message)
```

### Problem: Videos not showing
**Check:**
1. Is YOUTUBE_API_KEY set?
2. See "Iframe loaded" in console?
3. Check for YouTube embed errors

**Fix:**
```bash
export YOUTUBE_API_KEY=your_key
npm start
```

### Problem: Console shows extension error
**Not a problem!** It's from a browser extension, not your code.
Solution: Test in incognito window or disable extensions.

---

## Files to Monitor

1. **Backend logs:**
   - `/Users/jaswanthkumar/Desktop/shared\ folder/hiero\ backend/backend.log`
   - Running console output

2. **Browser console:**
   - F12 → Console tab
   - Look for emoji-prefixed logs

3. **Response data:**
   - Network tab → /api/analyze response
   - Check JSON structure

---

## Sign-Off Checklist

- [ ] Test Case 1: LLM JSON Failure ✅
- [ ] Test Case 2: Perfect Match ✅
- [ ] Test Case 3: Partial Match ✅
- [ ] Test Case 4: Videos Display ✅
- [ ] Test Case 5: Projects Tab ✅
- [ ] Test Case 6: Problems Section ✅
- [ ] Test Case 7: Console Errors ✅
- [ ] End-to-End Full Flow ✅
- [ ] No TypeError or crashes ✅
- [ ] learningPlanCount > 0 always ✅
- [ ] Mini projects populated ✅
- [ ] All sections showing ✅

---

## Ready to Deploy? ✨

If all tests pass, the system is ready for production use!

The three fixes ensure:
1. **Mini projects always generated** (even if LLM JSON fails)
2. **Perfect matches get learning content** (top 3 resume skills)
3. **Robust LLM parsing** (graceful fallbacks)

Users will now see complete, actionable learning roadmaps! 🎉
