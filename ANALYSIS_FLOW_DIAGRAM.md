# 🔄 Complete Analysis Flow Diagram

## Overall Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                     HIERO ANALYSIS SYSTEM                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  FRONTEND (Browser)              BACKEND (Node.js)    EXTERNAL     │
│  ┌──────────────────────────┐   ┌──────────────────┐ ┌──────────┐ │
│  │ analysis.html            │   │ /api/analyze     │ │ OpenAI  │ │
│  │ ┌─ Upload Resume ┐       │   │ ┌─ Extract PDF ┐ │ │ Router  │ │
│  │ └─ Upload JD    ┘       │───→│ ├─ Call LLM   ├─→│ Mistral │ │
│  │                          │   │ ├─ YouTube API├─→│ 7B      │ │
│  │                          │   │ └─ Problem DB ┘ │ │         │ │
│  │                          │   └──────────────────┘ └──────────┘ │
│  │                          │         ↓                            │
│  │ ┌──────────────────────┐ │   Response JSON                    │
│  │ │ result.html          │←──   with learningPlan              │
│  │ │ ┌─ Score ┐          │ │                                     │
│  │ │ ├─ Matched │         │ │   ┌──────────────────┐             │
│  │ │ └─ Missing ┘         │ │   │ YouTube API      │             │
│  │ │                      │ │   └──────────────────┘             │
│  │ └──────────────────────┘ │         ↑                          │
│  │         ↓                │         │ (Real Video IDs)         │
│  │ localStorage stores      │         │                          │
│  │ ├─ analysisResult        │    ┌──────────────────┐            │
│  │ └─ hieroLearningPlan     │    │ HackerRank/      │            │
│  │                          │    │ LeetCode/Kaggle  │            │
│  │ ┌──────────────────────┐ │    │ Problem Links    │            │
│  │ │ learn.html           │ │    └──────────────────┘            │
│  │ │ ┌─ Mini Projects ┐   │ │                                    │
│  │ │ ├─ Videos ┐      │   │ │                                    │
│  │ │ ├─ Problems ┘    │   │ │                                    │
│  │ │ └─ Roadmap ┘     │   │ │                                    │
│  │ └──────────────────┘   │ │                                    │
│  └──────────────────────────┘   └──────────────────────────────┘ │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Request Flow: Step-by-Step

### Step 1: User Uploads Resume + JD

```
┌─ User on analysis.html
├─ Selects resume.pdf
├─ Selects job_desc.pdf (or pastes text)
└─ Clicks "Analyze"
   └─ Calls /api/analyze (POST)
```

### Step 2: Backend Extracts Text

```
/api/analyze receives:
{
  files: { 
    resume: [file], 
    jd: [file] 
  }
}
   ↓
extractPdf(resume_file) → 1500 characters of text
extractPdf(jd_file) → 800 characters of text
   ↓
Continue with LLM analysis
```

### Step 3: LLM Brain Analysis

```
analyzeWithLLM(jdText, resumeText)
   ↓
OpenRouter API Call:
{
  model: "mistralai/mistral-7b-instruct",
  messages: [{
    role: "user",
    content: "Analyze JD: {...} and Resume: {...}"
  }]
}
   ↓
LLM Returns:
{
  domain: "it",
  jdSkills: ["python", "sql", "react"],
  resumeSkills: ["python", "html"],
  matchedSkills: ["python"],
  missingSkills: ["sql", "react"],
  score: 33,
  learningPlan: [
    {
      skill: "sql",
      miniProjects: ["3 ideas"],
      videoSearchQueries: {
        telugu: "sql tutorial telugu",
        hindi: "sql tutorial hindi",
        ...
      },
      problems: {
        easy: ["3 descriptions"],
        medium: ["3 descriptions"],
        hard: ["3 descriptions"]
      }
    },
    { skill: "react", ... }
  ]
}
```

### Step 4: Build Learning Plan with Real Data

For each missing skill (sql, react):

```
buildLearningPlanForSkill("sql", "it", llmPlanItem)
   ├─ For each language (telugu, hindi, tamil, english, kannada):
   │  └─ Call getVideosForSkillAndLanguage(
   │       skill: "sql",
   │       language: "telugu",
   │       searchQuery: "sql tutorial telugu"  ← FROM LLM
   │     )
   │     └─ YouTube API search with query
   │        └─ Returns: [
   │          {
   │            title: "SQL Tutorial For Beginners",
   │            videoId: "abc123",
   │            url: "https://www.youtube.com/embed/abc123",
   │            watchUrl: "https://www.youtube.com/watch?v=abc123"
   │          },
   │          { ... video 2 ... },
   │          { ... video 3 ... }
   │        ]
   │
   ├─ Call getProblemsForSkill("sql", llmProblems)
   │  ├─ Check: Is "sql" in practiceProblems? YES ✅
   │  └─ Return:
   │     {
   │       easy: [
   │         { title: "Simple SELECT", url: "https://www.hackerrank.com/challenges/select-all-sql/problem", platform: "HackerRank" },
   │         { ... },
   │         { ... }
   │       ],
   │       medium: [ ... 3 problems ... ],
   │       hard: [ ... 3 problems ... ]
   │     }
   │
   └─ Merge everything:
      {
        skill: "sql",
        miniProjects: ["3 LLM ideas"],
        videos: {
          telugu: [3 real YouTube videos],
          hindi: [3 real YouTube videos],
          tamil: [3 real YouTube videos],
          english: [3 real YouTube videos],
          kannada: [3 real YouTube videos]
        },
        problems: {
          easy: [3 HackerRank links],
          medium: [3 HackerRank links],
          hard: [3 HackerRank links]
        },
        llmProblems: {
          easy: ["3 problem descriptions from LLM"],
          medium: [...],
          hard: [...]
        }
      }

Same for "react" skill...
```

### Step 5: Return Complete Response

```
Response from /api/analyze:
{
  domain: "it",
  jdSkills: ["python", "sql", "react"],
  resumeSkills: ["python", "html"],
  matched: ["python"],
  missing: ["sql", "react"],
  extraSkills: ["html"],
  score: 33,
  learningPlan: [
    {
      skill: "sql",
      miniProjects: ["3 LLM ideas"],
      videos: { telugu: [3 videos], hindi: [3 videos], ... },
      problems: { easy: [3 links], medium: [3 links], hard: [3 links] },
      llmProblems: { easy: ["3 texts"], medium: ["3 texts"], hard: ["3 texts"] }
    },
    {
      skill: "react",
      miniProjects: ["3 LLM ideas"],
      videos: { telugu: [3 videos], hindi: [3 videos], ... },
      problems: { easy: [3 links], medium: [3 links], hard: [3 links] },
      llmProblems: { easy: ["3 texts"], medium: ["3 texts"], hard: ["3 texts"] }
    }
  ]
}
```

### Step 6: Frontend Stores & Redirects

```
script.js receives response:
   ├─ localStorage.setItem('analysisResult', transformedData)
   ├─ localStorage.setItem('hieroLearningPlan', result.learningPlan)
   └─ setTimeout(...) → window.location.href = 'result.html'
```

### Step 7: Result Page Displays

```
result.html loads:
   ├─ Reads analysisResult from localStorage
   ├─ Shows:
   │  ├─ Score (33%)
   │  ├─ Matched Skills: ["python"]
   │  ├─ Missing Skills: ["sql", "react"]
   │  └─ Extra Skills: ["html"]
   └─ Button: "Learn Your Missing Skills"
      └─ Navigates to learn.html
```

### Step 8: Learn Page Displays

```
learn.html loads:
   ├─ Reads hieroLearningPlan from localStorage
   ├─ For each skill in learningPlan:
   │  ├─ Display mini projects
   │  ├─ Display videos by language (with tabs)
   │  ├─ Display problems by difficulty (with tabs)
   │  └─ Show problem links (clickable to HackerRank/LeetCode)
   └─ Beautiful cards with animations
```

---

## Data Transformation Pipeline

```
┌─────────────┐
│ Resume PDF  │
│  + JD PDF   │
└──────┬──────┘
       ↓
┌──────────────────────────┐
│ extractPdf()             │
│ Returns: Text strings    │
└──────┬───────────────────┘
       ↓
┌──────────────────────────────────────┐
│ analyzeWithLLM()                     │
│ Input:  Raw text                     │
│ Output: Structured JSON with         │
│         domain, skills, score,       │
│         learningPlan (with search    │
│         queries, not URLs!)          │
└──────┬───────────────────────────────┘
       ↓
┌──────────────────────────────────────┐
│ For Each Missing Skill:              │
│ buildLearningPlanForSkill()          │
│                                      │
│ ├─ For each language:                │
│ │  getVideosForSkillAndLanguage()   │
│ │  ├─ Input:  LLM's search query    │
│ │  └─ Output: Real YouTube videos   │
│ │                                    │
│ ├─ getProblemsForSkill()            │
│ │  ├─ Check practiceProblems map    │
│ │  └─ Return real HackerRank links  │
│ │                                    │
│ └─ Output: Complete skill plan      │
└──────┬───────────────────────────────┘
       ↓
┌──────────────────────────────────────┐
│ Response JSON                        │
│ ├─ Score, domain, skills            │
│ └─ learningPlan with:                │
│    ├─ Mini projects (LLM text)       │
│    ├─ Videos (YouTube embeds)        │
│    ├─ Problems (Real links)          │
│    └─ LLM problems (fallback text)   │
└──────┬───────────────────────────────┘
       ↓
┌──────────────────────────────────────┐
│ script.js stores in localStorage:    │
│ ├─ analysisResult                    │
│ └─ hieroLearningPlan                 │
└──────┬───────────────────────────────┘
       ↓
┌──────────────────────────────────────┐
│ Redirects to result.html             │
│                                      │
│ Then to learn.html                   │
│ └─ Reads from localStorage           │
│    └─ Renders beautiful UI           │
└──────────────────────────────────────┘
```

---

## Error Handling Flow

```
┌─ User uploads Resume + JD
│
├─ extractPdf fails?
│  └─ Fallback: Try UTF-8 text extraction
│     └─ If all fails: Return error with helpful message
│
├─ LLM API call fails?
│  └─ Fallback: Use rule-based analysis
│     ├─ detectDomain()
│     ├─ extractSkillsFromText()
│     └─ Compute score manually
│
├─ YouTube API fails?
│  └─ Return empty videos array (UI handles gracefully)
│     └─ Log: "Videos unavailable for {skill} in {language}"
│
├─ Problem DB lookup fails?
│  └─ Return LLM-generated problem descriptions
│     └─ User sees problem text instead of links
│
└─ All success?
   └─ Return complete, beautiful response
      ├─ Real videos
      ├─ Real problem links
      ├─ Mini project ideas
      └─ Everything working ✅
```

---

## Component Responsibilities

### LLM (OpenRouter)
```
✅ Does:
  • Parses and understands JD + Resume
  • Extracts key skills
  • Identifies matched/missing
  • Generates mini projects
  • Creates problem descriptions
  • Suggests YouTube search queries

❌ Does NOT:
  • Generate real URLs (hallucination risk)
  • Access the internet
  • Validate HackerRank problems exist
  • Know real video IDs
```

### YouTube API
```
✅ Does:
  • Validates search queries
  • Returns real video IDs
  • Provides video metadata (title, thumbnail)
  • Generates embed/watch URLs

❌ Does NOT:
  • Handle LLM hallucinations
  • Provide HackerRank problems
  • Know which videos are best
```

### HackerRank/LeetCode/Kaggle
```
✅ Does:
  • Host real problem collections
  • Provide accessible URLs
  • Maintain problem databases

❌ Does NOT:
  • Have public API (we use manual mapping)
  • Provide auto-fetching of problems
```

### Your Backend (Node.js)
```
✅ Does:
  • Orchestrates all calls
  • Validates responses
  • Merges data safely
  • Provides fallbacks
  • Returns clean JSON

❌ Does NOT:
  • Make up data
  • Generate fake URLs
  • Break on API failures
```

### Your Frontend
```
✅ Does:
  • Shows results beautifully
  • Handles all data types
  • Provides good UX
  • Stores data persistently

❌ Does NOT:
  • Call LLM directly
  • Skip your backend
  • Trust unvalidated links
```

---

## Security & Reliability Summary

| Component | Input | Validation | Output | Risk |
|-----------|-------|-----------|--------|------|
| LLM | Trusted (JD+Resume) | N/A | JSON | Hallucinate URLs |
| YouTube API | LLM query (string) | API validates | Real video IDs | Rate limits |
| Problem DB | Skill name | Code validates | Real URLs | Outdated links |
| Your Backend | User files | Extracts text safely | Merged JSON | None |
| Frontend | localStorage JSON | Trusts backend | HTML | XSS (mitigate) |

**Mitigation for LLM hallucinations:** Only use URLs from:
1. YouTube API response ✅
2. practiceProblems mapping ✅
3. Generated search links only ⚠️ (validate before use)

---

## Performance Timeline

```
User clicks Analyze:
   ├─ 0-1s:   Extract PDFs
   ├─ 1-3s:   Call LLM (waits for response)
   ├─ 3-8s:   For each missing skill:
   │          ├─ Call YouTube API × 5 languages
   │          ├─ Get problem links
   │          └─ Merge data
   └─ 8-10s:  Return response
   
   Total: ~8-10 seconds typical

Frontend redirects after 2s (before complete, UI shows loading)
```

---

## What the End User Sees

### On result.html
```
┌────────────────────────────────┐
│ Resume Match Analysis          │
├────────────────────────────────┤
│                                │
│  Your Match Score: 33%         │
│  ████░░░░░░░░░░░░░░░░░░░      │
│                                │
│  Matched Skills (1)            │
│  • Python                      │
│                                │
│  Missing Skills (2)            │
│  • SQL                         │
│  • React                       │
│                                │
│  [📚 Learn Your Missing Skills]│
│  [↩️ Try Another Resume]       │
│                                │
└────────────────────────────────┘
```

### On learn.html
```
┌──────────────────────────────────────────┐
│ 📚 Your Learning Roadmap                 │
├──────────────────────────────────────────┤
│                                          │
│ SQL 🎯                                   │
│ ─────────────────────────────────────── │
│                                          │
│ Mini Projects:                           │
│ • Build a todo app database              │
│ • Create a sales dashboard               │
│ • Write a data migration script           │
│                                          │
│ Videos: [Telugu] [Hindi] [Tamil] ...     │
│ ├─ SQL Tutorial Telugu                   │
│ ├─ Database Basics Telugu                │
│ └─ Advanced SQL Telugu                   │
│                                          │
│ Practice Problems:                       │
│ Easy:   [3 HackerRank problems] ➜        │
│ Medium: [3 HackerRank problems] ➜        │
│ Hard:   [3 HackerRank problems] ➜        │
│                                          │
├──────────────────────────────────────────┤
│ React ⚛️                                  │
│ [Same structure as above]                │
│                                          │
└──────────────────────────────────────────┘
```

---

**Key Principle:** LLM generates ideas (text), APIs provide facts (links, videos). Together = amazing! 🚀
