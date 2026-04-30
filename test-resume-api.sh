#!/bin/bash

# 🎯 Quick Test Script for Resume Builder API
# Usage: bash test-resume-api.sh

BACKEND_URL="http://localhost:5003"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  🧪 Testing Resume Builder API"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Test data
TEST_DATA='{
  "template": "modern",
  "personalInfo": {
    "fullName": "John Doe",
    "email": "john.doe@example.com",
    "phone": "+1-234-567-8900",
    "address": "123 Tech Street, San Francisco, CA",
    "linkedin": "linkedin.com/in/johndoe",
    "website": "johndoe.com"
  },
  "experience": [
    {
      "jobTitle": "Senior Software Engineer",
      "company": "Tech Corp",
      "startDate": "Jan 2020",
      "endDate": "Present",
      "description": "Led development of microservices architecture"
    }
  ],
  "education": [
    {
      "degree": "BS Computer Science",
      "school": "University of Technology",
      "graduationDate": "2019"
    }
  ],
  "skills": "JavaScript, Python, React, Node.js, AWS",
  "summary": "Experienced software engineer with 5+ years in full-stack development"
}'

echo "1️⃣  Testing /generate-resume endpoint..."
echo "   URL: $BACKEND_URL/generate-resume"
echo ""

RESPONSE=$(curl -s -X POST "$BACKEND_URL/generate-resume" \
  -H "Content-Type: application/json" \
  -d "$TEST_DATA")

if echo "$RESPONSE" | grep -q "success"; then
  echo "   ✅ Generate endpoint works!"
  echo "   Response: $RESPONSE"
else
  echo "   ❌ Generate endpoint failed"
  echo "   Response: $RESPONSE"
  echo ""
  echo "   💡 Make sure backend is running: cd 'hiero backend' && npm start"
  exit 1
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "2️⃣  Testing /download-resume endpoint..."
echo "   URL: $BACKEND_URL/download-resume"
echo ""

OUTPUT_FILE="test_john_doe_resume.pdf"

HTTP_CODE=$(curl -s -w "%{http_code}" -X POST "$BACKEND_URL/download-resume" \
  -H "Content-Type: application/json" \
  -d "$TEST_DATA" \
  -o "$OUTPUT_FILE")

if [ "$HTTP_CODE" = "200" ] && [ -f "$OUTPUT_FILE" ]; then
  FILE_SIZE=$(wc -c < "$OUTPUT_FILE")
  if [ "$FILE_SIZE" -gt 1000 ]; then
    echo "   ✅ Download endpoint works!"
    echo "   PDF created: $OUTPUT_FILE"
    echo "   File size: $FILE_SIZE bytes"
    echo ""
    echo "   📥 Opening PDF in default viewer..."
    if [[ "$OSTYPE" == "darwin"* ]]; then
      open "$OUTPUT_FILE"
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
      xdg-open "$OUTPUT_FILE"
    fi
  else
    echo "   ❌ PDF file too small (might be error response)"
    echo "   File size: $FILE_SIZE bytes"
    cat "$OUTPUT_FILE"
    rm "$OUTPUT_FILE"
    exit 1
  fi
else
  echo "   ❌ Download endpoint failed"
  echo "   HTTP Code: $HTTP_CODE"
  if [ -f "$OUTPUT_FILE" ]; then
    echo "   Response:"
    cat "$OUTPUT_FILE"
    rm "$OUTPUT_FILE"
  fi
  exit 1
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "  ✅ All tests passed!"
echo "  🎉 Your API is working correctly!"
echo ""
echo "  📄 Test PDF: $OUTPUT_FILE"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
