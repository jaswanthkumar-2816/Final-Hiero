# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

**Hiero Backend** is a Node.js/Express backend for an AI-powered resume builder and career analysis platform. The system generates professional resumes from user data, analyzes resumes against job descriptions, and provides AI-powered career guidance.

## Development Commands

### Starting the Server
```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

The server runs on port **5003** by default (configurable via `PORT` env variable).

### Testing
There are no formal test suites currently. Test manually using:
```bash
# Health check
curl http://localhost:5003/health

# Test API endpoint
curl http://localhost:5003/api/test
```

### Working with the Gateway
This backend is typically accessed through a gateway on port **2816**. Routes are proxied as:
- Gateway: `http://localhost:2816/api/resume/*` → Backend: `http://localhost:5003/*`
- Static assets: `http://localhost:2816/templates/previews/*` → Backend: `http://localhost:5003/templates/previews/*`

Refer to `GATEWAY_RESUME_MAPPING.md` for complete routing details.

### Deployment
See `DEPLOY_TO_RENDER.md` or `RENDER_DEPLOYMENT.md` for production deployment instructions to Render.

## Architecture

### Core Technologies
- **Runtime**: Node.js with ES Modules (`"type": "module"` in package.json)
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose (optional - resume generation works without DB)
- **Authentication**: JWT tokens (managed via middleware)
- **PDF Generation**: Puppeteer (HTML to PDF) and PDFKit
- **AI/LLM Integration**: Google Gemini, GROQ, OpenRouter APIs
- **Logging**: Winston

### Directory Structure

```
├── controllers/          # Business logic layer
│   ├── resumeController.js      # Resume generation and management
│   ├── analysisController.js    # Resume analysis and scoring
│   └── chatController.js        # AI chat functionality
│
├── routes/              # API route definitions
│   ├── resumeRoutes.js          # Resume endpoints (/api/resume/*)
│   ├── analysisRoutes.js        # Analysis endpoints (/api/analysis/*)
│   └── scoring.js               # Scoring routes
│
├── models/              # MongoDB schemas
│   ├── User.js                  # User with scores, skills, analysis history
│   ├── Resume.js                # Resume data structure
│   └── JobDescription.js
│
├── middleware/
│   └── auth.js                  # JWT authentication middleware
│
├── services/
│   └── analysisEngine.js        # Resume-JD matching and scoring logic
│
├── templates/           # Resume template generators
│   ├── index.js                 # Template router/selector
│   ├── classic.js               # HTML template generators
│   ├── minimal.js
│   ├── modernPro.js
│   ├── rishiTemplate.js
│   ├── hemanthTemplate.js
│   ├── priyaTemplate.js
│   ├── *.tex                    # LaTeX templates (legacy)
│   └── previews/                # Template preview images
│
├── utils/               # Helper utilities
│   ├── unifiedTemplates.js      # Unified PDF generation system
│   ├── latexUtils.js            # LaTeX processing (legacy)
│   └── htmlGenerator.js         # HTML generation helpers
│
├── temp/                # Temporary file storage (ephemeral)
└── server.js            # Main application entry point
```

### Data Flow Architecture

#### Resume Generation Flow
1. Frontend sends resume data to `/download-resume` or `/generate-resume`
2. `server.js` normalizes the data (converts strings to arrays where needed)
3. Template HTML is generated via `templates/index.js` → specific template generator
4. Puppeteer converts HTML to PDF
5. PDF is served for download or preview

#### Authentication Flow
- In-memory user storage (Map) for development
- JWT tokens signed with `JWT_SECRET` (expires in 24h)
- Protected routes use `auth` middleware which extracts `userId` from token
- Endpoints: `/api/auth/signup`, `/api/auth/login`, `/api/auth/demo`

#### Resume Analysis Flow
1. User uploads resume PDF and job description
2. `analysisController` extracts text from PDF
3. `analysisEngine` service performs NLP matching and scoring
4. Results include:
   - Match score (0-100%)
   - Missing skills
   - Recommendations
   - Gap analysis
5. Results stored in-memory (Map) and optionally in MongoDB
6. Re-analysis compares with previous results to show progress

### Key Design Patterns

#### Template System
- **Two-tiered approach**: HTML-based (fast, using Puppeteer) and LaTeX-based (legacy)
- **Unified interface**: All templates accept same data structure via `generateTemplateHTML(templateId, data)`
- **Available templates**: classic, minimal, modern-pro, rishi, hemanth, priya (6 HTML templates) + 10 LaTeX templates

#### Data Normalization
The `normalizeResumeData()` function in `server.js` handles frontend data inconsistencies:
- Converts string fields to arrays for `skills`, `certifications`, `languages`, `achievements`, `hobbies`
- Splits by newlines or commas
- Merges `technicalSkills` and `softSkills` into unified `skills` array

#### Storage Strategy
- **Development**: In-memory Maps for users and resumes (`userResumes`, `users`, `analysisResults`)
- **Production**: MongoDB via Mongoose models (User, Resume)
- **Temp files**: Stored in `./temp/` directory (auto-created, ephemeral on Render)

## Environment Variables

Required variables (configured in `.env`):

```bash
PORT=5003                          # Server port (overridden by Render)
JWT_SECRET=your-secret-here        # JWT signing secret
MONGODB_URI=mongodb://...          # Optional MongoDB connection
GROQ_API_KEY=your-key              # For GROQ AI analysis
GEMINI_API_KEY=your-key            # For Google Gemini AI
OPENROUTER_API_KEY=your-key        # For OpenRouter LLM access
NODE_ENV=production                # Environment mode
```

**Development fallback**: If `JWT_SECRET` is not set in non-production, defaults to `'dev-secret-change-me'` with a warning.

## Common Development Tasks

### Adding a New Resume Template

1. Create template generator in `templates/yourTemplate.js`:
```javascript
export function generateYourTemplate(data) {
  const { personalInfo, experience, education, skills } = data;
  return `<html>...your HTML template...</html>`;
}
```

2. Register in `templates/index.js`:
```javascript
import { generateYourTemplate } from './yourTemplate.js';
// Add case to switch statement
case 'your-template':
  return generateYourTemplate(data);
```

3. Add preview image to `templates/previews/your-template.png`

4. Add metadata to `routes/resumeRoutes.js` in `availableTemplates` array

### Modifying Resume Data Structure

If you change the resume data schema:
1. Update `models/Resume.js` Mongoose schema
2. Update `normalizeResumeData()` function in `server.js` if needed
3. Update relevant template generators to handle new fields
4. Update `controllers/resumeController.js` endpoint handlers

### Adding New Analysis Metrics

Analysis logic lives in `services/analysisEngine.js`:
1. Add new scoring algorithms or keyword matching
2. Return additional fields in analysis result
3. Update `controllers/analysisController.js` to handle new metrics
4. Frontend will receive these in the `/api/analysis/analyze` response

### Working with AI APIs

Three AI providers are integrated:
- **GROQ**: Fast inference (used for analysis)
- **Gemini**: Google's LLM (used for chat and analysis)
- **OpenRouter**: Multi-model gateway (used for chatbot in `/api/ask`)

To add/modify AI functionality, edit:
- `services/analysisEngine.js` for analysis-related AI
- `controllers/chatController.js` for chat features
- `server.js` `/api/ask` endpoint for general Q&A

## Important Implementation Details

### Puppeteer Configuration
Puppeteer runs in headless mode with sandbox disabled for Render compatibility:
```javascript
puppeteer.launch({
  headless: 'new',
  args: ['--no-sandbox', '--disable-setuid-sandbox']
})
```

### CORS Configuration
Wide-open CORS for development (origin: '*'). Tighten in production:
```javascript
app.use(cors({ 
  origin: '*',  // Change to specific domains in production
  methods: ['GET', 'POST', 'OPTIONS'], 
  credentials: false
}));
```

### Caching Headers
All API responses have aggressive no-cache headers to prevent stale data issues.

### MongoDB Connection
MongoDB is optional - the app will start even if connection fails:
```javascript
if (process.env.MONGODB_URI && process.env.MONGODB_URI.includes('mongodb')) {
  mongoose.connect(process.env.MONGODB_URI)
    .then(() => logger.info('MongoDB connected'))
    .catch((err) => {
      logger.error('MongoDB connection error:', err);
      logger.info('Continuing without MongoDB...');
    });
}
```

### Resume Data Endpoints

Three main endpoints with different purposes:
- **`/generate-resume`**: Creates PDF, returns filename reference
- **`/download-resume`**: Creates PDF and triggers browser download
- **`/preview-resume`**: Returns HTML (no PDF conversion) for fast iframe preview

## Debugging Tips

### Enable Debug Logging
Set Winston log level in `server.js` to see detailed logs:
```javascript
const logger = winston.createLogger({
  level: 'debug',  // Change from 'info' to 'debug'
  // ...
});
```

### Inspect Resume Data
Resume generation logs full request body:
```javascript
console.log('📦 FULL REQUEST BODY:', JSON.stringify(req.body, null, 2));
```
Check server logs during `/download-resume` calls.

### Test Template Rendering
Access HTML preview directly:
```bash
curl -X POST http://localhost:5003/preview-resume \
  -H "Content-Type: application/json" \
  -d '{"template":"classic","personalInfo":{"fullName":"Test User"}}'
```

### Check Auth Issues
Auth middleware logs warnings in non-production mode. Look for:
```
[AUTH] No token provided for POST /api/resume/generate
[AUTH] Invalid token for POST /api/resume/preview
```

## Notes for AI Assistants

- **File paths**: Use absolute paths for the directory `/Users/jaswanthkumar/Desktop/shared folder/hiero backend` (note the space in "shared folder")
- **Module system**: This project uses ES Modules - always use `import/export`, never `require()`
- **Authentication**: Most `/api/resume/*` routes require JWT auth except `/download`, `/templates`, and public previews
- **In-memory storage**: Development uses Map storage; don't assume MongoDB is available
- **Template naming**: Template IDs are case-insensitive and flexible (e.g., 'modern-pro', 'modernpro', 'ModernPro' all work)
- **Deployment context**: Code is written to work both locally (port 5003) and on Render (dynamic port via `process.env.PORT`)
