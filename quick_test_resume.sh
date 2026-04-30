#!/bin/bash

# Quick Resume Generation Test
# This script tests resume generation with proper error handling and timeouts

echo "======================================"
echo "Quick Resume Generation Test"
echo "======================================"
echo ""

# Create output directory
OUTPUT_DIR="template_test_output"
mkdir -p "$OUTPUT_DIR"

# Check if backend is running
echo "Checking backend server..."
BACKEND_CHECK=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5003/ || echo "000")

if [ "$BACKEND_CHECK" = "000" ]; then
    echo "❌ Backend server is not running on port 5003"
    echo "Please start it with: cd 'hiero backend' && npm start"
    exit 1
fi

echo "✅ Backend server is running"
echo ""

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

echo "✅ Token generated"
echo ""

# Save data quickly
echo "Step 2: Saving resume data..."

# Basic Info
curl -s -X POST "http://localhost:5003/api/resume/basic" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "full_name": "John Smith",
    "contact_info": {
      "email": "john.smith@email.com",
      "phone": "+1 (555) 123-4567",
      "address": "San Francisco, CA"
    },
    "career_summary": "Experienced software engineer with 5+ years in full-stack development."
  }' > /dev/null

echo "  ✓ Basic info saved"

# Education
curl -s -X POST "http://localhost:5003/api/resume/education" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "education": [
      {
        "institution": "Stanford University",
        "degree": "M.S. Computer Science",
        "graduation_year": "2018",
        "gpa": "3.9/4.0"
      }
    ]
  }' > /dev/null

echo "  ✓ Education saved"

# Experience
curl -s -X POST "http://localhost:5003/api/resume/experience" \
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
          "Led team of 5 engineers building microservices",
          "Designed RESTful APIs reducing response time by 40%",
          "Architected cloud infrastructure on GCP"
        ]
      }
    ]
  }' > /dev/null

echo "  ✓ Experience saved"

# Skills
curl -s -X POST "http://localhost:5003/api/resume/skills" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "skills": {
      "technical": ["JavaScript", "Python", "React.js", "Node.js", "AWS", "Docker"],
      "management": ["Team Leadership", "Agile/Scrum"],
      "soft": ["Communication", "Problem Solving"]
    }
  }' > /dev/null

echo "  ✓ Skills saved"
echo "✅ All data saved"
echo ""

# Generate Resume
echo "Step 3: Generating resume (this may take 10-20 seconds)..."
echo ""

# Generate resume (max wait time configured in curl)
RESPONSE=$(curl --max-time 30 -s -X POST "http://localhost:5003/api/resume/generate-fast" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" 2>&1)

CURL_EXIT=$?

if [ $CURL_EXIT -eq 28 ]; then
    echo "❌ Generation timed out after 30 seconds"
    echo ""
    echo "This might be because:"
    echo "  1. LaTeX is not installed or not working properly"
    echo "  2. The server is processing a large file"
    echo "  3. There's a backend error"
    echo ""
    echo "Check backend logs in the terminal where backend is running"
    exit 1
fi

echo "Response received:"
echo "$RESPONSE"
echo ""

# Check if generation was successful
if echo "$RESPONSE" | grep -q '"success".*true'; then
    # Try to extract filename
    FILENAME=$(echo "$RESPONSE" | grep -o '"file":"[^"]*"' | cut -d'"' -f4)
    
    if [ -z "$FILENAME" ]; then
        FILENAME=$(echo "$RESPONSE" | grep -o '"filename":"[^"]*"' | cut -d'"' -f4)
    fi
    
    if [ -n "$FILENAME" ]; then
        echo "✅ Resume generated: $FILENAME"
        echo ""
        echo "Step 4: Downloading resume..."
        
        OUTPUT_FILE="$OUTPUT_DIR/Test_Resume.pdf"
        
        # Download the file
        curl --max-time 10 -s -X GET "http://localhost:5003/api/resume/download?file=$FILENAME" \
          -H "Authorization: Bearer $TOKEN" \
          -o "$OUTPUT_FILE"
        
        if [ -f "$OUTPUT_FILE" ] && [ -s "$OUTPUT_FILE" ]; then
            FILE_SIZE=$(du -h "$OUTPUT_FILE" | cut -f1)
            echo "✅ Downloaded: $OUTPUT_FILE ($FILE_SIZE)"
            echo ""
            echo "======================================"
            echo "✅ SUCCESS!"
            echo "======================================"
            echo ""
            echo "Resume saved to: $OUTPUT_FILE"
            echo ""
            echo "To view the resume:"
            echo "  open '$OUTPUT_FILE'"
            echo ""
        else
            echo "❌ Download failed - file is empty or doesn't exist"
            echo ""
            echo "Try downloading manually:"
            echo "  curl -X GET 'http://localhost:5003/api/resume/download?file=$FILENAME' -o test.pdf"
        fi
    else
        echo "❌ Could not extract filename from response"
        echo "Full response: $RESPONSE"
    fi
else
    echo "❌ Generation failed"
    echo "Response: $RESPONSE"
    echo ""
    echo "Common issues:"
    echo "  1. LaTeX not installed - Install with: brew install --cask mactex-no-gui"
    echo "  2. Backend error - Check logs"
    echo "  3. Invalid data format"
fi
