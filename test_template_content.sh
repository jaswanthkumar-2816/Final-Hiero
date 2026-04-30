#!/bin/bash

echo "🔍 Testing template content generation for Chaitanya Reddy N"
echo "This will show what content is generated for each template"

# Generate token
TOKEN=$(node generate_token.js)

# Sample data
SAMPLE_DATA='{
  "basic": {
    "full_name": "Chaitanya Reddy N",
    "contact_info": {
      "email": "chaitanya.reddy@email.com",
      "phone": "+91 9876543210",
      "address": "Hyderabad, India"
    },
    "career_summary": "Software engineer with expertise in full-stack development and cloud technologies."
  },
  "education": [
    {
      "institution": "Indian Institute of Technology (IIT) Hyderabad",
      "degree": "Bachelor of Technology in Computer Science",
      "graduation_year": "2022",
      "gpa": "8.7/10.0"
    }
  ],
  "experience": [
    {
      "company": "Tech Mahindra",
      "position": "Software Engineer",
      "duration": "2022 - Present",
      "responsibilities": ["React.js development", "API integration"]
    }
  ],
  "skills": {
    "technical": ["JavaScript", "Python", "React.js", "Node.js", "AWS"],
    "soft": ["Communication", "Leadership", "Problem Solving"]
  },
  "projects": [
    {
      "name": "E-Learning Platform",
      "year": "2023",
      "description": "Full-stack web application for online learning"
    }
  ],
  "certifications": [
    {
      "name": "AWS Certified Developer",
      "issuer": "Amazon",
      "year": "2023"
    }
  ]
}'

# Templates to test
TEMPLATES=("professionalcv" "modernsimple" "awesomecv" "altacv" "deedycv" "elegant" "functional")

# Save the data first
echo "💾 Saving resume data..."
curl -s -X POST "http://localhost:5003/api/resume/basic" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "$(echo "$SAMPLE_DATA" | jq '.basic')" > /dev/null

curl -s -X POST "http://localhost:5003/api/resume/education" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "$(echo "$SAMPLE_DATA" | jq '{education: .education}')" > /dev/null

curl -s -X POST "http://localhost:5003/api/resume/experience" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "$(echo "$SAMPLE_DATA" | jq '{experience: .experience}')" > /dev/null

curl -s -X POST "http://localhost:5003/api/resume/skills" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "$(echo "$SAMPLE_DATA" | jq '{skills: .skills}')" > /dev/null

curl -s -X POST "http://localhost:5003/api/resume/projects" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "$(echo "$SAMPLE_DATA" | jq '{projects: .projects}')" > /dev/null

curl -s -X POST "http://localhost:5003/api/resume/certifications" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "$(echo "$SAMPLE_DATA" | jq '{certifications: .certifications}')" > /dev/null

# Set template and test each one
for template in "${TEMPLATES[@]}"; do
    echo ""
    echo "📄 Testing template: $template"
    echo "────────────────────────────────────────────"
    
    # Set template
    curl -s -X POST "http://localhost:5003/api/resume/template" \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $TOKEN" \
      -d "{\"template\":\"$template\"}" > /dev/null
    
    # Generate resume
    RESPONSE=$(curl -s -X POST "http://localhost:5003/api/resume/generate-fast" \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $TOKEN")
    
    SUCCESS=$(echo "$RESPONSE" | jq -r '.success')
    
    if [ "$SUCCESS" = "true" ]; then
        FILENAME=$(echo "$RESPONSE" | jq -r '.file')
        FILESIZE=$(ls -lh "hiero backend/temp/$FILENAME" 2>/dev/null | awk '{print $5}' || echo "Unknown")
        echo "  ✅ Generated: $FILENAME (Size: $FILESIZE)"
        
        # Check if there's a corresponding .tex file to see the generated LaTeX
        TEX_FILE=$(echo "$FILENAME" | sed 's/\.pdf$/.tex/')
        if [ -f "hiero backend/temp/$TEX_FILE" ]; then
            echo "  📝 LaTeX source found: $TEX_FILE"
            echo "  📋 Content preview (first 10 lines):"
            head -10 "hiero backend/temp/$TEX_FILE" | sed 's/^/      /'
        else
            echo "  ⚠️  No LaTeX source found (likely using PDFKit fallback)"
        fi
    else
        ERROR=$(echo "$RESPONSE" | jq -r '.error // "Unknown error"')
        echo "  ❌ Failed: $ERROR"
    fi
    
    sleep 1
done

echo ""
echo "🎉 Template content testing completed!"
echo ""
echo "📁 Generated files in hiero backend/temp/:"
ls -la "hiero backend/temp/"*.pdf 2>/dev/null | tail -5
