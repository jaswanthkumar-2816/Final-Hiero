#!/bin/bash

echo "🚀 Quick Resume Generation for Chaitanya Reddy N"

# Generate token
echo "🔑 Generating token..."
TOKEN=$(node generate_token.js)

if [ -z "$TOKEN" ]; then
    echo "❌ Failed to generate token"
    exit 1
fi

echo "✅ Token generated successfully"

# Generate resume with minimal data
echo "📄 Generating resume..."
RESPONSE=$(curl -s -X POST "http://localhost:5003/api/resume/generate-fast" \
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
      "career_objective": "Software engineer with expertise in full-stack development and cloud technologies."
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
          "API integration and third-party services",
          "Performance optimization and code review"
        ]
      }
    ],
    "skills": {
      "technical": ["JavaScript", "Python", "React.js", "Node.js", "AWS", "MongoDB"],
      "soft": ["Communication", "Leadership", "Problem Solving", "Team Collaboration"]
    }
  }')

echo "$RESPONSE" | jq '.'

# Extract filename
FILENAME=$(echo "$RESPONSE" | jq -r '.file // empty')

if [ ! -z "$FILENAME" ] && [ "$FILENAME" != "null" ]; then
    echo ""
    echo "📥 Downloading resume..."
    curl -X GET "http://localhost:5003/api/resume/download?file=${FILENAME}" \
      -H "Authorization: Bearer $TOKEN" \
      -o "Chaitanya_Quick_Resume.pdf"
    
    if [ $? -eq 0 ]; then
        echo "✅ Resume downloaded as 'Chaitanya_Quick_Resume.pdf'"
        echo "📁 File size: $(ls -lh Chaitanya_Quick_Resume.pdf | awk '{print $5}')"
    else
        echo "❌ Failed to download resume"
    fi
else
    echo "❌ Failed to generate resume"
fi
