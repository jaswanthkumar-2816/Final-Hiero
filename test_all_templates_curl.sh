#!/bin/bash

echo "🎯 Testing all templates for Chaitanya Reddy N"

# Generate token
TOKEN=$(node generate_token.js)

# Template list
TEMPLATES=("professionalcv" "modernsimple" "awesomecv" "altacv" "deedycv" "elegant" "functional")

# Basic resume data
RESUME_DATA='{
  "basic": {
    "full_name": "Chaitanya Reddy N",
    "contact_info": {
      "email": "chaitanya.reddy@email.com",
      "phone": "+91 9876543210",
      "address": "Hyderabad, India"
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
      "duration": "2022-Present",
      "responsibilities": ["React.js development", "API integration"]
    }
  ],
  "skills": {
    "technical": ["JavaScript", "Python", "React.js", "Node.js", "AWS"]
  }
}'

for template in "${TEMPLATES[@]}"; do
    echo "📄 Testing template: $template"
    
    RESPONSE=$(curl -s -X POST "http://localhost:5003/api/resume/generate-fast" \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $TOKEN" \
      -d "{\"template\":\"$template\",$RESUME_DATA}")
    
    SUCCESS=$(echo "$RESPONSE" | jq -r '.success')
    
    if [ "$SUCCESS" = "true" ]; then
        FILENAME=$(echo "$RESPONSE" | jq -r '.file')
        echo "  ✅ Generated: $FILENAME"
    else
        echo "  ❌ Failed: $(echo "$RESPONSE" | jq -r '.error')"
    fi
    
    sleep 1
done

echo "🎉 Template testing completed!"
