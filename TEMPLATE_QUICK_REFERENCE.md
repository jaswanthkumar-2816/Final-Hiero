# Resume Builder - Quick Reference Guide

## 🎯 When & How Templates Are Shown

### ANSWER: Templates are shown **immediately on page load** in Step 1

---

## 📍 Where Templates Are Defined

### Location: `resume-builder.html` (Lines 580-793)

The templates are **hardcoded in HTML** as a grid of cards:

```html
<div class="templates-grid" id="templatesGrid">
  <!-- Template Card 1 -->
  <div class="template-card" data-template="classic">
    <div class="template-preview" onclick="previewTemplate('classic')">
      <i class="fas fa-file-alt"></i>
      <button class="preview-btn">Preview</button>
    </div>
    <div class="template-info">
      <h3>Classic Professional</h3>
      <p>Clean, traditional layout perfect for any industry</p>
      <button onclick="startBuilding('classic')">Start Building</button>
    </div>
  </div>
  
  <!-- ... 9 more template cards ... -->
</div>
```

---

## 🔄 Template Flow Timeline

| Time | Event | Function | What Happens |
|------|-------|----------|--------------|
| **T0** | Page loads | (automatic) | Template selection screen visible |
| **T1** | User clicks "Preview" | `previewTemplate('modern-pro')` | Modal shows template with sample data |
| **T2** | User clicks "Start Building" | `startBuilding('modern-pro')` | Template saved, form shown |
| **T3** | User fills form | (user action) | Live preview updates |
| **T4** | User clicks "Generate Resume" | `generateResume()` | PDF created with selected template |

---

## 🎨 The 10 Available Templates

| ID | Name | Category | Premium | Description |
|----|------|----------|---------|-------------|
| `classic` | Classic Professional | Simple | No | Traditional serif, centered header |
| `minimal` | Minimal | Simple | No | Ultra-clean, sans-serif |
| `modern-pro` | Modern Professional | Modern | **Yes** | Gradient header, colorful accents |
| `tech-focus` | Tech Focus | Modern | No | Code-style, skills-first layout |
| `creative-bold` | Creative Bold | Creative | **Yes** | Large sidebar, visual elements |
| `portfolio-style` | Portfolio Style | Creative | No | Visual, portfolio-inspired |
| `ats-optimized` | ATS Optimized | ATS | No | Parser-friendly, keyword-optimized |
| `corporate-ats` | Corporate ATS | ATS | No | Professional + ATS-compatible |
| `elegant-gradient` | Elegant Gradient | Modern | **Yes** | Beautiful gradients, elegant fonts |
| `minimalist-mono` | Minimalist Mono | Simple | No | Ultra-minimalist, monochrome |

---

## 🔍 Key Functions - Quick Lookup

### 1. `previewTemplate(templateId)` - Line 1336
**When**: User clicks "Preview" button on a template card
**What**: Shows modal with sample resume in selected template style
**Input**: Template ID (string) - e.g., `'modern-pro'`
**Output**: Displays modal with HTML preview

```javascript
previewTemplate('modern-pro')
// → Shows modal with Modern Pro template using sample data
```

---

### 2. `startBuilding(templateId)` - Line 1647
**When**: User clicks "Start Building" button
**What**: Locks in template selection, shows form
**Side Effects**:
- Sets `selectedTemplate` variable
- Saves to `localStorage.setItem('selectedTemplate', templateId)`
- Hides template selection screen
- Shows form + preview screen

```javascript
startBuilding('modern-pro')
// → selectedTemplate = 'modern-pro'
// → localStorage: 'selectedTemplate' = 'modern-pro'
// → Form screen shown
```

---

### 3. `generateResume(event)` - Line 2143
**When**: User clicks "Generate Resume" button
**What**: Sends form data + template ID to backend for PDF generation

**Current Code** (❌ WRONG - uses Auth Backend):
```javascript
const response = await fetch('/generate-resume', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data)
});
```

**Should Be** (✅ CORRECT - uses Hiero Backend):
```javascript
const token = localStorage.getItem('token');
const response = await fetch('http://localhost:5003/api/resume/generate-fast', {
  method: 'POST',
  headers: { 
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify(data)
});
```

---

### 4. `collectFormData()` - Line 2204
**When**: Called by `generateResume()` before sending request
**What**: Gathers all form field values into structured object
**Output**:
```javascript
{
  template: "modern-pro",
  personalInfo: {
    fullName: "John Doe",
    email: "john@example.com",
    phone: "(555) 123-4567",
    // ... more fields
  },
  experience: [
    {
      jobTitle: "Software Engineer",
      company: "Tech Corp",
      startDate: "2020-01",
      endDate: "2023-12",
      description: "Built amazing things"
    }
  ],
  education: [...],
  technicalSkills: "JavaScript, React, Node.js",
  summary: "Experienced developer...",
  // ... other fields
}
```

---

## 📊 Template Selection State Management

### Storage Method: `localStorage`

```javascript
// When user selects template:
localStorage.setItem('selectedTemplate', 'modern-pro');

// When generating resume:
const template = localStorage.getItem('selectedTemplate');

// Persists across:
// ✅ Page refresh
// ✅ Browser restart (until cleared)
// ✅ Navigation away and back
```

### In-Memory Variable

```javascript
// Global variable (defined near top of script)
let selectedTemplate = null;

// Set when user clicks "Start Building"
selectedTemplate = 'modern-pro';

// Lost when:
// ❌ Page refresh
// ❌ Browser restart
// ❌ Navigation away
```

### Why Both?
- **Memory**: Fast access during same session
- **localStorage**: Persists if user accidentally refreshes

---

## 🐛 Common Issues & Solutions

### Issue 1: All PDFs Look the Same
**Cause**: Frontend sends to wrong backend (Auth Backend instead of Hiero Backend)

**Solution**: Update `generateResume()` to use Hiero Backend endpoint

**Change this line** (around line 2174):
```javascript
// BEFORE (❌)
const response = await fetch('/generate-resume', {

// AFTER (✅)
const response = await fetch('http://localhost:5003/api/resume/generate-fast', {
```

---

### Issue 2: Template Not Found
**Cause**: Template ID mismatch between frontend and backend

**Check**:
1. Frontend template IDs (in HTML cards) match backend template files
2. Example: `data-template="modern-pro"` → backend must have `modern-pro.tex` or `modern-pro` handler

**Template ID Validation**:
```javascript
const validTemplates = [
  'classic', 'minimal', 'modern-pro', 'tech-focus',
  'creative-bold', 'portfolio-style', 'ats-optimized',
  'corporate-ats', 'elegant-gradient', 'minimalist-mono'
];

if (!validTemplates.includes(selectedTemplate)) {
  console.error('Invalid template:', selectedTemplate);
}
```

---

### Issue 3: Preview Doesn't Match Generated PDF
**Cause**: Preview uses frontend HTML/CSS, PDF uses backend LaTeX/PDFKit

**Options**:
- **Option A**: Accept that preview is approximate (faster)
- **Option B**: Fetch actual PDF preview from backend (slower, more accurate)

**Current Implementation**: Option A (HTML preview with CSS)

---

### Issue 4: 401 Unauthorized from Hiero Backend
**Cause**: Missing or invalid JWT token

**Solution**: Ensure token is stored and sent correctly
```javascript
// Check if token exists
const token = localStorage.getItem('token');
if (!token) {
  alert('Please log in first');
  window.location.href = '/login.html';
  return;
}

// Send token in header
headers: {
  'Authorization': `Bearer ${token}`
}
```

---

## 🧪 Testing Guide

### Test 1: Template Selection
```
1. Open resume-builder.html
2. Check: Do you see 10 template cards?
   ✅ Yes → Templates showing correctly
   ❌ No → Check console for errors

3. Click "Preview" on any template
4. Check: Does modal show with sample resume?
   ✅ Yes → Preview working
   ❌ No → Check previewTemplate() function

5. Click "Start Building" on any template
6. Check: Does form appear?
   ✅ Yes → startBuilding() working
   ❌ No → Check console for errors
```

### Test 2: Form Filling
```
1. After selecting template, fill out form:
   - Full Name: "Test User"
   - Email: "test@example.com"
   - Phone: "555-1234"
   
2. Check right side preview
3. Does it update as you type?
   ✅ Yes → Live preview working
   ❌ No → Check updatePreview() listeners
```

### Test 3: PDF Generation (Current - Auth Backend)
```
1. Click "Generate Resume"
2. Check Network tab (F12 → Network)
3. Look for request to: /generate-resume
4. Check response
5. Expected: PDF generated, but looks generic ❌
```

### Test 4: PDF Generation (Fixed - Hiero Backend)
```
1. Click "Generate Resume"
2. Check Network tab (F12 → Network)
3. Look for request to: http://localhost:5003/api/resume/generate-fast
4. Check request headers: Should include Authorization: Bearer <token>
5. Check response: Should return URL to PDF
6. Download PDF
7. Expected: PDF matches selected template style ✅
```

### Test 5: Different Templates
```
For each template:
1. Select template
2. Fill form with same data
3. Generate PDF
4. Compare PDFs
5. Expected: Each PDF looks visually different ✅

Compare these:
- Classic: Traditional serif, centered
- Modern Pro: Gradient header, colorful
- Tech Focus: Monospace fonts, skills-first
- Creative Bold: Sidebar layout, visual elements
```

---

## 🔧 Debug Commands

### Check Selected Template
```javascript
// In browser console (F12)
console.log('Selected:', selectedTemplate);
console.log('localStorage:', localStorage.getItem('selectedTemplate'));
```

### Check JWT Token
```javascript
const token = localStorage.getItem('token');
console.log('Token exists:', !!token);
console.log('Token length:', token?.length);
console.log('Token preview:', token?.substring(0, 20) + '...');
```

### Simulate Template Selection
```javascript
// Manually set template without clicking UI
selectedTemplate = 'modern-pro';
localStorage.setItem('selectedTemplate', 'modern-pro');
console.log('✅ Template set to modern-pro');
```

### Test Backend Endpoint
```bash
# Get list of available templates
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  http://localhost:5003/api/resume/templates

# Generate resume with specific template
curl -X POST http://localhost:5003/api/resume/generate-fast \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "template": "modern-pro",
    "personalInfo": {
      "fullName": "Test User",
      "email": "test@example.com",
      "phone": "555-1234"
    },
    "experience": [],
    "education": []
  }'
```

---

## 📁 File Structure Reference

```
shared folder/
├── hiero last prtotype/jss/hiero/hiero last/
│   └── public/
│       └── resume-builder.html ← MAIN FILE TO EDIT
│           ├── Line 580-793: Template cards (HTML)
│           ├── Line 1336: previewTemplate() function
│           ├── Line 1647: startBuilding() function
│           ├── Line 2143: generateResume() function
│           └── Line 2174: fetch('/generate-resume') ← CHANGE THIS
│
├── hiero backend/ ← TARGET BACKEND (Port 5003)
│   ├── controllers/
│   │   └── resumeController.js ← POST /api/resume/generate-fast
│   ├── templates/ ← LaTeX template files
│   │   ├── classic.tex
│   │   ├── modern-pro.tex
│   │   ├── tech-focus.tex
│   │   └── ... (10 templates)
│   └── routes/
│       └── resumeRoutes.js ← GET /api/resume/templates
│
└── login system/ ← CURRENT BACKEND (Port 3000)
    └── main.js ← POST /generate-resume (basic HTML → PDF)
```

---

## ✅ Quick Checklist

Before making changes:
- [ ] I understand templates are shown on page load (Step 1)
- [ ] I understand `startBuilding()` saves template and shows form (Step 2)
- [ ] I understand `generateResume()` sends data to backend (Step 3)
- [ ] I know the current backend is Auth Backend (port 3000)
- [ ] I know the target backend is Hiero Backend (port 5003)

To fix the issue:
- [ ] Update `generateResume()` to use Hiero Backend URL
- [ ] Add JWT token to Authorization header
- [ ] Test each template produces unique PDF
- [ ] Verify PDFs are visually distinct

After fixing:
- [ ] Each template generates a different-looking PDF ✅
- [ ] Template selection works as before ✅
- [ ] Form filling works as before ✅
- [ ] User experience is improved (better PDFs) ✅

---

## 🎯 Summary

**Q: When are templates shown?**  
A: **Immediately on page load** - they are hardcoded in HTML (lines 580-793)

**Q: How does template selection work?**  
A: **User clicks "Start Building"** → `startBuilding(templateId)` → saves to localStorage → shows form

**Q: When is the template used?**  
A: **When generating PDF** → `generateResume()` → sends `data.template` to backend

**Q: What's the problem?**  
A: **Wrong backend endpoint** - currently uses Auth Backend (basic PDFs), should use Hiero Backend (professional PDFs)

**Q: What's the fix?**  
A: **Change 1 line** in `generateResume()` (line 2174):
```javascript
// Change this:
fetch('/generate-resume', ...)

// To this:
fetch('http://localhost:5003/api/resume/generate-fast', ...)
```

That's it! 🎉
