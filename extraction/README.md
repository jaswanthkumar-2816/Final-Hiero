# 🚀 Groq AI Resume Details Extraction Backend

High-precision, production-grade backend service for extracting structured resume details using the Groq AI model suite (`llama-3.3-70b-versatile`, `llama-3.1-8b-instant`, `mixtral-8x7b-32768`). Built with deterministic anchor algorithms, multi-format document parsing, automatic dynamic novel heading detection, ATS compatibility scoring, and form field mapping.

---

## 🌟 Key Capabilities & Algorithms

1. **Multi-Format Ingestion Engine**
   - Native digital PDF stream extraction (`pdf-parse`) with layout-aware line ordering.
   - DOCX/DOC AST parsing (`mammoth`).
   - Scanned PDF and image OCR (`tesseract.js` for PNG, JPG, WEBP).
   - Plain text / markdown support.

2. **Deterministic Pre-Parsing Algorithm (Ground-Truth Anchors)**
   - Regex extraction for emails (RFC 5322 compliant).
   - Phone numbers with international code support (+91, +1, UK, etc.).
   - Canonical URLs (LinkedIn, GitHub, Portfolios, LeetCode, etc.).
   - Heuristic section boundary segmentation separating standard sections from novel headings.

3. **Groq AI High-Reasoning Extraction with Model Fallback**
   - Primary Model: `llama-3.3-70b-versatile` (128k context, zero hallucination).
   - Failover Chain: `llama-3.1-8b-instant` ➔ `mixtral-8x7b-32768`.
   - Exponential backoff with jitter on HTTP 429 / 503 errors.
   - Resilient self-healing JSON parser.

4. **⭐ Dynamic Novel / Extra Headings Engine (`additionalDetails` & `customDetails`)**
   - Automatically detects ANY non-standard, custom, or novel headings in the resume (e.g., *Seminars & Workshops, Publications, Patents, Guest Lectures, Volunteering, Personal Details, Key Accomplishments, etc.*).
   - Cleans and converts headings to Title Case.
   - Structures content into formatted bullet points (`• `) and individual array items.
   - Exposes both `additionalDetails` (rich object with id, heading, content, items) and `customDetails` (direct compatibility with existing Hiero & Connect-Portal forms).

5. **ATS Optimization & Scoring Engine**
   - 100-point ATS compatibility score.
   - Action verb strength analysis.
   - Quantifiable metrics & number density check.
   - Actionable recommendations to improve candidate resumes.

---

## 🔌 Architecture & Gateway Connection

```
                                  ┌─────────────────────────────┐
                                  │   Hiero Unified Gateway     │
                                  │    http://localhost:2816    │
                                  └──────────────┬──────────────┘
                                                 │
                                 Proxy: /api/extract/*
                                                 │
                                                 ▼
                                  ┌─────────────────────────────┐
                                  │ Extraction Backend Service  │
                                  │    http://localhost:4040    │
                                  └──────────────┬──────────────┘
                                                 │
                     ┌───────────────────────────┴──────────────────────────┐
                     ▼                                                      ▼
        ┌─────────────────────────┐                            ┌─────────────────────────┐
        │  Deterministic Anchors  │                            │    Groq AI Engine       │
        │  Regex + Section Bounds │                            │  llama-3.3-70b / 8b     │
        └────────────┬────────────┘                            └────────────┬────────────┘
                     └───────────────────────────┬──────────────────────────┘
                                                 ▼
                                  ┌─────────────────────────────┐
                                  │  Reconciliation & Normalizer│
                                  │  • additionalDetails Engine │
                                  │  • formFields Binding Map   │
                                  │  • ATS Scoring (0-100)      │
                                  └─────────────────────────────┘
```

---

## 🛠️ Quick Start

### 1. Install & Configure
Dependencies are shared with the root workspace or can be installed standalone:
```bash
cd "extraction"
# Copy environment configuration if needed
cp .env.example .env
```

Ensure `GROQ_API_KEY` is present in `extraction/.env` or root `.env`:
```env
PORT=4040
GROQ_API_KEY=gsk_...
GROQ_PRIMARY_MODEL=llama-3.3-70b-versatile
```

### 2. Start the Extraction Backend (Port 4040)
```bash
# In the extraction directory:
npm start

# Or in development mode with hot reload:
npm run dev

# Or from workspace root:
PORT=4040 node extraction/src/server.js
```

### 3. Run Verification Tests
```bash
npm test
# Or: node extraction/test-extract.js
```

---

## 📡 REST API Reference

### 1. Health Check
`GET http://localhost:4040/api/extract/health`
*(Or via Gateway: `http://localhost:2816/api/extract/health`)*

**Response:**
```json
{
  "status": "online",
  "service": "Groq Resume Details Extraction Backend",
  "port": 4040,
  "groqConfigured": true,
  "primaryModel": "llama-3.3-70b-versatile"
}
```

---

### 2. Upload Resume Document (PDF / DOCX / Image / Text)
`POST http://localhost:4040/api/extract/upload`
*(Or via Gateway: `http://localhost:2816/api/extract/upload`)*

- **Header**: `Content-Type: multipart/form-data`
- **Body field**: `resume` or `file`

**cURL Example:**
```bash
curl -X POST http://localhost:4040/api/extract/upload \
  -F "resume=@/path/to/resume.pdf"
```

---

### 3. Extract from Raw Text
`POST http://localhost:4040/api/extract/text`
*(Or via Gateway: `http://localhost:2816/api/extract/text`)*

- **Header**: `Content-Type: application/json`
- **Body**:
```json
{
  "text": "Full resume text content here...",
  "filename": "candidate_resume.txt"
}
```

**cURL Example:**
```bash
curl -X POST http://localhost:4040/api/extract/text \
  -H "Content-Type: application/json" \
  -d '{"text": "John Doe\nSoftware Engineer\njohn@example.com\n+1 555-123-4567..."}'
```

---

## 📦 Output JSON Schema

```json
{
  "success": true,
  "source": {
    "filename": "Rajesh_Sharma.pdf",
    "charCount": 2450,
    "wordCount": 380
  },
  "meta": {
    "modelUsed": "llama-3.3-70b-versatile",
    "extractedAt": "2026-09-21T04:40:00.000Z"
  },
  "data": {
    "personalInfo": {
      "fullName": "Dr. Rajesh Sharma",
      "professionalTitle": "Senior Machine Learning Engineer",
      "email": "rajesh.sharma.ai@gmail.com",
      "phone": "+91 98450 12345",
      "address": "Bengaluru, Karnataka, India",
      "linkedin": "https://linkedin.com/in/rajesh-sharma-ai",
      "github": "https://github.com/rajesh-sharma-ml",
      "portfolio": "https://rajesh-ai.dev"
    },
    "summary": "Dynamic and results-driven Senior Machine Learning Engineer...",
    "experience": [
      {
        "id": "exp_1",
        "jobTitle": "Lead AI Engineer",
        "company": "NextGen Intelligence Labs",
        "location": "Bengaluru",
        "startDate": "July 2021",
        "endDate": "Present",
        "isCurrent": true,
        "bulletPoints": [
          "Spearheaded the migration of monolithic NLP models to distributed microservices...",
          "Engineered a real-time recommendation system handling 25,000 req/sec..."
        ],
        "description": "• Spearheaded the migration...\n• Engineered a real-time..."
      }
    ],
    "education": [
      {
        "id": "edu_1",
        "degree": "M.Tech in Computer Science & AI",
        "institution": "Indian Institute of Technology (IIT) Madras",
        "gradYear": "2018",
        "cgpaOrPercentage": "9.2 / 10"
      }
    ],
    "skills": {
      "technicalSkills": ["Python", "Go", "PyTorch", "Kubernetes", "PostgreSQL", "AWS"],
      "softSkills": ["Technical Leadership", "Cross-functional Collaboration", "Mentoring"]
    },
    "projects": [...],
    "certifications": [...],
    "languages": [...],

    "additionalDetails": [
      {
        "id": "custom_1",
        "heading": "Seminars & Workshops Attended",
        "content": "• Keynote Speaker at PyData India 2023\n• Attended ICLR 2022, Vienna",
        "items": [
          "Keynote Speaker at PyData India 2023",
          "Attended ICLR 2022, Vienna"
        ]
      },
      {
        "id": "custom_2",
        "heading": "Publications & Patents",
        "content": "• Low-Latency Sparse Attention Mechanisms, IEEE 2023\n• US Patent Granted: Asynchronous Parallel Gradient Desynchronization",
        "items": [
          "Low-Latency Sparse Attention Mechanisms, IEEE 2023",
          "US Patent Granted: Asynchronous Parallel Gradient Desynchronization"
        ]
      }
    ],

    "customDetails": [
      {
        "heading": "Seminars & Workshops Attended",
        "content": "• Keynote Speaker at PyData India 2023\n• Attended ICLR 2022, Vienna"
      }
    ],

    "formFields": {
      "fullName": "Dr. Rajesh Sharma",
      "jobTitle": "Senior Machine Learning Engineer",
      "email": "rajesh.sharma.ai@gmail.com",
      "phone": "+91 98450 12345",
      "technicalSkills": "Python, Go, PyTorch, Kubernetes, PostgreSQL, AWS",
      "experience": [...],
      "education": [...],
      "additionalDetails": [...]
    }
  },
  "atsAnalytics": {
    "overallAtsScore": 92,
    "grade": "Excellent (ATS Optimized)",
    "checks": [...],
    "suggestions": [...]
  }
}
```

---

## 📋 How Frontend Forms Consume the Output

In your React / HTML / Vue resume builder form:
```javascript
// Example: Populating a Resume Form
const response = await fetch('http://localhost:2816/api/extract/upload', {
  method: 'POST',
  body: formData
});
const result = await response.json();

if (result.success) {
  const { formFields, additionalDetails } = result;

  // 1. Direct standard inputs
  document.getElementById('nameInput').value = formFields.fullName;
  document.getElementById('emailInput').value = formFields.email;
  document.getElementById('skillsInput').value = formFields.technicalSkills;

  // 2. Dynamic novel headings in Additional Details
  const container = document.getElementById('customDetailsContainer');
  container.innerHTML = ''; // clear

  additionalDetails.forEach((detail, index) => {
    // Add custom card or input dynamically to form
    const card = document.createElement('div');
    card.className = 'custom-section-card';
    card.innerHTML = `
      <label class="font-bold">${detail.heading}</label>
      <textarea class="form-control" name="custom_${index}">${detail.content}</textarea>
    `;
    container.appendChild(card);
  });
}
```
