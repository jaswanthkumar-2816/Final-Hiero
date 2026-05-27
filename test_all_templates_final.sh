#!/bin/bash

# ALL TEMPLATES TEST - Generate resumes with every available template
# This script tests all 10+ templates and saves them in a timestamped folder

echo "========================================================"
echo "        TESTING ALL RESUME TEMPLATES"
echo "========================================================"
echo ""

# Create timestamped output directory
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
OUTPUT_DIR="all_templates_test_$TIMESTAMP"
mkdir -p "$OUTPUT_DIR"

echo "📁 Output directory: $OUTPUT_DIR"
echo ""

# Check backend
echo "🔍 Checking backend server..."
BACKEND_CHECK=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5003/ || echo "000")

if [ "$BACKEND_CHECK" = "000" ]; then
    echo "❌ Backend server not running!"
    echo "Please restart it with: cd 'hiero backend' && npm start"
    exit 1
fi
echo "✅ Backend is running"
echo ""

# All available templates based on the templates directory
TEMPLATES=(
    "hiero-standard:Hiero_Standard:Professional template with clean layout"
    "hiero-modern:Hiero_Modern:Modern design with contemporary styling"
    "professionalcv:Professional_CV:Classic professional format"
    "modernsimple:Modern_Simple:Simple and modern design"
    "awesomecv:Awesome_CV:Creative and eye-catching layout"
    "altacv:AltaCV:Alternative CV format, great for tech roles"
    "deedycv:Deedy_CV:Developer-friendly resume format"
    "elegant:Elegant:Elegant and sophisticated design"
    "functional:Functional:Skills-focused functional format"
    "awesomece:Awesome_CE:Creative edition variant"
)

echo "📋 Found ${#TEMPLATES[@]} templates to test"
echo ""

# Counters
SUCCESS_COUNT=0
FAILED_COUNT=0
declare -a FAILED_TEMPLATES

# Generate Token
echo "🔑 Generating JWT token..."
TOKEN=$(node -e "
const jwt = require('jsonwebtoken');
const payload = { userId: 'allTemplatesTest_${TIMESTAMP}', username: 'templates@test.com' };
const token = jwt.sign(payload, 'X7k9P!mQ2aL5vR8', { expiresIn: '3h' });
console.log(token);
")

if [ -z "$TOKEN" ]; then
    echo "❌ Failed to generate token"
    exit 1
fi
echo "✅ Token generated"
echo ""

# Save comprehensive resume data ONCE
echo "💾 Saving comprehensive resume data..."

curl -s -X POST "http://localhost:5003/api/resume/basic" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "full_name": "Sarah Williams",
    "contact_info": {
      "email": "sarah.williams@email.com",
      "phone": "+1 (555) 234-5678",
      "linkedin": "linkedin.com/in/sarahwilliams",
      "website": "www.sarahwilliams.dev",
      "address": "Austin, TX 78701"
    },
    "career_summary": "Innovative Full-Stack Software Engineer with 6+ years of experience building scalable web applications and leading development teams. Expert in modern JavaScript frameworks, cloud architecture, and agile methodologies. Passionate about creating elegant solutions to complex problems."
  }' > /dev/null && echo "  ✓ Basic information"

curl -s -X POST "http://localhost:5003/api/resume/education" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "education": [
      {
        "institution": "Carnegie Mellon University",
        "degree": "Master of Science in Software Engineering",
        "graduation_year": "2017",
        "gpa": "3.92/4.0",
        "details": "Thesis: Optimizing React Performance in Large-Scale Applications"
      },
      {
        "institution": "University of Texas at Austin",
        "degree": "Bachelor of Science in Computer Science",
        "graduation_year": "2015",
        "gpa": "3.88/4.0",
        "details": "Summa Cum Laude, ACM Student Chapter President"
      }
    ]
  }' > /dev/null && echo "  ✓ Education"

curl -s -X POST "http://localhost:5003/api/resume/experience" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "experience": [
      {
        "company": "Meta (Facebook)",
        "position": "Senior Software Engineer",
        "duration": "Mar 2019 - Present",
        "location": "Menlo Park, CA",
        "responsibilities": [
          "Architected and deployed React-based features serving 2B+ users worldwide",
          "Led team of 6 engineers developing GraphQL APIs for Instagram Stories",
          "Reduced bundle size by 35% through code-splitting and lazy loading techniques",
          "Mentored 8 junior engineers and conducted 50+ technical interviews",
          "Improved application performance by 50% using advanced React optimization patterns"
        ]
      },
      {
        "company": "Netflix",
        "position": "Software Engineer II",
        "duration": "Jun 2017 - Feb 2019",
        "location": "Los Gatos, CA",
        "responsibilities": [
          "Built microservices for content recommendation engine using Node.js and Python",
          "Implemented A/B testing framework increasing user engagement by 28%",
          "Developed RESTful APIs handling 50M+ requests per day",
          "Collaborated with data science team to optimize ML model deployment pipeline"
        ]
      },
      {
        "company": "Uber Technologies",
        "position": "Software Engineer",
        "duration": "Jul 2015 - May 2017",
        "location": "San Francisco, CA",
        "responsibilities": [
          "Developed real-time mapping features using React Native and Google Maps API",
          "Built automated testing suite increasing code coverage to 90%",
          "Optimized database queries reducing response time by 40%"
        ]
      }
    ]
  }' > /dev/null && echo "  ✓ Experience"

curl -s -X POST "http://localhost:5003/api/resume/skills" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "skills": {
      "technical": [
        "Languages: JavaScript/TypeScript, Python, Java, C++, SQL, HTML5, CSS3",
        "Frontend: React.js, Next.js, Vue.js, Redux, Webpack, Babel, Tailwind CSS",
        "Backend: Node.js, Express.js, Django, Flask, GraphQL, REST APIs",
        "Databases: PostgreSQL, MongoDB, Redis, MySQL, DynamoDB",
        "Cloud & DevOps: AWS (S3, EC2, Lambda), Docker, Kubernetes, CI/CD, Jenkins",
        "Tools: Git, JIRA, Figma, Postman, VS Code, WebStorm"
      ],
      "management": [
        "Agile/Scrum methodology and sprint planning",
        "Technical leadership and team mentoring",
        "Code review and quality assurance",
        "Cross-functional collaboration"
      ],
      "soft": [
        "Excellent communication and presentation skills",
        "Problem-solving and analytical thinking",
        "Team collaboration and leadership",
        "Adaptability and continuous learning"
      ]
    }
  }' > /dev/null && echo "  ✓ Skills"

curl -s -X POST "http://localhost:5003/api/resume/projects" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "projects": [
      {
        "name": "TaskMaster Pro",
        "description": "Full-stack project management SaaS application with real-time collaboration, built using MERN stack. Serves 10,000+ active users.",
        "technologies": ["React.js", "Node.js", "MongoDB", "Socket.io", "AWS"],
        "link": "github.com/sarahw/taskmaster-pro"
      },
      {
        "name": "AI Code Assistant",
        "description": "VS Code extension using OpenAI API to provide intelligent code suggestions and documentation generation. 50K+ downloads.",
        "technologies": ["TypeScript", "VS Code API", "OpenAI API", "Node.js"],
        "link": "github.com/sarahw/ai-code-assistant"
      },
      {
        "name": "Mobile Fitness Tracker",
        "description": "Cross-platform mobile app for fitness tracking with ML-powered workout recommendations.",
        "technologies": ["React Native", "Firebase", "TensorFlow", "Python"],
        "link": "github.com/sarahw/fitness-tracker"
      }
    ]
  }' > /dev/null && echo "  ✓ Projects"

curl -s -X POST "http://localhost:5003/api/resume/certifications" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "certifications": [
      "AWS Certified Solutions Architect - Associate (2023)",
      "Meta Certified React Developer (2022)",
      "Google Cloud Professional Developer (2021)",
      "Certified ScrumMaster (CSM) (2020)"
    ]
  }' > /dev/null && echo "  ✓ Certifications"

echo "✅ All resume data saved"
echo ""

echo "========================================================"
echo "  GENERATING RESUMES WITH ALL TEMPLATES"
echo "========================================================"
echo ""

# Create summary file
SUMMARY_FILE="$OUTPUT_DIR/TEMPLATES_SUMMARY.txt"
cat > "$SUMMARY_FILE" <<EOF
RESUME TEMPLATES TEST SUMMARY
==============================
Test Date: $(date)
Test ID: $TIMESTAMP
Total Templates: ${#TEMPLATES[@]}

Generated Resumes:
==================
EOF

# Loop through each template
TEMPLATE_NUM=1
for TEMPLATE_ENTRY in "${TEMPLATES[@]}"; do
    IFS=':' read -r TEMPLATE_ID TEMPLATE_NAME TEMPLATE_DESC <<< "$TEMPLATE_ENTRY"
    
    echo "[$TEMPLATE_NUM/${#TEMPLATES[@]}] Testing: $TEMPLATE_NAME"
    echo "    Template ID: $TEMPLATE_ID"
    echo "    Description: $TEMPLATE_DESC"
    echo "    ----------------------------------------"
    
    # Set the template
    TEMPLATE_RESPONSE=$(curl -s -X POST "http://localhost:5003/api/resume/template" \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $TOKEN" \
      -d "{\"template\": \"$TEMPLATE_ID\"}")
    
    if echo "$TEMPLATE_RESPONSE" | grep -q '"success".*true'; then
        echo "    ✓ Template set successfully"
        
        # Generate resume using generate-fast (more reliable)
        GEN_RESPONSE=$(curl --max-time 30 -s -X POST "http://localhost:5003/api/resume/generate-fast" \
          -H "Content-Type: application/json" \
          -H "Authorization: Bearer $TOKEN")
        
        if echo "$GEN_RESPONSE" | grep -q '"success".*true'; then
            FILENAME=$(echo "$GEN_RESPONSE" | grep -o '"file":"[^"]*"' | cut -d'"' -f4)
            
            if [ -n "$FILENAME" ]; then
                OUTPUT_FILE="$OUTPUT_DIR/${TEMPLATE_NAME}.pdf"
                
                curl --max-time 15 -s -X GET "http://localhost:5003/api/resume/download?file=$FILENAME" \
                  -H "Authorization: Bearer $TOKEN" \
                  -o "$OUTPUT_FILE"
                
                if [ -f "$OUTPUT_FILE" ] && [ -s "$OUTPUT_FILE" ]; then
                    FILE_SIZE=$(ls -lh "$OUTPUT_FILE" | awk '{print $5}')
                    echo "    ✅ SUCCESS - Downloaded: $OUTPUT_FILE ($FILE_SIZE)"
                    SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
                    
                    # Add to summary
                    echo "[$TEMPLATE_NUM] $TEMPLATE_NAME - ✅ SUCCESS ($FILE_SIZE)" >> "$SUMMARY_FILE"
                    echo "    File: ${TEMPLATE_NAME}.pdf" >> "$SUMMARY_FILE"
                    echo "    Template ID: $TEMPLATE_ID" >> "$SUMMARY_FILE"
                    echo "    Description: $TEMPLATE_DESC" >> "$SUMMARY_FILE"
                    echo "" >> "$SUMMARY_FILE"
                else
                    echo "    ❌ FAILED - Download unsuccessful"
                    FAILED_COUNT=$((FAILED_COUNT + 1))
                    FAILED_TEMPLATES+=("$TEMPLATE_NAME")
                    echo "[$TEMPLATE_NUM] $TEMPLATE_NAME - ❌ FAILED (Download error)" >> "$SUMMARY_FILE"
                    echo "" >> "$SUMMARY_FILE"
                fi
            else
                echo "    ❌ FAILED - Could not extract filename"
                FAILED_COUNT=$((FAILED_COUNT + 1))
                FAILED_TEMPLATES+=("$TEMPLATE_NAME")
                echo "[$TEMPLATE_NUM] $TEMPLATE_NAME - ❌ FAILED (No filename)" >> "$SUMMARY_FILE"
                echo "" >> "$SUMMARY_FILE"
            fi
        else
            echo "    ❌ FAILED - Generation error: $GEN_RESPONSE"
            FAILED_COUNT=$((FAILED_COUNT + 1))
            FAILED_TEMPLATES+=("$TEMPLATE_NAME")
            echo "[$TEMPLATE_NUM] $TEMPLATE_NAME - ❌ FAILED (Generation error)" >> "$SUMMARY_FILE"
            echo "" >> "$SUMMARY_FILE"
        fi
    else
        echo "    ❌ FAILED - Could not set template: $TEMPLATE_RESPONSE"
        FAILED_COUNT=$((FAILED_COUNT + 1))
        FAILED_TEMPLATES+=("$TEMPLATE_NAME")
        echo "[$TEMPLATE_NUM] $TEMPLATE_NAME - ❌ FAILED (Template set error)" >> "$SUMMARY_FILE"
        echo "" >> "$SUMMARY_FILE"
    fi
    
    echo ""
    TEMPLATE_NUM=$((TEMPLATE_NUM + 1))
    sleep 2  # Small delay between generations
done

# Add final summary
cat >> "$SUMMARY_FILE" <<EOF

==============================
FINAL RESULTS
==============================
Total Templates Tested: ${#TEMPLATES[@]}
Successful: $SUCCESS_COUNT
Failed: $FAILED_COUNT
Success Rate: $(awk "BEGIN {printf \"%.1f\", ($SUCCESS_COUNT/${#TEMPLATES[@]})*100}")%

EOF

if [ $FAILED_COUNT -gt 0 ]; then
    echo "Failed Templates:" >> "$SUMMARY_FILE"
    for FAILED in "${FAILED_TEMPLATES[@]}"; do
        echo "  - $FAILED" >> "$SUMMARY_FILE"
    done
    echo "" >> "$SUMMARY_FILE"
fi

cat >> "$SUMMARY_FILE" <<EOF
To view all resumes:
  open "$OUTPUT_DIR"

Test completed at: $(date)
EOF

# Print final results
echo "========================================================"
echo "           FINAL RESULTS"
echo "========================================================"
echo ""
echo "✅ Successfully generated: $SUCCESS_COUNT / ${#TEMPLATES[@]} templates"
echo "❌ Failed: $FAILED_COUNT"
echo ""

if [ $SUCCESS_COUNT -gt 0 ]; then
    echo "📂 All resumes saved in: $OUTPUT_DIR/"
    echo ""
    echo "Generated files:"
    ls -lh "$OUTPUT_DIR/"*.pdf 2>/dev/null | awk '{print "  ✓ " $9 " (" $5 ")"}'
    echo ""
fi

if [ $FAILED_COUNT -gt 0 ]; then
    echo "⚠️  Failed templates:"
    for FAILED in "${FAILED_TEMPLATES[@]}"; do
        echo "  ✗ $FAILED"
    done
    echo ""
fi

echo "📋 Summary report: $SUMMARY_FILE"
echo ""
echo "To view all resumes:"
echo "  open '$OUTPUT_DIR'"
echo ""
echo "To read the summary:"
echo "  cat '$SUMMARY_FILE'"
echo ""
