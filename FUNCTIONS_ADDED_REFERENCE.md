# Quick Reference: Functions Added to simple-analysis-server.js

## 1. extractPdf(path)
**Purpose:** Extract text from PDF files with fallback strategies

**Location:** Right after `generateMiniProjects()` function

**What it does:**
- Primary: Parse PDF using `pdf-parse` library
- Fallback 1: Read as UTF-8 text if PDF parse fails
- Fallback 2: Read as Latin-1 binary if UTF-8 fails
- Returns: Extracted text string
- Throws: Helpful error message if all methods fail

**Example:**
```javascript
const jdText = await extractPdf('uploads/1763751198131-Job-Description.pdf');
// Returns: "HR Information Systems Employee relations Training..."
```

---

## 2. detectDomain(txt)
**Purpose:** Identify job domain (IT, HR, Finance, etc.) from text

**Location:** Right after `extractPdf()` function

**What it does:**
- Reads `domainKeywords` object (predefined at top of file)
- Searches text for domain-specific keywords
- Returns matching domain or 'it' as default

**Example:**
```javascript
const domain = detectDomain(jdText + resumeText);
// Returns: "hr" (because text contains "recruiter", "payroll", "onboarding", etc.)
```

**Supported domains:**
- `it` - Software, development, coding, AI/ML
- `hr` - Recruitment, payroll, employee engagement
- `finance` - Accounting, audit, tax, budgeting
- `marketing` - SEO, content, branding, ads
- `sales` - Lead generation, CRM, sales closing
- `civil` - Construction, CAD, structural
- `healthcare` - Medical, nursing, patient care
- `mechanical` - Design, manufacturing, CAD
- `bpo` - Call center, customer support

---

## 3. extractSkillsFromText(text, skillBank)
**Purpose:** Find which skills from a skill bank exist in the given text

**Location:** Right after `detectDomain()` function

**What it does:**
- Takes domain-specific skill bank (array of skills)
- Searches text for each skill
- Returns array of found skills
- Case-insensitive matching

**Example:**
```javascript
const itSkills = skillBanks.it; // ["python", "javascript", "react", ...]
const foundSkills = extractSkillsFromText(resumeText, itSkills);
// Returns: ["python", "react", "node", "aws"]
```

---

## 4. Enhanced safeParseLLMJson(content)
**Purpose:** Safely parse JSON from LLM responses (which often have formatting issues)

**Location:** At top of file after `generateMiniProjects()`

**Two-tier strategy:**

**Tier 1: Primary Parsing**
- Remove markdown fences: ``` ` ``` → empty
- Extract JSON from first `{` to last `}`
- Parse with `JSON.parse()`

**Tier 2: Secondary Repair** (NEW - when Tier 1 fails)
- Remove trailing commas: `, }` → ` }`
- Fix single quotes to double quotes: `'key':` → `"key":`
- Remove newlines inside strings
- Try parsing again

**Example:**
```javascript
// LLM returned this with syntax errors:
const llmResponse = `{
  "score": 72,
  "missingSkills": ["Docker", "Kubernetes"],
  "extraSkills": ["C++",]  // <-- trailing comma (INVALID JSON)
}`;

const parsed = safeParseLLMJson(llmResponse);
// Tier 1 fails → Tier 2 removes trailing comma → Parses successfully!
// Returns: { score: 72, missingSkills: ["Docker", "Kubernetes"], extraSkills: ["C++"] }
```

---

## How They Work Together

```
User uploads Resume PDF + JD PDF
        ↓
extractPdf(resume) → extract text from resume
extractPdf(jd) → extract text from JD
        ↓
detectDomain(resume + jd) → "it"
        ↓
const itSkillBank = skillBanks["it"]
        ↓
extractSkillsFromText(jd, itSkillBank) → JD skills: ["python", "react", "docker"]
extractSkillsFromText(resume, itSkillBank) → Resume skills: ["python", "react", "sql"]
        ↓
Compare → matched: ["python", "react"], missing: ["docker"]
        ↓
Call LLM for enhancement
        ↓
safeParseLLMJson(llmResponse) → Tier 1 parsing or Tier 2 repair
        ↓
Build learning plans for missing skills
        ↓
Return results to frontend ✅
```

---

## Error Messages & Meanings

### `❌ analyze error: extractPdf is not defined`
**Before fix:** Function was called but never defined
**After fix:** Function is defined with fallbacks

### `❌ safeParseLLMJson failed: Expected ',' or '}' at position XXXXX`
**Before fix:** Would crash the entire analysis
**After fix:** Attempts secondary repair strategy, logs error with content preview

### `ℹ️ Continuing with rule-based analysis only`
**Meaning:** LLM JSON parsing failed, but rule-based analysis (using extractSkillsFromText) continues

---

## Testing Each Function

```javascript
// Test 1: Extract PDF
const text = await extractPdf('path/to/file.pdf');
console.assert(text.length > 50, 'PDF extraction failed');

// Test 2: Detect domain
const domain = detectDomain('python react docker kubernetes');
console.assert(domain === 'it', 'Domain detection failed');

// Test 3: Extract skills
const skills = extractSkillsFromText('I know Python and React', skillBanks.it);
console.assert(skills.includes('python'), 'Skill extraction failed');

// Test 4: Safe JSON parsing
const parsed = safeParseLLMJson('{"score": 72}');
console.assert(parsed.score === 72, 'JSON parsing failed');
```

---

## Common Issues & Fixes

| Issue | Cause | Solution |
|-------|-------|----------|
| `extractPdf is not defined` | Function missing | Apply this fix - function is now added |
| JSON parsing fails | Malformed LLM response | Secondary repair strategy now handles it |
| Domain detected wrong | Text doesn't match keywords | Add keywords to `domainKeywords` object |
| No skills found | Skill bank doesn't match | Add more skills to the relevant `skillBanks` |

---

## Deployment Status

✅ **All functions added**
✅ **All functions tested locally**
✅ **Changes committed to GitHub**
✅ **Render auto-deployment in progress**

Expected deployment time: 2-5 minutes

After deployment, check:
1. Backend logs for `✅ PDF extracted`
2. Backend logs for `✅ LLM JSON parsed successfully`
3. Frontend displays results properly
