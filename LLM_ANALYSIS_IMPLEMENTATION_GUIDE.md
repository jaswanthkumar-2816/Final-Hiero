# 🤖 LLM-Powered Analysis System Implementation Guide

**Date:** November 21, 2025  
**Status:** ✅ Implemented & Ready to Test

---

## 📋 Overview

Your analysis system now uses a **hybrid approach**:
- **LLM (OpenRouter)** = The Brain 🧠
  - Parses JD + Resume
  - Computes match score
  - Identifies matched/missing skills
  - Generates mini projects
  - Creates problem descriptions
  - Suggests YouTube search queries per language

- **Real APIs** = The Connectors 🔗
  - **YouTube API** fetches real videos using LLM's search queries
  - **HackerRank/LeetCode/Kaggle** links from curated mapping
  - **Your Problem Bank** provides platform links + LLM fallback

---

## 🎯 What Was Changed

### 1. **Backend (`simple-analysis-server.js`)**

#### New LLM Function: `analyzeWithLLM(jdText, resumeText)`
- **Takes:** Full resume text + JD text
- **Returns:** Structured JSON with:
  ```json
  {
    "domain": "it",
    "jdSkills": ["python", "sql"],
    "resumeSkills": ["python"],
    "matchedSkills": ["python"],
    "missingSkills": ["sql"],
    "score": 70,
    "learningPlan": [
      {
        "skill": "sql",
        "miniProjects": ["3 ideas"],
        "videoSearchQueries": {
          "telugu": "sql tutorial telugu",
          "hindi": "sql tutorial hindi",
          "tamil": "sql tutorial tamil",
          "english": "sql tutorial english",
          "kannada": "sql tutorial kannada"
        },
        "problems": {
          "easy": ["3 problems"],
          "medium": ["3 problems"],
          "hard": ["3 problems"]
        }
      }
    ]
  }
  ```

#### New Helper: `getVideosForSkillAndLanguage(skill, language, searchQuery)`
- **Takes:** Skill name, language (telugu/hindi/tamil/english/kannada), search query from LLM
- **Uses:** YouTube API with custom search query
- **Returns:** Array of 3 real video objects:
  ```json
  [
    {
      "title": "SQL Tutorial for Beginners",
      "videoId": "abc123",
      "url": "https://www.youtube.com/embed/abc123",
      "watchUrl": "https://www.youtube.com/watch?v=abc123",
      "thumbnail": "...",
      "duration": "~10 min"
    }
  ]
  ```

#### New Helper: `getProblemsForSkill(skill, llmProblems)`
- **Priority 1:** Check curated `practiceProblems` mapping (HackerRank/LeetCode/Kaggle links)
- **Priority 2:** If not found, use LLM-generated problem descriptions
- **Returns:** Array with easy/medium/hard problems

#### New Function: `buildLearningPlanForSkill(skill, domain, llmPlanItem)`
- **Takes:** Single missing skill + LLM's plan item for that skill
- **Does:**
  1. Fetches 3 real YouTube videos per language using LLM's search queries
  2. Gets curated or LLM-fallback practice problems
  3. Merges everything into complete learning package
- **Returns:** Complete skill learning item

#### Updated `/api/analyze` Endpoint
**Old behavior:** Rule-based skill extraction only
**New behavior:**
1. Extract PDF text
2. **Call OpenRouter LLM** with full JD + Resume text
3. If LLM fails, fallback to rule-based
4. For each missing skill:
   - Build learning plan with YouTube videos
   - Attach problem links
   - Include mini projects
5. Return everything in one JSON response

---

### 2. **Frontend (`script.js`)**

#### Enhanced localStorage Storage
**Before:**
```javascript
localStorage.setItem('analysisResult', JSON.stringify(storageData));
```

**After:**
```javascript
// Store both transformed data AND full learning plan
localStorage.setItem('analysisResult', JSON.stringify(storageData));
localStorage.setItem('hieroLearningPlan', JSON.stringify(result.learningPlan || []));

// Log what was stored
console.log('📚 Learning Plan stored:', result.learningPlan?.length || 0, 'skills');
result.learningPlan.forEach(item => {
  console.log(`   - ${item.skill}: ${item.miniProjects?.length} projects, videos:`, 
    Object.entries(item.videos || {}).map(([lang, vids]) => `${lang}:${vids.length}`).join(', '));
});
```

Now `learn.html` can read this data to:
- Show mini projects per skill
- Display videos grouped by language
- List practice problems by difficulty
- Build a complete learning roadmap

---

## 🔄 Data Flow

```
User uploads Resume + JD
         ↓
   script.js submits to /api/analyze
         ↓
   simple-analysis-server.js extracts text from PDFs
         ↓
   Calls analyzeWithLLM(jdText, resumeText)
         ↓
   OpenRouter returns structured JSON
   (domain, skills, score, learningPlan with search queries)
         ↓
   For each missing skill:
   ├─ buildLearningPlanForSkill() called
   ├─ Fetches real YouTube videos using LLM's search query
   ├─ Gets curated problem links from practiceProblems mapping
   └─ Merges into single learning object
         ↓
   Backend returns complete response
         ↓
   script.js stores in localStorage:
   ├─ analysisResult (score, matched, missing, etc.)
   └─ hieroLearningPlan (full learning plan)
         ↓
   Redirects to result.html
         ↓
   result.html shows score + matched/missing skills
         ↓
   User clicks "Learn Your Skills" button
         ↓
   learn.html reads hieroLearningPlan from localStorage
         ↓
   Shows for each missing skill:
   ├─ Mini project ideas
   ├─ Videos (tabbed by language)
   ├─ Practice problems (grouped by difficulty)
   └─ Roadmap card
```

---

## 📊 Response Structure

The `/api/analyze` endpoint now returns:

```json
{
  "domain": "it",
  "jdSkills": ["python", "sql", "react"],
  "resumeSkills": ["python", "html"],
  "matched": ["python"],
  "missing": ["sql", "react"],
  "extraSkills": ["html"],
  "score": 33,
  "learningPlan": [
    {
      "skill": "sql",
      "miniProjects": [
        "Build a todo app database with CRUD operations",
        "Create a sales dashboard querying a database",
        "Write a data migration script for CSV to SQL"
      ],
      "videos": {
        "telugu": [
          { "title": "SQL Tutorial Telugu", "videoId": "...", "url": "...", ... },
          { "title": "Database Basics Telugu", "videoId": "...", "url": "...", ... },
          { "title": "Advanced SQL Telugu", "videoId": "...", "url": "...", ... }
        ],
        "hindi": [ ...3 videos... ],
        "tamil": [ ...3 videos... ],
        "english": [ ...3 videos... ],
        "kannada": [ ...3 videos... ]
      },
      "problems": {
        "easy": [
          { "title": "Simple SELECT", "url": "https://www.hackerrank.com/challenges/select-all-sql/problem", "platform": "HackerRank" },
          { "title": "SELECT by ID", "url": "https://www.hackerrank.com/challenges/select-by-id/problem", "platform": "HackerRank" },
          { "title": "Countries Query", "url": "https://www.hackerrank.com/challenges/select-from-countries/problem", "platform": "HackerRank" }
        ],
        "medium": [ ...3 problems... ],
        "hard": [ ...3 problems... ]
      },
      "llmProblems": {
        "easy": ["problem text 1", "problem text 2", "problem text 3"],
        "medium": [...],
        "hard": [...]
      }
    },
    {
      "skill": "react",
      "miniProjects": [...],
      "videos": {...},
      "problems": {...}
    }
  ]
}
```

---

## 🚀 How It Works (Step by Step)

### Step 1: LLM Analyzes Everything
```javascript
async function analyzeWithLLM(jdText, resumeText) {
  const prompt = `
You are an expert career assistant.

Given a JOB DESCRIPTION and RESUME, extract:
1. Career domain (it, data, civil, hr, finance, etc.)
2. Skills from JD
3. Skills from resume
4. Match score (0-100)
5. For EACH missing skill:
   - 3 mini projects
   - YouTube search queries per language
   - 9 practice problems (3 easy, 3 medium, 3 hard)

Return ONLY valid JSON.
  `;

  // Call OpenRouter Mistral 7B
  const response = await axios.post(
    'https://openrouter.ai/api/v1/chat/completions',
    { model: 'mistralai/mistral-7b-instruct', messages: [{ role: 'user', content: prompt }] },
    { headers: { Authorization: `Bearer ${OPENROUTER_API_KEY}` } }
  );

  return JSON.parse(response.data.choices[0].message.content);
}
```

**Why this works:**
- LLM has no internet, so it can't hallucinate real URLs ✅
- It CAN generate good search queries and problem descriptions ✅
- Your code validates + uses those safely ✅

### Step 2: Get Real Videos Using LLM's Search Queries
```javascript
async function getVideosForSkillAndLanguage(skill, language, searchQuery) {
  // LLM suggested: "sql tutorial telugu for beginners"
  // We use that EXACT query with YouTube API
  
  const { data } = await axios.get(
    'https://www.googleapis.com/youtube/v3/search',
    {
      params: {
        q: searchQuery,  // Use LLM's search query directly!
        type: 'video',
        maxResults: 5,
        key: YOUTUBE_API_KEY
      }
    }
  );

  // Return real video IDs + URLs (not hallucinated!)
  return data.items.slice(0, 3).map(item => ({
    title: item.snippet.title,
    videoId: item.id.videoId,
    url: `https://www.youtube.com/embed/${item.id.videoId}`,
    watchUrl: `https://www.youtube.com/watch?v=${item.id.videoId}`
  }));
}
```

**Why this is safe:**
- YouTube API validates the query ✅
- Returns real, working video IDs ✅
- LLM's search query is just text, can't harm anything ✅

### Step 3: Link to Real Problem Platforms
```javascript
function getProblemsForSkill(skill, llmProblems) {
  // Try curated mapping FIRST (safe, reliable)
  if (practiceProblems['sql']) {
    return {
      easy: [
        { title: 'Simple SELECT', url: 'https://www.hackerrank.com/challenges/select-all-sql/problem' },
        { ... },
        { ... }
      ],
      medium: [...],
      hard: [...]
    };
  }

  // Fallback to LLM problem descriptions (no URLs, just text)
  return {
    easy: llmProblems.easy.map(text => ({ title: text, platform: 'Custom', description: text })),
    medium: [...],
    hard: [...]
  };
}
```

**Why this is safe:**
- Real HackerRank/LeetCode URLs come from your code, not LLM ✅
- LLM's problem texts are just descriptions, safe to display ✅

### Step 4: Assemble Complete Learning Plan
```javascript
async function buildLearningPlanForSkill(skill, domain, llmPlanItem) {
  // Get videos for all 5 languages using LLM's search queries
  const videosByLang = {};
  for (const lang of ['telugu', 'hindi', 'tamil', 'english', 'kannada']) {
    const searchQuery = llmPlanItem.videoSearchQueries[lang];
    videosByLang[lang] = await getVideosForSkillAndLanguage(skill, lang, searchQuery);
  }

  // Get problem links + descriptions
  const problems = getProblemsForSkill(skill, llmPlanItem.problems);

  return {
    skill,
    miniProjects: llmPlanItem.miniProjects,  // From LLM (safe text)
    videos: videosByLang,                     // From YouTube (safe IDs)
    problems,                                  // From our mapping + LLM (safe)
    llmProblems: llmPlanItem.problems         // Original LLM text
  };
}
```

---

## ⚙️ Configuration

### Required Environment Variables (`.env`)

```bash
# Backend/Analysis Server
PORT=5001
YOUTUBE_API_KEY=your_youtube_api_key_here
OPENROUTER_API_KEY=your_openrouter_api_key_here
```

### Frontend Configuration (`script.js`)

```javascript
const BACKEND_URL = "https://hiero-analysis-part.onrender.com";
// Or for local development:
// const BACKEND_URL = "http://localhost:5001";
```

---

## 📱 Frontend Integration

### In `result.html`

Your existing result page already works! It shows:
- Match score (from `score`)
- Matched skills
- Missing skills
- Extra skills

**Bonus:** Add a "Learn Your Skills" button that navigates to learn.html:
```html
<button class="btn" onclick="window.location.href='learn.html'">
  📚 Learn Your Missing Skills
</button>
```

### In `learn.html`

Read the learning plan from localStorage:

```javascript
window.addEventListener('DOMContentLoaded', async () => {
  // Get learning plan from storage
  const raw = localStorage.getItem('hieroLearningPlan');
  if (!raw) {
    // No analysis done yet, show message
    document.body.innerHTML = '<p>⚠️ Please run analysis first (click Analyze)</p>';
    return;
  }

  const learningPlan = JSON.parse(raw);
  console.log('📚 Learning plan loaded:', learningPlan.length, 'skills');

  // For each missing skill:
  learningPlan.forEach(item => {
    const skill = item.skill;
    
    // 1. Display mini projects
    console.log(`🎯 ${skill} - Mini Projects:`, item.miniProjects);
    
    // 2. Display videos grouped by language
    Object.entries(item.videos).forEach(([lang, videos]) => {
      console.log(`📺 ${skill} (${lang}):`, videos.length, 'videos');
      videos.forEach(v => console.log(`   - ${v.title}`));
    });
    
    // 3. Display problems grouped by difficulty
    Object.entries(item.problems).forEach(([difficulty, problems]) => {
      console.log(`🧩 ${skill} (${difficulty}):`, problems.length, 'problems');
    });
  });
});
```

---

## 🧪 Testing Checklist

- [ ] Backend running: `npm start` in `hiero backend/`
- [ ] `.env` file has `OPENROUTER_API_KEY` and `YOUTUBE_API_KEY`
- [ ] Upload resume + JD to analysis page
- [ ] Check browser console: LLM response should be valid JSON
- [ ] Check localStorage `hieroLearningPlan` has content
- [ ] Navigate to learn.html
- [ ] Verify videos load per language
- [ ] Verify mini projects display
- [ ] Verify problem links work

---

## 🐛 Debugging

### If LLM returns invalid JSON:
```javascript
// In simple-analysis-server.js, around analyzeWithLLM()
const content = data.choices[0].message.content.trim();
console.log('RAW LLM OUTPUT:', content);  // See what LLM actually returned
const json = JSON.parse(content);
```

### If YouTube videos not loading:
```javascript
// Check API key
console.log('YOUTUBE_API_KEY:', YOUTUBE_API_KEY ? '✅ Present' : '❌ Missing');

// Check search query
console.log('Search query for SQL (telugu):', searchQuery);

// Check YouTube API response
console.log('YouTube API response:', data.items?.length, 'results');
```

### If learning plan not in localStorage:
```javascript
// In browser console
JSON.parse(localStorage.getItem('hieroLearningPlan'));
// Should be an array with skill objects
```

---

## 🎨 UI Ideas for learn.html

```
┌─────────────────────────────────────────┐
│  📚 Your Learning Roadmap               │
├─────────────────────────────────────────┤
│                                         │
│  SQL (Missing Skill #1)                 │
│  ────────────────────────────────────── │
│  🎯 Mini Projects:                      │
│  • Build a todo app database            │
│  • Create a sales dashboard             │
│  • Write a data migration script         │
│                                         │
│  📺 Videos:                             │
│  [Telugu] [Hindi] [Tamil] [English]...  │
│  ├─ SQL Tutorial Telugu                 │
│  ├─ Database Basics Telugu              │
│  └─ Advanced SQL Telugu                 │
│                                         │
│  🧩 Practice Problems:                  │
│  Easy   [3 problems from HackerRank]    │
│  Medium [3 problems from LeetCode]      │
│  Hard   [3 problems from Kaggle]        │
│                                         │
├─────────────────────────────────────────┤
│  React (Missing Skill #2)               │
│  [Same structure as above]              │
│                                         │
└─────────────────────────────────────────┘
```

---

## 📝 Summary: LLM Brain + Real APIs

| Component | Source | Reliability |
|-----------|--------|-------------|
| **Domain Detection** | LLM | ⭐⭐⭐⭐ (Educated guess) |
| **Skill Extraction** | LLM | ⭐⭐⭐⭐ (Works well) |
| **Match Score** | LLM | ⭐⭐⭐⭐ (Fair scoring) |
| **Mini Projects** | LLM | ⭐⭐⭐⭐ (Creative ideas) |
| **Problem Descriptions** | LLM | ⭐⭐⭐⭐ (Good text) |
| **Video Search Queries** | LLM | ⭐⭐⭐⭐ (Smart queries) |
| **Real Video URLs** | YouTube API | ⭐⭐⭐⭐⭐ (100% real) |
| **Real Problem Links** | HackerRank/LeetCode | ⭐⭐⭐⭐⭐ (100% real) |

**Key Insight:** LLM is the brain (thinking, creativity), but real APIs provide the facts (links, videos, content).

---

## 🚀 Next Steps

1. **Test the backend:**
   ```bash
   cd "hiero backend"
   npm start
   ```

2. **Upload a resume + JD** on your analysis page

3. **Check the console** for full flow debug logs

4. **Build learn.html UI** to display the learning plan beautifully

5. **Enhance with:**
   - Progress tracking
   - User notes per skill
   - Video playback tracking
   - Problem solving tracking

---

**Questions?** Check the debug logs in both browser console + server logs.

**Ready to test?** Start the backend and run through the analysis flow!
