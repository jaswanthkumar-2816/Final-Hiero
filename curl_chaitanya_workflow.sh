#!/bin/bash

# Complete cURL workflow to generate resume for Chaitanya Reddy N
# This script follows the proper backend flow: save data first, then generate

echo "🚀 Starting complete resume generation workflow for Chaitanya Reddy N..."

# Generate JWT token first
echo "🔑 Generating JWT token..."
TOKEN=$(node -e "
const jwt = require('jsonwebtoken');
const payload = { userId: 'chaitanyaUser123', username: 'chaitanya.reddy@email.com' };
const token = jwt.sign(payload, 'X7k9P!mQ2aL5vR8', { expiresIn: '1h' });
console.log(token);
")

if [ -z "$TOKEN" ]; then
    echo "❌ Failed to generate token"
    exit 1
fi

echo "✅ Token generated: ${TOKEN:0:50}..."

# Base URL
BASE_URL="http://localhost:5003"

echo "📋 Step 1: Saving basic information..."
curl -X POST "${BASE_URL}/api/resume/basic" \
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
    "career_summary": "Dynamic software engineer with expertise in full-stack development and cloud technologies. Passionate about building scalable applications and contributing to innovative software solutions that drive business growth and user satisfaction."
  }' | jq '.'

echo ""
echo "🎓 Step 2: Saving education information..."
curl -X POST "${BASE_URL}/api/resume/education" \
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
  }' | jq '.'

echo ""
echo "💼 Step 3: Saving experience information..."
curl -X POST "${BASE_URL}/api/resume/experience" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "experience": [
      {
        "company": "Tech Mahindra",
        "position": "Software Engineer",
        "duration": "2022 - Present",
        "location": "Hyderabad, India",
        "responsibilities": [
          "Developed and maintained web applications using React.js and Node.js",
          "Implemented RESTful APIs and integrated third-party services",
          "Collaborated with cross-functional teams in agile development environment",
          "Optimized application performance resulting in 30% faster load times"
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
          "Assisted in database design and query optimization",
          "Contributed to documentation and testing procedures"
        ]
      }
    ]
  }' | jq '.'

echo ""
echo "🚀 Step 4: Saving projects information..."
curl -X POST "${BASE_URL}/api/resume/projects" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "projects": [
      {
        "name": "E-Learning Platform",
        "description": "Full-stack web application for online learning with video streaming and progress tracking",
        "duration": "4 months",
        "year": "2023",
        "technologies": "React, Node.js, MongoDB, AWS S3, Socket.io",
        "link": "https://github.com/chaitanya/elearning-platform"
      },
      {
        "name": "Smart Attendance System",
        "description": "AI-powered attendance tracking system using facial recognition and real-time analytics",
        "duration": "3 months",
        "year": "2022",
        "technologies": "Python, OpenCV, Flask, PostgreSQL, Docker",
        "link": "https://github.com/chaitanya/smart-attendance"
      }
    ]
  }' | jq '.'

echo ""
echo "🛠️ Step 5: Saving skills information..."
curl -X POST "${BASE_URL}/api/resume/skills" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "skills": {
      "technical": [
        "JavaScript", "Python", "Java", "React.js", "Node.js", "Express.js",
        "MongoDB", "PostgreSQL", "MySQL", "AWS", "Docker", "Git",
        "HTML/CSS", "Bootstrap", "REST APIs", "GraphQL", "Redis", "Linux"
      ],
      "management": [
        "Team Collaboration", "Project Management", "Agile/Scrum", 
        "Problem Solving", "Code Review", "Technical Documentation"
      ],
      "soft": [
        "Communication", "Leadership", "Critical Thinking", "Adaptability",
        "Time Management", "Continuous Learning", "Attention to Detail"
      ]
    }
  }' | jq '.'

echo ""
echo "🏆 Step 6: Saving achievements and template selection..."
curl -X POST "${BASE_URL}/api/resume/achievements" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "achievements": [
      {
        "title": "Best Project Award",
        "description": "Recognized for outstanding final year project on Smart Attendance System",
        "year": "2022",
        "organization": "IIT Hyderabad"
      },
      {
        "title": "Hackathon Winner",
        "description": "First place in Tech Mahindra Internal Hackathon for innovative web solution",
        "year": "2023",
        "organization": "Tech Mahindra"
      }
    ],
    "template": "modernsimple"
  }' | jq '.'

echo ""
echo "📄 Step 7: Generating resume PDF..."
GENERATE_RESPONSE=$(curl -s -X POST "${BASE_URL}/api/resume/generate-fast" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN")

echo "$GENERATE_RESPONSE" | jq '.'

# Extract filename from response
FILENAME=$(echo "$GENERATE_RESPONSE" | jq -r '.file // empty')

if [ ! -z "$FILENAME" ] && [ "$FILENAME" != "null" ]; then
    echo ""
    echo "📥 Step 8: Downloading generated resume..."
    curl -X GET "${BASE_URL}/api/resume/download?file=${FILENAME}" \
      -H "Authorization: Bearer $TOKEN" \
      -o "/Users/jaswanthkumar/Desktop/shared folder/Chaitanya_Reddy_N_Resume.pdf"
    
    if [ $? -eq 0 ]; then
        echo "✅ Resume downloaded successfully as 'Chaitanya_Reddy_N_Resume.pdf'"
        echo "📁 File location: /Users/jaswanthkumar/Desktop/shared folder/Chaitanya_Reddy_N_Resume.pdf"
        echo ""
        echo "🎉 Complete workflow finished successfully!"
        echo "👤 Resume generated for: Chaitanya Reddy N"
        echo "💼 Position: Software Engineer at Tech Mahindra"
        echo "🎓 Education: B.Tech CSE from IIT Hyderabad"
        echo "📧 Contact: chaitanya.reddy@email.com"
    else
        echo "❌ Failed to download resume"
    fi
else
    echo "❌ Failed to generate resume - no filename received"
fi
