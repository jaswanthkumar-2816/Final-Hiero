#!/bin/bash

# Test Resume Import API
# This script tests the /api/resume/import endpoint

echo "🧪 Testing Resume Import API..."
echo "================================"
echo ""

# Check if a test PDF exists
if [ ! -f "test_resume.pdf" ]; then
  echo "⚠️  No test_resume.pdf found. Creating a sample text resume..."
  
  # Create a simple text resume for testing
  cat > test_resume.txt << 'EOF'
John Doe
john.doe@email.com | (555) 123-4567 | linkedin.com/in/johndoe
San Francisco, CA

PROFESSIONAL SUMMARY
Experienced software engineer with 5+ years in full-stack development.

WORK EXPERIENCE
Senior Software Engineer
Tech Company Inc.
2020-01 - Present
• Led development of microservices architecture
• Improved system performance by 40%
• Mentored junior developers

EDUCATION
Bachelor of Science in Computer Science
University of California
2018
GPA: 3.8

TECHNICAL SKILLS
JavaScript, Python, React, Node.js, Docker, AWS

CERTIFICATIONS
AWS Certified Solutions Architect
Google Cloud Professional

LANGUAGES
English (Native), Spanish (Intermediate)

REFERENCES
Jane Smith
Senior Manager
Tech Company Inc.
jane.smith@techcompany.com
(555) 987-6543
EOF

  echo "✅ Created test_resume.txt"
  TEST_FILE="test_resume.txt"
else
  TEST_FILE="test_resume.pdf"
  echo "✅ Using existing test_resume.pdf"
fi

echo ""
echo "📤 Sending request to http://localhost:5003/api/resume/import"
echo ""

# Send the request
curl -X POST \
  http://localhost:5003/api/resume/import \
  -F "resume=@${TEST_FILE}" \
  -w "\n\n📊 HTTP Status: %{http_code}\n" \
  2>/dev/null | jq '.' 2>/dev/null || cat

echo ""
echo "================================"
echo "✅ Test complete!"
