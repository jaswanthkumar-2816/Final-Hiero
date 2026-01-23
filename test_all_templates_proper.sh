#!/bin/bash

# Test all resume templates and save to a new folder
# This script properly handles authentication and data flow

echo "🚀 Starting Resume Template Testing..."

# Create output directory
OUTPUT_DIR="generated_templates_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$OUTPUT_DIR"
echo "📁 Created output directory: $OUTPUT_DIR"

# Generate JWT token
echo "🔑 Generating JWT token..."
TOKEN=$(node -e "
const jwt = require('jsonwebtoken');
const payload = { userId: 'testUser123', username: 'test@email.com' };
const token = jwt.sign(payload, 'X7k9P!mQ2aL5vR8', { expiresIn: '1h' });
console.log(token);
")

if [ -z "$TOKEN" ]; then
    echo "❌ Failed to generate token. Make sure jsonwebtoken is installed."
    echo "Run: npm install jsonwebtoken"
    exit 1
fi

echo "✅ Token generated successfully"

# Base URL
BASE_URL="http://localhost:5003"

# Check if backend is running
echo "🔍 Checking backend server..."
if ! curl -s "$BASE_URL" > /dev/null; then
    echo "❌ Backend server is not running on $BASE_URL"
    echo "Please start the backend server first."
    exit 1
fi
echo "✅ Backend server is running"

# Step 1: Save Basic Information
echo ""
echo "📋 Step 1: Saving basic information..."
BASIC_RESPONSE=$(curl -s -X POST "${BASE_URL}/api/resume/basic" \
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
    "career_summary": "Dynamic software engineer with 3+ years of expertise in full-stack development and cloud technologies. Passionate about building scalable applications and contributing to innovative software solutions."
  }')

echo "$BASIC_RESPONSE" | jq '.' 2>/dev/null || echo "$BASIC_RESPONSE"

# Step 2: Save Education
echo ""
echo "🎓 Step 2: Saving education information..."
EDU_RESPONSE=$(curl -s -X POST "${BASE_URL}/api/resume/education" \
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
      },
      {
        "institution": "Narayana Junior College",
        "degree": "Intermediate (MPC)",
        "graduation_year": "2018",
        "gpa": "95%",
        "details": "Mathematics, Physics, Chemistry"
      }
    ]
  }')

echo "$EDU_RESPONSE" | jq '.' 2>/dev/null || echo "$EDU_RESPONSE"

# Step 3: Save Experience
echo ""
echo "💼 Step 3: Saving experience information..."
EXP_RESPONSE=$(curl -s -X POST "${BASE_URL}/api/resume/experience" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "experience": [
      {
        "company": "Tech Mahindra",
        "position": "Senior Software Engineer",
        "duration": "2022 - Present",
        "location": "Hyderabad, India",
        "responsibilities": [
          "Developed and maintained web applications using React.js and Node.js",
          "Implemented RESTful APIs and integrated third-party services",
          "Optimized application performance resulting in 30% faster load times",
          "Led a team of 5 developers in agile development environment"
        ]
      },
      {
        "company": "Infosys",
        "position": "Software Engineering Intern",
        "duration": "Summer 2021",
        "location": "Bangalore, India",
        "responsibilities": [
          "Built responsive web interfaces using HTML, CSS, and JavaScript",
          "Participated in code reviews and followed best practices",
          "Assisted in database design and query optimization"
        ]
      }
    ]
  }')

echo "$EXP_RESPONSE" | jq '.' 2>/dev/null || echo "$EXP_RESPONSE"

# Step 4: Save Skills
echo ""
echo "🛠️ Step 4: Saving skills information..."
SKILLS_RESPONSE=$(curl -s -X POST "${BASE_URL}/api/resume/skills" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "skills": {
      "technical": ["JavaScript", "Python", "React.js", "Node.js", "AWS", "MongoDB", "Docker", "Git"],
      "management": ["Team Leadership", "Project Management", "Agile/Scrum", "Stakeholder Communication"],
      "soft": ["Communication", "Problem Solving", "Analytical Thinking", "Time Management"]
    }
  }')

echo "$SKILLS_RESPONSE" | jq '.' 2>/dev/null || echo "$SKILLS_RESPONSE"

# Step 5: Save Projects
echo ""
echo "💡 Step 5: Saving projects information..."
PROJECTS_RESPONSE=$(curl -s -X POST "${BASE_URL}/api/resume/projects" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "projects": [
      {
        "name": "E-Commerce Platform",
        "description": "Built a full-stack e-commerce platform with payment integration",
        "technologies": ["React", "Node.js", "MongoDB", "Stripe API"],
        "link": "https://github.com/chaitanya/ecommerce"
      },
      {
        "name": "AI Chatbot",
        "description": "Developed an intelligent chatbot using NLP and machine learning",
        "technologies": ["Python", "TensorFlow", "Flask", "React"],
        "link": "https://github.com/chaitanya/ai-chatbot"
      }
    ]
  }')

echo "$PROJECTS_RESPONSE" | jq '.' 2>/dev/null || echo "$PROJECTS_RESPONSE"

# Now test all templates
echo ""
echo "=" | head -c 80 | tr '\n' '='
echo ""
echo "🎨 Generating resumes with all available templates..."
echo "=" | head -c 80 | tr '\n' '='
echo ""

# List of all available templates
TEMPLATES=(
    "modern"
    "classic"
    "minimal"
    "professional"
    "creative"
    "elegant"
    "tech-focus"
)

# Counter for successful generations
SUCCESS_COUNT=0
FAIL_COUNT=0

# Generate resume for each template
for TEMPLATE in "${TEMPLATES[@]}"; do
    echo ""
    echo "📄 Generating resume with template: $TEMPLATE"
    
    # Generate resume
    RESPONSE=$(curl -s -X POST "${BASE_URL}/api/resume/generate" \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $TOKEN" \
      -d "{\"template\": \"$TEMPLATE\"}")
    
    # Check if response contains error
    if echo "$RESPONSE" | grep -q "error\|Error\|Failed\|<!DOCTYPE"; then
        echo "❌ Failed to generate $TEMPLATE template"
        echo "Response: $RESPONSE" | head -c 200
        FAIL_COUNT=$((FAIL_COUNT + 1))
        continue
    fi
    
    # Extract filename from response (try both 'file' and 'filename')
    FILENAME=$(echo "$RESPONSE" | jq -r '.file // .filename' 2>/dev/null)
    
    if [ -z "$FILENAME" ] || [ "$FILENAME" = "null" ]; then
        echo "❌ Failed to get filename for $TEMPLATE template"
        echo "Response: $RESPONSE" | head -c 200
        FAIL_COUNT=$((FAIL_COUNT + 1))
        continue
    fi
    
    # Download the generated PDF
    echo "⬇️  Downloading: $FILENAME"
    
    if curl -s -H "Authorization: Bearer $TOKEN" \
        "${BASE_URL}/api/resume/download?file=$FILENAME" \
        -o "${OUTPUT_DIR}/${TEMPLATE}_resume.pdf"; then
        
        # Check if file is actually a PDF
        if file "${OUTPUT_DIR}/${TEMPLATE}_resume.pdf" | grep -q "PDF"; then
            echo "✅ Successfully generated and saved: ${TEMPLATE}_resume.pdf"
            SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
        else
            echo "❌ Downloaded file is not a valid PDF"
            cat "${OUTPUT_DIR}/${TEMPLATE}_resume.pdf" | head -c 200
            FAIL_COUNT=$((FAIL_COUNT + 1))
        fi
    else
        echo "❌ Failed to download resume"
        FAIL_COUNT=$((FAIL_COUNT + 1))
    fi
    
    # Small delay between requests
    sleep 1
done

# Summary
echo ""
echo "=" | head -c 80 | tr '\n' '='
echo ""
echo "📊 Generation Summary:"
echo "   ✅ Successful: $SUCCESS_COUNT"
echo "   ❌ Failed: $FAIL_COUNT"
echo "   📁 Output directory: $OUTPUT_DIR"
echo ""

if [ $SUCCESS_COUNT -gt 0 ]; then
    echo "Generated files:"
    ls -lh "$OUTPUT_DIR"
    echo ""
    echo "✨ You can now review the generated resumes in the '$OUTPUT_DIR' folder"
else
    echo "⚠️  No resumes were successfully generated. Please check the backend logs."
fi

echo ""
echo "=" | head -c 80 | tr '\n' '='
