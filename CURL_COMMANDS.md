# Resume Generation via cURL Commands for Chaitanya Reddy N

## ✅ TESTED & WORKING - Complete Workflow

### Method 1: Complete Step-by-Step Workflow (RECOMMENDED)
Use the provided script that handles all steps:
```bash
./curl_chaitanya_workflow.sh
```

### Method 2: Quick Single-Step Generation
Use the quick script for minimal resume:
```bash
./quick_resume.sh
```

## Manual cURL Commands

### Step 1: Generate JWT Token
```bash
# Option A: Using Node.js one-liner
TOKEN=$(node -e "
const jwt = require('jsonwebtoken');
const payload = { userId: 'chaitanyaUser123', username: 'chaitanya.reddy@email.com' };
const token = jwt.sign(payload, 'X7k9P!mQ2aL5vR8', { expiresIn: '1h' });
console.log(token);
")

# Option B: Using the helper script
TOKEN=$(node generate_token.js)
```

### Step 2: Save Basic Information
```bash
curl -X POST "http://localhost:5003/api/resume/basic" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "full_name": "Chaitanya Reddy N",
    "contact_info": {
      "email": "chaitanya.reddy@email.com",
      "phone": "+91 9876543210",
      "linkedin": "https://linkedin.com/in/chaitanya-reddy-n",
      "website": "https://chaitanya-portfolio.com",
      "address": "Hyderabad, Telangana, India"
    },
    "career_summary": "Dynamic software engineer with expertise in full-stack development and cloud technologies."
  }'
```

### Step 3: Save Education
```bash
curl -X POST "http://localhost:5003/api/resume/education" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "education": [
      {
        "institution": "Indian Institute of Technology (IIT) Hyderabad",
        "degree": "Bachelor of Technology in Computer Science",
        "graduation_year": "2022",
        "gpa": "8.7/10.0",
        "details": "Specialized in Software Engineering and Data Structures"
      }
    ]
  }'
```

### Step 4: Save Experience
```bash
curl -X POST "http://localhost:5003/api/resume/experience" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "experience": [
      {
        "company": "Tech Mahindra",
        "position": "Software Engineer",
        "duration": "2022 - Present",
        "location": "Hyderabad, India",
        "responsibilities": [
          "Developed and maintained web applications using React.js and Node.js",
          "Implemented RESTful APIs and integrated third-party services",
          "Optimized application performance resulting in 30% faster load times"
        ]
      }
    ]
  }'
```

### Step 5: Save Skills
```bash
curl -X POST "http://localhost:5003/api/resume/skills" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "skills": {
      "technical": ["JavaScript", "Python", "React.js", "Node.js", "AWS", "MongoDB"],
      "management": ["Team Collaboration", "Project Management", "Agile/Scrum"],
      "soft": ["Communication", "Leadership", "Problem Solving"]
    }
  }'
```

### Step 6: Generate Resume
```bash
curl -X POST "http://localhost:5003/api/resume/generate-fast" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN"
```

### Step 7: Download Resume
```bash
# Replace FILENAME with the actual filename from the generate response
curl -X GET "http://localhost:5003/api/resume/download?file=FILENAME" \
  -H "Authorization: Bearer $TOKEN" \
  -o "Chaitanya_Resume.pdf"
```

## Alternative: Single-Step Generation with Full Data

### Generate Resume with Complete Data in One Request
```bash
curl -X POST "http://localhost:5003/api/resume/generate-fast" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "template": "modernsimple",
    "basic": {
      "full_name": "Chaitanya Reddy N",
      "contact_info": {
        "email": "chaitanya.reddy@email.com",
        "phone": "+91 9876543210",
        "address": "Hyderabad, Telangana, India"
      },
      "career_objective": "Software engineer with expertise in full-stack development."
    },
    "education": [
      {
        "institution": "IIT Hyderabad",
        "degree": "B.Tech Computer Science",
        "graduation_year": "2022",
        "gpa": "8.7/10.0"
      }
    ],
    "experience": [
      {
        "company": "Tech Mahindra",
        "position": "Software Engineer",
        "duration": "2022 - Present",
        "responsibilities": [
          "Full-stack development using React.js and Node.js",
          "API integration and performance optimization"
        ]
      }
    ],
    "skills": {
      "technical": ["JavaScript", "Python", "React.js", "Node.js", "AWS"],
      "soft": ["Communication", "Leadership", "Problem Solving"]
    }
  }'
```

## Available Templates
- `professionalcv` - Classic Professional (recommended for corporate roles)
- `modernsimple` - Modern Corporate (recommended for tech professionals) ✅
- `awesomecv` - Creative Design (marketing, design roles)
- `altacv` - ATS-Friendly (optimized for job portals)
- `deedycv` - Student/Fresher (entry-level positions)
- `elegant` - Executive/Managerial (senior roles)
- `functional` - Skills-Based (career switchers)

## Test Results ✅
- ✅ Full workflow completed successfully
- ✅ Resume generated for "Chaitanya Reddy N"
- ✅ PDF downloaded: `Chaitanya_Reddy_N_Resume.pdf` (3.0KB)
- ✅ Quick generation script: `Chaitanya_Quick_Resume.pdf` (2.9KB)
- ✅ Backend server running on http://localhost:5003
- ✅ All 7 templates available and working
- ✅ JWT authentication working properly

## Helper Scripts Available
1. `curl_chaitanya_workflow.sh` - Complete step-by-step workflow
2. `quick_resume.sh` - Fast single-step generation
3. `generate_token.js` - JWT token generator
