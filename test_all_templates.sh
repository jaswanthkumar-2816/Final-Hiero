#!/bin/bash

# Test all resume templates for Chaitanya Reddy N
echo "🧪 Testing all resume templates for Chaitanya Reddy N..."

# Generate JWT token
echo "🔑 Generating JWT token..."
TOKEN=$(node -e "
const jwt = require('jsonwebtoken');
const payload = { userId: 'chaitanyaTestUser', username: 'test@email.com' };
const token = jwt.sign(payload, 'X7k9P!mQ2aL5vR8', { expiresIn: '1h' });
console.log(token);
")

if [ -z "$TOKEN" ]; then
    echo "❌ Failed to generate token"
    exit 1
fi

echo "✅ Token generated successfully"

# Sample resume data
RESUME_DATA='{
  "basic": {
    "full_name": "Chaitanya Reddy N",
    "contact_info": {
      "email": "chaitanya.reddy@email.com",
      "phone": "+91 9876543210",
      "linkedin": "https://linkedin.com/in/chaitanya-reddy-n",
      "website": "https://chaitanya-portfolio.com",
      "address": "Hyderabad, Telangana, India"
    },
    "career_objective": "Dynamic software engineer with expertise in full-stack development and cloud technologies."
  },
  "education": [
    {
      "institution": "Indian Institute of Technology (IIT) Hyderabad",
      "degree": "Bachelor of Technology in Computer Science",
      "graduation_year": "2022",
      "gpa": "8.7/10.0",
      "details": "Specialized in Software Engineering and Data Structures"
    }
  ],
  "experience": [
    {
      "company": "Tech Mahindra",
      "position": "Software Engineer",
      "duration": "2022 - Present",
      "location": "Hyderabad, India",
      "responsibilities": [
        "Developed and maintained web applications using React.js and Node.js",
        "Implemented RESTful APIs and integrated third-party services",
        "Optimized application performance resulting in 30% faster load times"
      ]
    }
  ],
  "projects": [
    {
      "name": "E-Learning Platform",
      "description": "Full-stack web application for online learning",
      "technologies": "React, Node.js, MongoDB, AWS",
      "year": "2023"
    }
  ],
  "skills": {
    "technical": [
      "JavaScript", "Python", "React.js", "Node.js", "AWS", "MongoDB"
    ],
    "soft": [
      "Communication", "Leadership", "Problem Solving"
    ]
  },
  "achievements": [
    {
      "title": "Best Project Award",
      "description": "Outstanding final year project",
      "year": "2022",
      "organization": "IIT Hyderabad"
    }
  ]
}'

# Base URL
BASE_URL="http://localhost:5003"

# Array of templates to test
declare -a templates=("professionalcv" "modernsimple" "awesomecv" "altacv" "deedycv" "elegant" "functional")
declare -a template_names=("Classic Professional" "Modern Corporate" "Creative Design" "ATS-Friendly" "Student/Fresher" "Executive/Managerial" "Functional (Skills-Based)")

# Create results directory
mkdir -p template_test_results
rm -f template_test_results/*

echo ""
echo "📋 Testing each template..."
echo "=========================="

success_count=0
fail_count=0

for i in "${!templates[@]}"; do
    template_id="${templates[$i]}"
    template_name="${template_names[$i]}"
    
    echo ""
    echo "🔄 Testing template $((i+1))/7: $template_name ($template_id)"
    
    # Use a unique userId for this test
    test_user_id="templateTest${i}"
    test_token=$(node -e "
    const jwt = require('jsonwebtoken');
    const payload = { userId: '${test_user_id}', username: 'test${i}@email.com' };
    const token = jwt.sign(payload, 'X7k9P!mQ2aL5vR8', { expiresIn: '1h' });
    console.log(token);
    ")
    
    # Step 1: Save basic info
    curl -s -X POST "${BASE_URL}/api/resume/basic" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $test_token" \
        -d "$(echo "$RESUME_DATA" | jq '.basic')" > /dev/null
    
    # Step 2: Save education
    curl -s -X POST "${BASE_URL}/api/resume/education" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $test_token" \
        -d "$(echo "$RESUME_DATA" | jq '{education: .education}')" > /dev/null
    
    # Step 3: Save experience
    curl -s -X POST "${BASE_URL}/api/resume/experience" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $test_token" \
        -d "$(echo "$RESUME_DATA" | jq '{experience: .experience}')" > /dev/null
    
    # Step 4: Save projects
    curl -s -X POST "${BASE_URL}/api/resume/projects" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $test_token" \
        -d "$(echo "$RESUME_DATA" | jq '{projects: .projects}')" > /dev/null
    
    # Step 5: Save skills
    curl -s -X POST "${BASE_URL}/api/resume/skills" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $test_token" \
        -d "$(echo "$RESUME_DATA" | jq '{skills: .skills}')" > /dev/null
    
    # Step 6: Save achievements and template
    curl -s -X POST "${BASE_URL}/api/resume/achievements" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $test_token" \
        -d "$(echo "$RESUME_DATA" | jq --arg template "$template_id" '{achievements: .achievements, template: $template}')" > /dev/null
    
    # Step 7: Generate resume
    response=$(curl -s -X POST "${BASE_URL}/api/resume/generate-fast" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $test_token")
    
    # Check if generation was successful
    success=$(echo "$response" | jq -r '.success // false')
    filename=$(echo "$response" | jq -r '.file // ""')
    error=$(echo "$response" | jq -r '.error // ""')
    
    if [ "$success" = "true" ] && [ ! -z "$filename" ]; then
        echo "  ✅ Generation successful: $filename"
        
        # Download the file
        download_name="template_test_results/Chaitanya_${template_id}.pdf"
        curl -s -X GET "${BASE_URL}/api/resume/download?file=${filename}" \
            -H "Authorization: Bearer $test_token" \
            -o "$download_name"
        
        if [ -f "$download_name" ]; then
            file_size=$(stat -f%z "$download_name" 2>/dev/null || stat -c%s "$download_name" 2>/dev/null)
            echo "  📁 Downloaded: $download_name (${file_size} bytes)"
            success_count=$((success_count + 1))
        else
            echo "  ❌ Download failed"
            fail_count=$((fail_count + 1))
        fi
    else
        echo "  ❌ Generation failed: $error"
        echo "  📄 Response: $response"
        fail_count=$((fail_count + 1))
    fi
done

echo ""
echo "📊 Test Results Summary"
echo "======================"
echo "✅ Successful: $success_count/7 templates"
echo "❌ Failed: $fail_count/7 templates"

if [ $success_count -eq 7 ]; then
    echo "🎉 All templates are working perfectly!"
else
    echo "⚠️  Some templates had issues"
fi

echo ""
echo "📁 Generated files are in: template_test_results/"
ls -la template_test_results/ 2>/dev/null || echo "No files generated"

echo ""
echo "🔗 You can view the templates at:"
echo "   file://$(pwd)/template_test_results/"
