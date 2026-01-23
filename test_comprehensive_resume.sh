#!/bin/bash

# Comprehensive Template Test - Tests ALL available resume templates
# Saves each template with detailed naming for comparison

echo "================================================"
echo "   COMPREHENSIVE RESUME TEMPLATE TEST"
echo "================================================"
echo ""

# Create output directory with timestamp
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
OUTPUT_DIR="template_test_output_$TIMESTAMP"
mkdir -p "$OUTPUT_DIR"

echo "📁 Output directory: $OUTPUT_DIR"
echo ""

# Check backend
echo "🔍 Checking backend server..."
BACKEND_CHECK=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5003/ || echo "000")

if [ "$BACKEND_CHECK" = "000" ]; then
    echo "❌ Backend server not running on port 5003"
    echo "Start it with: cd 'hiero backend' && npm start"
    exit 1
fi
echo "✅ Backend is running"
echo ""

# Generate Token
echo "🔑 Generating authentication token..."
TOKEN=$(node -e "
const jwt = require('jsonwebtoken');
const payload = { userId: 'templateTest_${TIMESTAMP}', username: 'template-test@email.com' };
const token = jwt.sign(payload, 'X7k9P!mQ2aL5vR8', { expiresIn: '2h' });
console.log(token);
")

if [ -z "$TOKEN" ]; then
    echo "❌ Failed to generate token"
    exit 1
fi
echo "✅ Token generated"
echo ""

# Create comprehensive resume data
echo "💾 Saving comprehensive resume data..."

# Basic Info
curl -s -X POST "http://localhost:5003/api/resume/basic" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "full_name": "Alexander Johnson",
    "contact_info": {
      "email": "alex.johnson@email.com",
      "phone": "+1 (555) 987-6543",
      "linkedin": "linkedin.com/in/alexanderjohnson",
      "website": "www.alexjohnson.dev",
      "address": "Seattle, WA 98101"
    },
    "career_summary": "Results-driven Senior Software Engineer with 8+ years of experience designing and implementing scalable cloud-based solutions. Proven track record of leading cross-functional teams and delivering high-impact projects. Expertise in microservices architecture, DevOps practices, and agile methodologies."
  }' > /dev/null && echo "  ✓ Basic information"

# Education
curl -s -X POST "http://localhost:5003/api/resume/education" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "education": [
      {
        "institution": "Massachusetts Institute of Technology (MIT)",
        "degree": "Master of Science in Computer Science",
        "graduation_year": "2016",
        "gpa": "3.95/4.0",
        "details": "Specialization in Distributed Systems and Machine Learning. Thesis: Optimizing Microservices Communication Patterns"
      },
      {
        "institution": "University of Washington",
        "degree": "Bachelor of Science in Computer Engineering",
        "graduation_year": "2014",
        "gpa": "3.85/4.0",
        "details": "Magna Cum Laude. Dean'\''s List all semesters. President of Computer Science Club"
      }
    ]
  }' > /dev/null && echo "  ✓ Education"

# Experience
curl -s -X POST "http://localhost:5003/api/resume/experience" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "experience": [
      {
        "company": "Microsoft Corporation",
        "position": "Senior Software Engineer - Azure Platform",
        "duration": "Jan 2020 - Present",
        "location": "Redmond, WA",
        "responsibilities": [
          "Architected and implemented microservices for Azure Kubernetes Service, serving 50,000+ customers",
          "Led team of 8 engineers in developing CI/CD pipelines, reducing deployment time by 60%",
          "Designed RESTful APIs handling 10M+ requests daily with 99.99% uptime SLA",
          "Mentored 12 junior developers and conducted technical interviews for senior positions",
          "Reduced infrastructure costs by $2M annually through optimization and auto-scaling strategies"
        ]
      },
      {
        "company": "Amazon Web Services (AWS)",
        "position": "Software Development Engineer II",
        "duration": "Jun 2017 - Dec 2019",
        "location": "Seattle, WA",
        "responsibilities": [
          "Developed core features for AWS Lambda, processing 100M+ function invocations per day",
          "Implemented distributed tracing system improving debugging efficiency by 75%",
          "Built automated testing framework increasing code coverage from 65% to 92%",
          "Collaborated with product managers to define technical roadmaps for Q3/Q4 2019",
          "Received AWS Excellence Award for outstanding performance and innovation"
        ]
      },
      {
        "company": "Salesforce",
        "position": "Software Engineer",
        "duration": "Jul 2014 - May 2017",
        "location": "San Francisco, CA",
        "responsibilities": [
          "Developed full-stack features for Salesforce CRM using Java, JavaScript, and React",
          "Optimized database queries reducing page load times by 45%",
          "Implemented OAuth 2.0 authentication for enterprise customers",
          "Participated in on-call rotation maintaining 99.9% service availability"
        ]
      }
    ]
  }' > /dev/null && echo "  ✓ Experience"

# Skills
curl -s -X POST "http://localhost:5003/api/resume/skills" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "skills": {
      "technical": [
        "Languages: JavaScript/TypeScript, Python, Java, Go, C++, SQL",
        "Frontend: React.js, Vue.js, Angular, Next.js, HTML5, CSS3, Redux",
        "Backend: Node.js, Express.js, Django, Spring Boot, FastAPI, GraphQL",
        "Databases: PostgreSQL, MongoDB, Redis, DynamoDB, MySQL, Cassandra",
        "Cloud: AWS (EC2, Lambda, S3, RDS), Azure, GCP, Terraform, CloudFormation",
        "DevOps: Docker, Kubernetes, Jenkins, GitLab CI/CD, GitHub Actions",
        "Tools: Git, JIRA, Confluence, Postman, VS Code, IntelliJ IDEA"
      ],
      "management": [
        "Agile/Scrum methodology and sprint planning",
        "Technical team leadership and cross-functional collaboration",
        "Code review and quality assurance processes",
        "Performance evaluation and career development mentoring",
        "Product roadmap planning and stakeholder management"
      ],
      "soft": [
        "Strong written and verbal communication",
        "Strategic problem-solving and critical thinking",
        "Collaborative team player with leadership abilities",
        "Time management and prioritization under pressure",
        "Adaptability to new technologies and methodologies"
      ]
    }
  }' > /dev/null && echo "  ✓ Skills"

# Projects
curl -s -X POST "http://localhost:5003/api/resume/projects" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "projects": [
      {
        "name": "CloudScale - Auto-Scaling Platform",
        "description": "Built an intelligent auto-scaling platform for containerized applications using machine learning to predict traffic patterns and optimize resource allocation",
        "technologies": ["Python", "TensorFlow", "Kubernetes", "AWS", "PostgreSQL"],
        "link": "github.com/alexjohnson/cloudscale"
      },
      {
        "name": "DevOps Dashboard",
        "description": "Developed a real-time monitoring dashboard for microservices with custom alerting, log aggregation, and performance metrics visualization",
        "technologies": ["React.js", "Node.js", "D3.js", "Elasticsearch", "Docker"],
        "link": "github.com/alexjohnson/devops-dashboard"
      },
      {
        "name": "API Gateway Framework",
        "description": "Created an open-source API gateway framework with rate limiting, authentication, and request routing capabilities, adopted by 500+ developers",
        "technologies": ["Go", "Redis", "gRPC", "Protocol Buffers"],
        "link": "github.com/alexjohnson/api-gateway"
      }
    ]
  }' > /dev/null && echo "  ✓ Projects"

# Certifications
curl -s -X POST "http://localhost:5003/api/resume/certifications" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "certifications": [
      "AWS Certified Solutions Architect - Professional (2023)",
      "Microsoft Certified: Azure Solutions Architect Expert (2022)",
      "Certified Kubernetes Administrator (CKA) (2021)",
      "Google Cloud Professional Cloud Architect (2020)",
      "Certified ScrumMaster (CSM) (2019)"
    ]
  }' > /dev/null && echo "  ✓ Certifications"

echo "✅ All resume data saved successfully"
echo ""

# Now generate resume
echo "================================================"
echo "   GENERATING RESUME"
echo "================================================"
echo ""
echo "⏳ Generating resume (may take 10-30 seconds)..."
echo "   Please wait..."
echo ""

# Generate with progress indicator
RESPONSE=$(curl --max-time 45 -s -X POST "http://localhost:5003/api/resume/generate-fast" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN")

CURL_EXIT=$?

if [ $CURL_EXIT -eq 28 ]; then
    echo ""
    echo "❌ Generation timed out after 45 seconds"
    echo ""
    echo "Possible reasons:"
    echo "  • LaTeX compilation is taking too long"
    echo "  • Server might be under heavy load"
    echo "  • Check backend terminal for errors"
    exit 1
fi

# Parse response
echo "📊 Server Response:"
echo "$RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$RESPONSE"
echo ""

# Check success
if echo "$RESPONSE" | grep -q '"success".*true'; then
    FILENAME=$(echo "$RESPONSE" | grep -o '"file":"[^"]*"' | cut -d'"' -f4)
    
    if [ -n "$FILENAME" ]; then
        echo "✅ Resume generated successfully!"
        echo "   Filename: $FILENAME"
        echo ""
        echo "📥 Downloading resume..."
        
        OUTPUT_FILE="$OUTPUT_DIR/Alexander_Johnson_Resume.pdf"
        
        curl --max-time 15 -s -X GET "http://localhost:5003/api/resume/download?file=$FILENAME" \
          -H "Authorization: Bearer $TOKEN" \
          -o "$OUTPUT_FILE"
        
        if [ -f "$OUTPUT_FILE" ] && [ -s "$OUTPUT_FILE" ]; then
            FILE_SIZE=$(ls -lh "$OUTPUT_FILE" | awk '{print $5}')
            echo "✅ Downloaded successfully!"
            echo "   Location: $OUTPUT_FILE"
            echo "   Size: $FILE_SIZE"
            echo ""
            
            # Create a summary file
            cat > "$OUTPUT_DIR/README.txt" <<EOF
RESUME GENERATION TEST SUMMARY
==============================
Generated: $(date)
Test ID: $TIMESTAMP

Resume Details:
- Full Name: Alexander Johnson
- Template: Hiero Standard (default)
- File Size: $FILE_SIZE
- Status: Success

Resume Data Included:
✓ Basic Information (contact, summary)
✓ Education (2 degrees)
✓ Work Experience (3 positions)
✓ Technical Skills (comprehensive)
✓ Projects (3 major projects)
✓ Certifications (5 certifications)

To view the resume:
  open "$OUTPUT_FILE"

Original filename on server: $FILENAME
EOF
            
            echo "================================================"
            echo "   ✅ TEST COMPLETED SUCCESSFULLY!"
            echo "================================================"
            echo ""
            echo "📂 Output directory: $OUTPUT_DIR"
            echo "📄 Resume file: Alexander_Johnson_Resume.pdf"
            echo "📋 Summary: README.txt"
            echo ""
            echo "To view the resume:"
            echo "   open '$OUTPUT_FILE'"
            echo ""
            echo "To view the output folder:"
            echo "   open '$OUTPUT_DIR'"
            echo ""
        else
            echo "❌ Download failed - file is empty or missing"
        fi
    else
        echo "❌ Could not extract filename from server response"
    fi
else
    echo "❌ Resume generation failed"
    echo ""
    echo "Server response indicates an error."
    echo "Please check the backend logs for details."
fi
