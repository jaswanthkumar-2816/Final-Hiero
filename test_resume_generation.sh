#!/bin/bash

# Comprehensive Resume Template Test Script
# This script saves resume data and then generates PDFs for all templates

echo "======================================"
echo "Testing All Resume Templates"
echo "======================================"
echo ""

# Create output directory
OUTPUT_DIR="template_test_output"
mkdir -p "$OUTPUT_DIR"

# Generate JWT Token
echo "Step 1: Generating JWT Token..."
TOKEN=$(node -e "
const jwt = require('jsonwebtoken');
const payload = { userId: 'testUser123', username: 'test@email.com' };
const token = jwt.sign(payload, 'X7k9P!mQ2aL5vR8', { expiresIn: '1h' });
console.log(token);
")

if [ -z "$TOKEN" ]; then
    echo "❌ Failed to generate token"
    exit 1
fi

echo "✅ Token generated successfully"
echo ""

# Step 2: Save Basic Information
echo "Step 2: Saving Basic Information..."
RESPONSE=$(curl -s -X POST "http://localhost:5003/api/resume/basic" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "full_name": "John Smith",
    "contact_info": {
      "email": "john.smith@email.com",
      "phone": "+1 (555) 123-4567",
      "linkedin": "https://linkedin.com/in/john-smith",
      "website": "https://johnsmith.dev",
      "address": "San Francisco, CA, USA"
    },
    "career_summary": "Experienced software engineer with 5+ years of expertise in full-stack development, cloud architecture, and team leadership. Passionate about building scalable solutions."
  }')

if echo "$RESPONSE" | grep -q "success.*true"; then
    echo "✅ Basic info saved successfully"
else
    echo "❌ Failed to save basic info: $RESPONSE"
    exit 1
fi
echo ""

# Step 3: Save Education
echo "Step 3: Saving Education..."
RESPONSE=$(curl -s -X POST "http://localhost:5003/api/resume/education" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "education": [
      {
        "institution": "Stanford University",
        "degree": "Master of Science in Computer Science",
        "graduation_year": "2018",
        "gpa": "3.9/4.0",
        "details": "Specialized in Artificial Intelligence and Machine Learning"
      },
      {
        "institution": "University of California, Berkeley",
        "degree": "Bachelor of Science in Computer Engineering",
        "graduation_year": "2016",
        "gpa": "3.8/4.0",
        "details": "Dean'\''s List, Summa Cum Laude"
      }
    ]
  }')

if echo "$RESPONSE" | grep -q "success.*true"; then
    echo "✅ Education saved successfully"
else
    echo "❌ Failed to save education: $RESPONSE"
fi
echo ""

# Step 4: Save Experience
echo "Step 4: Saving Experience..."
RESPONSE=$(curl -s -X POST "http://localhost:5003/api/resume/experience" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "experience": [
      {
        "company": "Google Inc.",
        "position": "Senior Software Engineer",
        "duration": "2020 - Present",
        "location": "Mountain View, CA",
        "responsibilities": [
          "Led a team of 5 engineers to develop and deploy microservices architecture serving 10M+ users",
          "Designed and implemented RESTful APIs using Node.js, reducing response time by 40%",
          "Architected cloud infrastructure on GCP, cutting operational costs by 25%",
          "Mentored junior developers and conducted code reviews to maintain high code quality"
        ]
      },
      {
        "company": "Amazon Web Services",
        "position": "Software Development Engineer",
        "duration": "2018 - 2020",
        "location": "Seattle, WA",
        "responsibilities": [
          "Developed scalable backend services using Java and Python for AWS Lambda",
          "Implemented automated testing pipelines, improving code coverage from 60% to 95%",
          "Collaborated with cross-functional teams to deliver features on tight deadlines",
          "Optimized database queries resulting in 50% improvement in application performance"
        ]
      }
    ]
  }')

if echo "$RESPONSE" | grep -q "success.*true"; then
    echo "✅ Experience saved successfully"
else
    echo "❌ Failed to save experience: $RESPONSE"
fi
echo ""

# Step 5: Save Skills
echo "Step 5: Saving Skills..."
RESPONSE=$(curl -s -X POST "http://localhost:5003/api/resume/skills" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "skills": {
      "technical": [
        "JavaScript/TypeScript", "Python", "Java", "React.js", "Node.js", "Express.js",
        "MongoDB", "PostgreSQL", "AWS", "GCP", "Docker", "Kubernetes", "Git", "CI/CD"
      ],
      "management": [
        "Team Leadership", "Project Management", "Agile/Scrum", "Code Review"
      ],
      "soft": [
        "Communication", "Problem Solving", "Critical Thinking", "Collaboration"
      ]
    }
  }')

if echo "$RESPONSE" | grep -q "success.*true"; then
    echo "✅ Skills saved successfully"
else
    echo "❌ Failed to save skills: $RESPONSE"
fi
echo ""

# Step 6: Save Projects
echo "Step 6: Saving Projects..."
RESPONSE=$(curl -s -X POST "http://localhost:5003/api/resume/projects" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "projects": [
      {
        "name": "E-Commerce Platform",
        "description": "Built a full-stack e-commerce platform using MERN stack",
        "technologies": ["React.js", "Node.js", "MongoDB", "Stripe API"],
        "link": "https://github.com/johnsmith/ecommerce"
      },
      {
        "name": "AI Chatbot",
        "description": "Developed an AI-powered customer service chatbot using NLP",
        "technologies": ["Python", "TensorFlow", "Flask", "Docker"],
        "link": "https://github.com/johnsmith/ai-chatbot"
      }
    ]
  }')

if echo "$RESPONSE" | grep -q "success.*true"; then
    echo "✅ Projects saved successfully"
else
    echo "❌ Failed to save projects: $RESPONSE"
fi
echo ""

# Step 7: Save Certifications
echo "Step 7: Saving Certifications..."
RESPONSE=$(curl -s -X POST "http://localhost:5003/api/resume/certifications" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "certifications": [
      "AWS Certified Solutions Architect - Professional",
      "Google Cloud Professional Developer",
      "Certified Kubernetes Administrator (CKA)"
    ]
  }')

if echo "$RESPONSE" | grep -q "success.*true"; then
    echo "✅ Certifications saved successfully"
else
    echo "❌ Failed to save certifications: $RESPONSE"
fi
echo ""

echo "======================================"
echo "Step 8: Generating Hiero Standard Resume"
echo "======================================"
echo ""

# Generate the default Hiero Standard template
echo "Generating Hiero Standard template..."
RESPONSE=$(curl -s -X POST "http://localhost:5003/api/resume/generate-fast" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN")

echo "Response: $RESPONSE"

if echo "$RESPONSE" | grep -q "filename\|file"; then
    FILENAME=$(echo "$RESPONSE" | grep -o '"file":"[^"]*"' | cut -d'"' -f4)
    
    if [ -z "$FILENAME" ]; then
        FILENAME=$(echo "$RESPONSE" | grep -o '"filename":"[^"]*"' | cut -d'"' -f4)
    fi
    
    if [ -n "$FILENAME" ]; then
        OUTPUT_FILE="$OUTPUT_DIR/Hiero_Standard_Resume.pdf"
        curl -s -X GET "http://localhost:5003/api/resume/download?file=$FILENAME" \
          -H "Authorization: Bearer $TOKEN" \
          -o "$OUTPUT_FILE"
        
        if [ -f "$OUTPUT_FILE" ] && [ -s "$OUTPUT_FILE" ]; then
            FILE_SIZE=$(du -h "$OUTPUT_FILE" | cut -f1)
            echo "✅ Success: $OUTPUT_FILE ($FILE_SIZE)"
        else
            echo "❌ Failed: Download unsuccessful"
        fi
    else
        echo "❌ Failed: Could not extract filename from response"
    fi
else
    echo "❌ Failed: Generation unsuccessful"
fi

echo ""
echo "======================================"
echo "Test Summary"
echo "======================================"
echo ""
echo "Generated resumes are saved in: $OUTPUT_DIR/"
echo ""

# List all generated files
if [ -d "$OUTPUT_DIR" ] && [ "$(ls -A $OUTPUT_DIR 2>/dev/null)" ]; then
    echo "Generated files:"
    ls -lh "$OUTPUT_DIR/" | grep ".pdf" | awk '{print "  - " $9 " (" $5 ")"}'
    echo ""
    echo "✅ Test completed! Check the $OUTPUT_DIR folder for all generated resumes."
    echo ""
    echo "To view the resumes, run:"
    echo "  open $OUTPUT_DIR"
else
    echo "⚠️ No resumes were generated successfully."
    echo ""
    echo "To start the backend server if it's not running:"
    echo "  cd 'hiero backend' && npm start"
fi
