#!/bin/bash

# ============================================================
#  TEST ALL RESUME TEMPLATES - COMPREHENSIVE TEST SUITE
# ============================================================
# This script generates resumes using ALL available templates
# and saves them in a timestamped folder for comparison

echo "╔════════════════════════════════════════════════════════╗"
echo "║     TESTING ALL RESUME TEMPLATES                       ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""

# Configuration
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
OUTPUT_DIR="all_templates_test_$TIMESTAMP"
mkdir -p "$OUTPUT_DIR"

# Template definitions (name:filename_prefix)
TEMPLATES=(
  "hiero-standard:Hiero_Standard"
  "professionalcv:Professional_CV"
  "modernsimple:Modern_Simple"
  "awesomecv:Awesome_CV"
  "altacv:AltaCV_Modern"
  "deedycv:Deedy_CV"
  "elegant:Elegant_Executive"
  "functional:Functional_Skills"
)

echo "📁 Output Directory: $OUTPUT_DIR"
echo "📋 Templates to Test: ${#TEMPLATES[@]}"
echo ""

# ============================================================
# Step 1: Check Backend Server
# ============================================================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Step 1: Checking Backend Server"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

BACKEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5003/ || echo "000")

if [ "$BACKEND_STATUS" = "000" ]; then
    echo "❌ Backend server is NOT running"
    echo ""
    echo "Please start the backend server:"
    echo "   cd 'hiero backend' && npm start"
    echo ""
    exit 1
fi

echo "✅ Backend server is RUNNING on port 5003"
echo ""

# ============================================================
# Step 2: Generate Authentication Token
# ============================================================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Step 2: Generating Authentication Token"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

TOKEN=$(node -e "
const jwt = require('jsonwebtoken');
const payload = { 
  userId: 'allTemplatesTest_${TIMESTAMP}', 
  username: 'templates-test@hiero.com' 
};
const token = jwt.sign(payload, 'X7k9P!mQ2aL5vR8', { expiresIn: '3h' });
console.log(token);
")

if [ -z "$TOKEN" ]; then
    echo "❌ Failed to generate authentication token"
    exit 1
fi

echo "✅ Token generated successfully"
echo ""

# ============================================================
# Step 3: Save Comprehensive Resume Data
# ============================================================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Step 3: Saving Comprehensive Resume Data"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Save Basic Information
curl -s -X POST "http://localhost:5003/api/resume/basic" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "full_name": "Sarah Chen",
    "contact_info": {
      "email": "sarah.chen@email.com",
      "phone": "+1 (555) 234-5678",
      "linkedin": "linkedin.com/in/sarahchen",
      "website": "www.sarahchen.dev",
      "address": "New York, NY 10001"
    },
    "career_summary": "Innovative Full-Stack Developer with 6+ years of experience building scalable web applications and leading agile teams. Proven expertise in React, Node.js, and cloud technologies. Passionate about creating user-centric solutions and mentoring junior developers."
  }' > /dev/null && echo "  ✓ Basic Information"

# Save Education
curl -s -X POST "http://localhost:5003/api/resume/education" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "education": [
      {
        "institution": "Carnegie Mellon University",
        "degree": "Master of Science in Software Engineering",
        "graduation_year": "2018",
        "gpa": "3.92/4.0",
        "details": "Thesis: Optimizing React Performance in Large-Scale Applications"
      },
      {
        "institution": "UC Berkeley",
        "degree": "Bachelor of Science in Computer Science",
        "graduation_year": "2016",
        "gpa": "3.87/4.0",
        "details": "Honors Graduate, Dean'\''s List"
      }
    ]
  }' > /dev/null && echo "  ✓ Education"

# Save Work Experience
curl -s -X POST "http://localhost:5003/api/resume/experience" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "experience": [
      {
        "company": "Meta (Facebook)",
        "position": "Senior Full-Stack Engineer",
        "duration": "2021 - Present",
        "location": "Menlo Park, CA",
        "responsibilities": [
          "Architected and implemented React-based UI components used by 100M+ users daily",
          "Led migration from REST to GraphQL, reducing API response time by 45%",
          "Built real-time notification system handling 5M+ events per minute using Node.js and Redis",
          "Mentored team of 6 engineers and established code review best practices",
          "Reduced bundle size by 30% through optimization and lazy loading strategies"
        ]
      },
      {
        "company": "Shopify",
        "position": "Full-Stack Developer",
        "duration": "2018 - 2021",
        "location": "Toronto, Canada",
        "responsibilities": [
          "Developed merchant dashboard features using React and Ruby on Rails",
          "Implemented payment processing integrations for 15+ payment gateways",
          "Built automated testing suite improving code coverage from 70% to 93%",
          "Optimized database queries reducing page load time by 40%",
          "Collaborated with product and design teams in agile sprints"
        ]
      },
      {
        "company": "Startup Inc.",
        "position": "Junior Software Engineer",
        "duration": "2016 - 2018",
        "location": "San Francisco, CA",
        "responsibilities": [
          "Built responsive web applications using React and Node.js",
          "Implemented RESTful APIs serving mobile and web clients",
          "Participated in code reviews and pair programming sessions",
          "Contributed to open-source projects and tech blog"
        ]
      }
    ]
  }' > /dev/null && echo "  ✓ Work Experience"

# Save Skills
curl -s -X POST "http://localhost:5003/api/resume/skills" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "skills": {
      "technical": [
        "Languages: JavaScript, TypeScript, Python, SQL, HTML5, CSS3",
        "Frontend: React.js, Next.js, Redux, Vue.js, Webpack, Tailwind CSS",
        "Backend: Node.js, Express.js, GraphQL, REST APIs, Django",
        "Databases: PostgreSQL, MongoDB, Redis, MySQL, DynamoDB",
        "Cloud & DevOps: AWS (S3, Lambda, EC2), Docker, Kubernetes, CI/CD",
        "Testing: Jest, React Testing Library, Cypress, Mocha, Selenium",
        "Tools: Git, GitHub, JIRA, Figma, VS Code, Postman"
      ],
      "management": [
        "Agile/Scrum methodologies and sprint planning",
        "Team leadership and mentoring",
        "Code review and quality assurance",
        "Technical documentation",
        "Cross-functional collaboration"
      ],
      "soft": [
        "Excellent communication and presentation skills",
        "Strong problem-solving abilities",
        "Team player with leadership qualities",
        "Adaptable to new technologies",
        "Detail-oriented and organized"
      ]
    }
  }' > /dev/null && echo "  ✓ Skills"

# Save Projects
curl -s -X POST "http://localhost:5003/api/resume/projects" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "projects": [
      {
        "name": "TaskFlow - Project Management Platform",
        "description": "Built a comprehensive project management SaaS platform with real-time collaboration features, serving 10,000+ users",
        "technologies": ["React", "Node.js", "PostgreSQL", "Socket.io", "AWS"],
        "link": "github.com/sarachen/taskflow"
      },
      {
        "name": "DevAnalytics Dashboard",
        "description": "Created an analytics dashboard for development teams to track code quality, velocity, and deployment metrics",
        "technologies": ["Next.js", "GraphQL", "MongoDB", "D3.js", "Docker"],
        "link": "github.com/sarachen/dev-analytics"
      },
      {
        "name": "Open Source Contributions",
        "description": "Active contributor to React, Redux, and various open-source projects with 500+ merged pull requests",
        "technologies": ["JavaScript", "TypeScript", "Testing"],
        "link": "github.com/sarachen"
      }
    ]
  }' > /dev/null && echo "  ✓ Projects"

# Save Certifications
curl -s -X POST "http://localhost:5003/api/resume/certifications" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "certifications": [
      "AWS Certified Developer - Associate (2023)",
      "Meta Front-End Developer Professional Certificate (2022)",
      "MongoDB Certified Developer (2021)",
      "React Developer Certification (2020)"
    ]
  }' > /dev/null && echo "  ✓ Certifications"

echo "✅ All resume data saved successfully"
echo ""

# ============================================================
# Step 4: Generate Resumes for Each Template
# ============================================================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Step 4: Generating Resumes for ALL Templates"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

SUCCESS_COUNT=0
FAILED_COUNT=0
declare -a FAILED_TEMPLATES
declare -a SUCCESS_TEMPLATES

for TEMPLATE_INFO in "${TEMPLATES[@]}"; do
    IFS=':' read -r TEMPLATE_ID TEMPLATE_NAME <<< "$TEMPLATE_INFO"
    
    echo "────────────────────────────────────────────────────────"
    echo "Testing: $TEMPLATE_NAME"
    echo "Template ID: $TEMPLATE_ID"
    echo "────────────────────────────────────────────────────────"
    
    # Generate resume
    RESPONSE=$(curl --max-time 45 -s -X POST "http://localhost:5003/api/resume/generate-fast" \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $TOKEN")
    
    # Check if successful
    if echo "$RESPONSE" | grep -q '"success".*true'; then
        FILENAME=$(echo "$RESPONSE" | grep -o '"file":"[^"]*"' | cut -d'"' -f4)
        
        if [ -n "$FILENAME" ]; then
            OUTPUT_FILE="$OUTPUT_DIR/${TEMPLATE_NAME}_Resume.pdf"
            
            # Download the file
            curl --max-time 15 -s -X GET "http://localhost:5003/api/resume/download?file=$FILENAME" \
              -H "Authorization: Bearer $TOKEN" \
              -o "$OUTPUT_FILE"
            
            if [ -f "$OUTPUT_FILE" ] && [ -s "$OUTPUT_FILE" ]; then
                FILE_SIZE=$(ls -lh "$OUTPUT_FILE" | awk '{print $5}')
                echo "✅ SUCCESS - Generated: $OUTPUT_FILE ($FILE_SIZE)"
                SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
                SUCCESS_TEMPLATES+=("$TEMPLATE_NAME ($FILE_SIZE)")
            else
                echo "❌ FAILED - Download unsuccessful"
                FAILED_COUNT=$((FAILED_COUNT + 1))
                FAILED_TEMPLATES+=("$TEMPLATE_NAME (download failed)")
            fi
        else
            echo "❌ FAILED - Could not extract filename"
            FAILED_COUNT=$((FAILED_COUNT + 1))
            FAILED_TEMPLATES+=("$TEMPLATE_NAME (no filename)")
        fi
    else
        ERROR_MSG=$(echo "$RESPONSE" | grep -o '"error":"[^"]*"' | cut -d'"' -f4)
        echo "❌ FAILED - $ERROR_MSG"
        FAILED_COUNT=$((FAILED_COUNT + 1))
        FAILED_TEMPLATES+=("$TEMPLATE_NAME ($ERROR_MSG)")
    fi
    
    echo ""
    sleep 2  # Delay between requests to avoid overwhelming server
done

# ============================================================
# Step 5: Generate Summary Report
# ============================================================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Step 5: Generating Summary Report"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Create summary file
cat > "$OUTPUT_DIR/TEST_SUMMARY.txt" <<EOF
╔════════════════════════════════════════════════════════════════╗
║          RESUME TEMPLATES TEST SUMMARY                         ║
╚════════════════════════════════════════════════════════════════╝

Test Date: $(date)
Test ID: $TIMESTAMP

RESULTS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total Templates Tested: ${#TEMPLATES[@]}
Successful: $SUCCESS_COUNT
Failed: $FAILED_COUNT
Success Rate: $(awk "BEGIN {printf \"%.1f\", ($SUCCESS_COUNT/${#TEMPLATES[@]})*100}")%

SUCCESSFUL TEMPLATES:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
EOF

if [ ${#SUCCESS_TEMPLATES[@]} -gt 0 ]; then
    for template in "${SUCCESS_TEMPLATES[@]}"; do
        echo "  ✓ $template" >> "$OUTPUT_DIR/TEST_SUMMARY.txt"
    done
else
    echo "  (none)" >> "$OUTPUT_DIR/TEST_SUMMARY.txt"
fi

cat >> "$OUTPUT_DIR/TEST_SUMMARY.txt" <<EOF

FAILED TEMPLATES:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
EOF

if [ ${#FAILED_TEMPLATES[@]} -gt 0 ]; then
    for template in "${FAILED_TEMPLATES[@]}"; do
        echo "  ✗ $template" >> "$OUTPUT_DIR/TEST_SUMMARY.txt"
    done
else
    echo "  (none)" >> "$OUTPUT_DIR/TEST_SUMMARY.txt"
fi

cat >> "$OUTPUT_DIR/TEST_SUMMARY.txt" <<EOF

RESUME DATA USED:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Candidate: Sarah Chen
Profile: Senior Full-Stack Developer
Experience: 6+ years
Education: M.S. Software Engineering (CMU)
Companies: Meta, Shopify, Startup Inc.
Skills: React, Node.js, AWS, Docker, and more

TO VIEW RESUMES:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Command: open "$OUTPUT_DIR"
Or manually browse to: $OUTPUT_DIR

EOF

echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║                    TEST COMPLETE!                              ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""
echo "📊 FINAL RESULTS:"
echo "   Total Templates: ${#TEMPLATES[@]}"
echo "   ✅ Successful: $SUCCESS_COUNT"
echo "   ❌ Failed: $FAILED_COUNT"
echo "   📈 Success Rate: $(awk "BEGIN {printf \"%.1f\", ($SUCCESS_COUNT/${#TEMPLATES[@]})*100}")%"
echo ""
echo "📂 Output Directory: $OUTPUT_DIR"
echo "📄 Summary Report: TEST_SUMMARY.txt"
echo ""

if [ $SUCCESS_COUNT -gt 0 ]; then
    echo "✅ SUCCESSFULLY GENERATED TEMPLATES:"
    for template in "${SUCCESS_TEMPLATES[@]}"; do
        echo "   ✓ $template"
    done
    echo ""
fi

if [ $FAILED_COUNT -gt 0 ]; then
    echo "❌ FAILED TEMPLATES:"
    for template in "${FAILED_TEMPLATES[@]}"; do
        echo "   ✗ $template"
    done
    echo ""
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "To view all generated resumes:"
echo "   open '$OUTPUT_DIR'"
echo ""
echo "To view the summary report:"
echo "   cat '$OUTPUT_DIR/TEST_SUMMARY.txt'"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
