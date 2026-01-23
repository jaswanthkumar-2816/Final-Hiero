# Resume Builder Flow - Visual Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    RESUME BUILDER WORKFLOW                      │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  STEP 1: TEMPLATE SELECTION (resume-builder.html loads)        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  [Template Grid - 10 Cards Displayed]                          │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐         │
│  │ Classic  │ │ Minimal  │ │Modern Pro│ │Tech Focus│         │
│  │          │ │          │ │ PREMIUM  │ │          │         │
│  │ [Preview]│ │ [Preview]│ │ [Preview]│ │ [Preview]│         │
│  │  [Start] │ │  [Start] │ │  [Start] │ │  [Start] │         │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘         │
│  ... 6 more templates ...                                      │
│                                                                 │
│  USER ACTION:                                                   │
│  • Click [Preview] → previewTemplate(id) → Shows modal        │
│  • Click [Start Building] → startBuilding(id) → Step 2        │
│                                                                 │
│  RESULT:                                                        │
│  selectedTemplate = "modern-pro"  (saved to localStorage)      │
└─────────────────────────────────────────────────────────────────┘
                              ↓
                    startBuilding(templateId)
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  STEP 2: FILL INFORMATION (Form + Live Preview)                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─── Step Indicator ─────────────────────────────────────┐   │
│  │ [← Change Template] Step 2: Fill Your Information      │   │
│  │                     (Using Modern Pro template)         │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─── Left Side (Form) ─────┐  ┌─── Right Side (Preview) ───┐│
│  │                           │  │                             ││
│  │ PERSONAL INFORMATION      │  │   [Live HTML Preview]       ││
│  │ ┌──────────────────────┐ │  │                             ││
│  │ │ Full Name: John Doe  │ │  │   John Doe                  ││
│  │ │ Email: john@ex.com   │ │  │   john@example.com          ││
│  │ │ Phone: 555-1234      │ │  │   (555) 123-4567            ││
│  │ └──────────────────────┘ │  │                             ││
│  │                           │  │   EXPERIENCE                ││
│  │ EXPERIENCE                │  │   • Software Engineer       ││
│  │ ┌──────────────────────┐ │  │     Tech Corp               ││
│  │ │ Job Title: Soft Eng  │ │  │     2020 - 2023             ││
│  │ │ Company: Tech Corp   │ │  │                             ││
│  │ │ Dates: 2020-2023     │ │  │   EDUCATION                 ││
│  │ └──────────────────────┘ │  │   • BS Computer Science     ││
│  │                           │  │     MIT, 2020               ││
│  │ EDUCATION                 │  │                             ││
│  │ [Form fields...]          │  │   SKILLS                    ││
│  │                           │  │   JavaScript, React...      ││
│  │ SKILLS                    │  │                             ││
│  │ [Form fields...]          │  │                             ││
│  │                           │  │                             ││
│  └───────────────────────────┘  └─────────────────────────────┘│
│                                                                 │
│  ┌─── Bottom Actions ──────────────────────────────────────┐  │
│  │ [Save Progress]              [✨ Generate Resume PDF]   │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                                 │
│  TEMPLATE LOCKED:                                               │
│  selectedTemplate = "modern-pro" (stored, will be used for PDF)│
└─────────────────────────────────────────────────────────────────┘
                              ↓
                 User clicks [Generate Resume]
                              ↓
                    generateResume(event)
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  STEP 3: PDF GENERATION (Backend Processing)                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Frontend (JavaScript):                                         │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │ 1. collectFormData()                                     │ │
│  │    → Gathers all form values                             │ │
│  │                                                           │ │
│  │ 2. data.template = selectedTemplate ("modern-pro")       │ │
│  │                                                           │ │
│  │ 3. POST request:                                         │ │
│  │    ┌──────────────────────────────────────────────────┐ │ │
│  │    │ URL: /generate-resume      ← ❌ CURRENT (WRONG)  │ │ │
│  │    │ Backend: Auth Backend (port 3000)                 │ │ │
│  │    │ Result: Basic HTML → PDF (all look the same)     │ │ │
│  │    └──────────────────────────────────────────────────┘ │ │
│  │                                                           │ │
│  │    ┌──────────────────────────────────────────────────┐ │ │
│  │    │ URL: /api/resume/generate-fast  ← ✅ SHOULD BE  │ │ │
│  │    │ Backend: Hiero Backend (port 5003)                │ │ │
│  │    │ Headers: { Authorization: Bearer JWT_TOKEN }      │ │ │
│  │    │ Result: LaTeX/PDFKit → Professional PDF          │ │ │
│  │    └──────────────────────────────────────────────────┘ │ │
│  │                                                           │ │
│  │ 4. Payload sent to backend:                              │ │
│  │    {                                                     │ │
│  │      template: "modern-pro",                             │ │
│  │      personalInfo: { fullName, email, phone... },        │ │
│  │      experience: [...],                                  │ │
│  │      education: [...],                                   │ │
│  │      technicalSkills: "...",                             │ │
│  │      ...                                                 │ │
│  │    }                                                     │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                 │
│  Backend Processing (Hiero Backend - Node.js):                 │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │ resumeController.js:                                     │ │
│  │                                                           │ │
│  │ 1. Verify JWT token → Get user ID                       │ │
│  │ 2. Extract template ID: "modern-pro"                     │ │
│  │ 3. Load template from templates folder:                 │ │
│  │    /templates/modern-pro.tex  (LaTeX)                   │ │
│  │    OR use PDFKit generator with modern-pro styling      │ │
│  │ 4. Replace placeholders with user data                  │ │
│  │ 5. Generate PDF:                                         │ │
│  │    - If LaTeX: Run pdflatex compiler                    │ │
│  │    - If PDFKit: Use template-specific styling           │ │
│  │ 6. Save to: /generated/user123/resume-modern-pro.pdf    │ │
│  │ 7. Return download URL                                  │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                 │
│  Response to Frontend:                                          │
│  {                                                              │
│    "success": true,                                             │
│    "url": "http://localhost:5003/download/resume-12345.pdf",   │
│    "template": "modern-pro"                                     │
│  }                                                              │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  RESULTS SCREEN (Success)                                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ✅ Resume Generated Successfully!                              │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │  📄 Your resume is ready!                               │  │
│  │                                                          │  │
│  │  Template: Modern Professional                          │  │
│  │                                                          │  │
│  │  [⬇️ Download PDF]  [✉️ Email Me]  [🔄 Create Another] │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                                 │
│  Each template produces a UNIQUE PDF:                           │
│  • Classic: Traditional serif fonts, centered header           │
│  • Modern Pro: Gradient header, colorful accents               │
│  • Tech Focus: Code-style formatting, skills-first             │
│  • Creative Bold: Large sidebar, visual elements               │
│  • ... etc (all 10 templates visually distinct)                │
└─────────────────────────────────────────────────────────────────┘


═══════════════════════════════════════════════════════════════════
                        PROBLEM DIAGNOSIS
═══════════════════════════════════════════════════════════════════

❌ CURRENT FLOW (Why all PDFs look the same):

Frontend                    Auth Backend (port 3000)
resume-builder.html  ━━━━━━━━━━━━━━━━━━━━━━━━━━━►  main.js
                                                   │
                     POST /generate-resume         │
                     { template: "modern-pro" }    │
                                                   ▼
                                          generateTemplateHTML()
                                          (Uses basic HTML templates)
                                                   │
                                                   ▼
                                          HTML → PDF Converter
                                          (puppeteer/html-pdf)
                                                   │
                                                   ▼
                                          All templates look the same
                                          (Basic CSS, similar layouts)
                                                   │
                                                   ▼
                                          Returns generic PDF ❌


✅ DESIRED FLOW (Each template unique):

Frontend                    Hiero Backend (port 5003)
resume-builder.html  ━━━━━━━━━━━━━━━━━━━━━━━━━━━►  resumeController.js
                                                   │
          POST /api/resume/generate-fast          │
          Header: Authorization: Bearer JWT       │
          { template: "modern-pro" }              │
                                                   ▼
                                          Template Router
                                          (Checks template ID)
                                                   │
                               ┌───────────────────┼───────────────────┐
                               ▼                   ▼                   ▼
                          modern-pro.tex      classic.tex      tech-focus.tex
                          (LaTeX)             (LaTeX)          (LaTeX)
                               │                   │                   │
                               ▼                   ▼                   ▼
                          pdflatex           pdflatex          pdflatex
                          compiler           compiler          compiler
                               │                   │                   │
                               ▼                   ▼                   ▼
                        Modern PDF         Classic PDF      Tech PDF
                        (Gradient,         (Serif,          (Monospace,
                         colorful)          centered)        skills-first)
                               │                   │                   │
                               └───────────────────┴───────────────────┘
                                           │
                                           ▼
                              Each template produces unique PDF ✅


═══════════════════════════════════════════════════════════════════
                        IMPLEMENTATION STEPS
═══════════════════════════════════════════════════════════════════

Step 1: Update resume-builder.html (Line ~2174)
───────────────────────────────────────────────

CHANGE THIS:
────────────
const response = await fetch('/generate-resume', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data)
});

TO THIS:
────────
const token = localStorage.getItem('token');
const response = await fetch('http://localhost:5003/api/resume/generate-fast', {
  method: 'POST',
  headers: { 
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify(data)
});


Step 2: (Optional) Load templates dynamically
──────────────────────────────────────────────

Add this function to fetch templates from Hiero Backend:
────────────────────────────────────────────────────────

async function loadTemplates() {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch('http://localhost:5003/api/resume/templates', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const { templates } = await response.json();
    
    // Clear existing hardcoded templates
    const grid = document.getElementById('templatesGrid');
    grid.innerHTML = '';
    
    // Create cards for each template
    templates.forEach(template => {
      const card = createTemplateCard(template);
      grid.appendChild(card);
    });
    
    console.log('✅ Loaded', templates.length, 'templates from Hiero Backend');
  } catch (error) {
    console.error('Failed to load templates:', error);
    // Fallback to hardcoded templates
  }
}

// Call on page load
window.addEventListener('DOMContentLoaded', loadTemplates);


Step 3: Test each template
───────────────────────────

1. Select "Classic" → Fill form → Generate → Check PDF
2. Select "Modern Pro" → Fill form → Generate → Check PDF
3. Select "Tech Focus" → Fill form → Generate → Check PDF
... test all 10 templates

Expected: Each PDF should look visually different! ✅


═══════════════════════════════════════════════════════════════════
                         FILE LOCATIONS
═══════════════════════════════════════════════════════════════════

Frontend:
  /hiero last prtotype/jss/hiero/hiero last/public/resume-builder.html
  - Line 580-793: Template cards (hardcoded HTML)
  - Line 1336: previewTemplate() function
  - Line 1647: startBuilding() function
  - Line 2143: generateResume() function ← NEEDS UPDATE
  - Line 2174: fetch('/generate-resume') ← CHANGE TO Hiero Backend

Backend (Current - Auth Backend):
  /login system/main.js
  - POST /generate-resume endpoint
  - Uses HTML templates (generateClassicTemplate, etc.)
  - Returns basic PDF (all look similar)

Backend (Target - Hiero Backend):
  /hiero backend/controllers/resumeController.js
  - POST /api/resume/generate-fast endpoint
  - Uses LaTeX/PDFKit templates (templates/*.tex)
  - Returns professional, unique PDFs


═══════════════════════════════════════════════════════════════════
                    VERIFICATION CHECKLIST
═══════════════════════════════════════════════════════════════════

Before Fix:
  ❌ All PDFs look the same
  ❌ Frontend uses Auth Backend (/generate-resume)
  ❌ Templates are hardcoded in HTML
  ❌ No JWT authentication to Hiero Backend

After Fix:
  ✅ Each template produces unique PDF
  ✅ Frontend uses Hiero Backend (/api/resume/generate-fast)
  ✅ Templates fetched from Hiero Backend (optional)
  ✅ JWT token sent with requests
  ✅ Professional LaTeX/PDFKit rendering

Test Command:
  # Generate resume with each template via Hiero Backend
  curl -X POST http://localhost:5003/api/resume/generate-fast \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $JWT_TOKEN" \
    -d '{"template":"modern-pro","personalInfo":{...}}'

  # Should return different PDF for each template ID
```
