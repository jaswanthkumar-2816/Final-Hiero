# HIERO — Clean Architecture

> AI-Powered Career Companion for Smart India Hackathon (SIH)

## Architecture

```
gateway.js              ← Pure orchestration (<80 lines)
│
├── config/             ← Configuration (DB, Passport, Constants)
├── middleware/          ← Auth, Validation, Error Handling
├── utils/              ← Shared: AI, Email, YouTube, Helpers
├── modules/            ← Feature modules (self-contained)
│   ├── auth/           ← Authentication & OAuth
│   ├── mastery/        ← Skill trees, diagnostics, assessment
│   ├── learning/       ← Multilingual dashboard, video progress
│   ├── analysis/       ← JD parsing, skill gap detection
│   ├── problems/       ← Coding problem bank
│   ├── resume/         ← Resume builder & templates
│   ├── interview/      ← AI mock interviews
│   └── payment/        ← Razorpay integration
├── models/             ← MongoDB schemas
├── public/             ← Frontend HTML/CSS/JS
└── templates/          ← Resume PDF templates
```

## Module Structure

Each module follows the same pattern:

```
modules/mastery/
├── mastery.routes.js      ← Route definitions
├── mastery.controller.js  ← Request handlers
├── mastery.service.js     ← Business logic (optional)
└── tree.service.js        ← Domain-specific services
```

## Key Principles

1. **Modules only import from shared layers** — Never module-to-module
2. **Single AI wrapper** — `utils/ai.js` is the only file calling Groq
3. **Server-side grading** — Never trust client-sent questions
4. **Centralized errors** — One error handler, not 22 try/catches
5. **Clean gateway** — Gateway.js is pure orchestration

## Quick Start

```bash
# Install dependencies
npm install

# Set environment variables
cp .env.example .env
# Edit .env with your API keys

# Start server
npm start
```

## Environment Variables

```env
# Required
JWT_SECRET=your-secret-key
MONGODB_URI=mongodb+srv://...

# Optional (features degrade gracefully without these)
GROQ_API_KEY=gsk_...
YOUTUBE_API_KEY=AIza...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...
EMAIL_USER=...
EMAIL_PASS=...
```

## API Endpoints

### Auth
- `POST /signup` — Create account
- `POST /login` — Sign in
- `GET /auth/google` — Google OAuth
- `GET /auth/github` — GitHub OAuth

### Mastery
- `POST /api/mastery/diagnostic-10q` — Generate 10-question diagnostic
- `POST /api/mastery/grade-diagnostic` — Grade and set learning path
- `POST /api/mastery/submit-practice` — Record coding practice
- `POST /api/mastery/submit-assessment` — Grade topic MCQ
- `GET /api/mastery/path/:userId/:skill` — Full skill tree + progress
- `GET /api/mastery/overview/:userId` — All skills summary

### Learning
- `GET /api/learning/dashboard` — Multilingual learning dashboard
- `POST /api/learning/video/heartbeat` — Track video progress
- `POST /api/learning/quiz/submit` — Tier promotion quiz

### Analysis
- `POST /api/analysis/analyze` — Resume vs JD analysis
- `POST /api/analysis/get-videos` — Curated tutorial videos

### Problems
- `GET /api/problems` — List problems (filter by skill/difficulty)
- `GET /api/problems/:id` — Get specific problem
- `POST /api/problems/generate` — AI-generated problem

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Express.js (Node.js) |
| Database | MongoDB Atlas |
| AI | Groq Llama-3.3-70B |
| PDF | Puppeteer |
| Auth | JWT + Passport.js |
| Payments | Razorpay |

## SIH Demo Flow

1. **Upload Resume + JD** → ATS score (0-100)
2. **Skill Gap Detection** → Missing skills highlighted
3. **Learning Roadmap** → 5 regional languages
4. **Mastery Engine** → Track progress (NOT_STARTED → MASTERED)
5. **Mock Interview** → AI voice practice
6. **Resume Builder** → 22+ ATS templates → PDF export
