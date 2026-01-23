# Hiero System Architecture - Separated Services

## Overview
The Hiero system is now properly separated into two distinct services:

### 🏗️ **Resume Creation Service** (Port 5003)
- **Purpose**: Resume building, templates, PDF generation
- **Server**: `/hiero backend/server.js` 
- **Port**: 5003 (configured in `.env`)
- **Endpoints**:
  - `GET /api/resume/templates` - List available templates
  - `POST /api/resume/basic` - Save basic info
  - `POST /api/resume/education` - Save education
  - `POST /api/resume/projects` - Save projects
  - `POST /api/resume/skills` - Save skills
  - `POST /api/resume/generate` - Generate PDF
  - `POST /api/ask` - Chatbot for resume help

### 🔍 **Resume Analysis Service** (Port 5001)
- **Purpose**: Resume-JD matching, skill analysis, project suggestions
- **Server**: `/hiero backend/hiero analysis part/index.js`
- **Port**: 5001 (configured in analysis server)
- **Endpoints**:
  - `POST /api/analyze` - Analyze resume vs job description
  - Supports both file upload and text input
  - Returns domain-aware skill matching and suggestions

## Key Features

### ✅ **Analysis Service Capabilities**
- **Domain Detection**: Automatically detects tech vs non-tech roles
- **Skill Extraction**: Dynamic skill extraction based on domain
- **Matching Algorithm**: Weighted scoring (exact + partial matches)
- **Project Suggestions**: Domain-specific project recommendations
- **File Support**: PDF, TXT files + JSON text input

### ✅ **Creation Service Capabilities**  
- **Multiple Templates**: 6 professional resume templates
- **AI Chat**: Interactive resume building assistance
- **PDF Generation**: LaTeX-based professional PDFs
- **Photo Upload**: Profile picture support
- **Auth System**: User authentication and session management

## Frontend Integration

### 📁 **File Structure**
```
hiero last prtotype/
├── index.html          # Main landing page (service selector)
├── upload.html         # Analysis upload page → Port 5001
├── results.html        # Analysis results display
├── resume-builder.html # Resume creation → Port 5003
├── script.js          # Frontend logic
└── debug-upload.html   # Debug/testing page
```

### 🔗 **API Configuration**
```javascript
// In script.js
const API_BASE = 'http://localhost:5003';      // Resume creation
const ANALYSIS_BASE = 'http://localhost:5001'; // Analysis service
```

## Testing Commands

### Start Servers
```bash
# Terminal 1: Resume Creation Server
cd "hiero backend" && npm start

# Terminal 2: Analysis Server  
cd "hiero backend/hiero analysis part" && node index.js
```

### Test Analysis Service
```bash
# Tech resume analysis
curl -X POST http://localhost:5001/api/analyze \
  -F "resume=@test-resume-tech.txt" \
  -F "jd=@test-jd-tech.txt"

# HR resume analysis
curl -X POST http://localhost:5001/api/analyze \
  -F "resume=@test-resume-hr.txt" \
  -F "jd=@test-jd-hr.txt"

# JSON text input
curl -X POST http://localhost:5001/api/analyze \
  -H "Content-Type: application/json" \
  -d '{"resumeText":"Software engineer with JavaScript","jdText":"Looking for full stack developer"}'
```

### Test Creation Service
```bash
# Get available templates
curl http://localhost:5003/api/resume/templates

# Test chatbot
curl -X POST http://localhost:5003/api/ask \
  -H "Content-Type: application/json" \
  -d '{"question":"How to write a good resume?","skill":"resume"}'
```

## Benefits of Separation

1. **Scalability**: Each service can be scaled independently
2. **Maintenance**: Easier to update/debug specific functionality  
3. **Performance**: Analysis-heavy operations don't affect resume building
4. **Deployment**: Services can be deployed on different servers/containers
5. **Security**: Different authentication/access patterns for each service
6. **Monitoring**: Separate logging and metrics for each service

## Next Steps

1. **Load Balancing**: Add nginx for production deployment
2. **Containerization**: Docker containers for each service
3. **Database**: Separate databases for user data vs analysis cache
4. **Monitoring**: Service health checks and metrics
5. **API Gateway**: Centralized routing and rate limiting
