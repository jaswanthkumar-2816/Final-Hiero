#!/bin/bash

# 🎨 Resume Builder Template Tester
# This script helps verify that all templates are working correctly

echo "🎨 Resume Builder Template Testing Suite"
echo "========================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if backend is running
echo "🔍 Checking if backend server is running..."
if curl -s http://localhost:5000/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Backend server is running${NC}"
else
    echo -e "${RED}❌ Backend server is not running${NC}"
    echo "Please start the backend server first:"
    echo "  cd 'hiero backend' && npm start"
    exit 1
fi

echo ""
echo "📝 Sample Resume Data"
echo "-------------------"

# Create sample data JSON
SAMPLE_DATA='{
  "template": "classic",
  "personalInfo": {
    "fullName": "Alexandra Chen",
    "email": "alexandra.chen@email.com",
    "phone": "+1 (555) 123-4567",
    "address": "San Francisco, CA 94102",
    "linkedin": "linkedin.com/in/alexandrachen",
    "website": "www.alexandrachen.com"
  },
  "summary": "Results-driven Senior Software Engineer with 8+ years of experience in full-stack development, cloud architecture, and team leadership. Proven track record of delivering scalable solutions that improve system performance by 40% and reduce operational costs.",
  "technicalSkills": "JavaScript (ES6+), TypeScript, React.js, Node.js, Python, Django, AWS (EC2, S3, Lambda), Docker, Kubernetes, PostgreSQL, MongoDB, Redis, Git, CI/CD",
  "softSkills": "Team Leadership, Agile/Scrum Methodologies, Cross-functional Collaboration, Problem-solving, Technical Documentation, Code Review, Mentoring",
  "experience": [
    {
      "jobTitle": "Senior Software Engineer",
      "company": "TechCorp Solutions",
      "startDate": "2021-03",
      "endDate": "",
      "description": "• Lead development team of 6 engineers in building cloud-native applications serving 2M+ users\n• Architected and implemented microservices infrastructure using AWS, reducing system downtime by 45%"
    },
    {
      "jobTitle": "Software Engineer II",
      "company": "Digital Innovations Inc.",
      "startDate": "2019-01",
      "endDate": "2021-02",
      "description": "• Developed and maintained RESTful APIs handling 5M+ daily requests with 99.9% uptime\n• Optimized database queries and implemented caching strategies, improving response time by 60%"
    }
  ],
  "education": [
    {
      "degree": "Master of Science in Computer Science",
      "school": "Stanford University",
      "gradYear": "2016",
      "gpa": "3.9/4.0"
    },
    {
      "degree": "Bachelor of Science in Software Engineering",
      "school": "University of California, Berkeley",
      "gradYear": "2014",
      "gpa": "3.7/4.0"
    }
  ],
  "certifications": "AWS Certified Solutions Architect - Professional (2023)\nCertified Kubernetes Administrator (CKA) (2022)",
  "languages": "English (Native), Mandarin Chinese (Fluent), Spanish (Conversational)",
  "projects": "E-Commerce Platform Modernization: Led migration of legacy monolithic application to microservices architecture\nReal-time Analytics Dashboard: Built comprehensive analytics platform processing 10M+ events daily",
  "achievements": "Employee of the Year 2022 - Recognized for exceptional technical leadership\nPatent Pending: Innovative caching algorithm that reduces API latency by 35%"
}'

# Templates to test
TEMPLATES=(
  "classic:Classic Professional"
  "minimal:Minimal"
  "modern-pro:Modern Professional"
  "tech-focus:Tech Focus"
  "ats-optimized:ATS Optimized"
  "creative-bold:Creative Bold"
  "portfolio-style:Portfolio Style"
  "corporate-ats:Corporate ATS"
  "elegant-gradient:Elegant Gradient"
  "minimalist-mono:Minimalist Mono"
)

echo "Testing ${#TEMPLATES[@]} templates..."
echo ""

PASSED=0
FAILED=0
RESULTS_DIR="test_results_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$RESULTS_DIR"

# Test each template
for template_info in "${TEMPLATES[@]}"; do
    IFS=':' read -r template_id template_name <<< "$template_info"
    
    echo -e "${BLUE}🧪 Testing: ${template_name}${NC}"
    echo "   Template ID: ${template_id}"
    
    # Update template in JSON data
    TEST_DATA=$(echo "$SAMPLE_DATA" | jq --arg tmpl "$template_id" '.template = $tmpl')
    
    # Test generation endpoint
    echo -n "   ├─ Testing generation... "
    RESPONSE=$(curl -s -o "$RESULTS_DIR/${template_id}_test.pdf" -w "%{http_code}" \
        -X POST http://localhost:5000/generate-resume \
        -H "Content-Type: application/json" \
        -d "$TEST_DATA" 2>&1)
    
    if [ "$RESPONSE" = "200" ]; then
        echo -e "${GREEN}✓ Success${NC}"
        
        # Check if PDF was created and has content
        if [ -f "$RESULTS_DIR/${template_id}_test.pdf" ] && [ -s "$RESULTS_DIR/${template_id}_test.pdf" ]; then
            FILE_SIZE=$(stat -f%z "$RESULTS_DIR/${template_id}_test.pdf" 2>/dev/null || stat -c%s "$RESULTS_DIR/${template_id}_test.pdf" 2>/dev/null)
            echo "   ├─ PDF Size: ${FILE_SIZE} bytes"
            
            if [ "$FILE_SIZE" -gt 5000 ]; then
                echo -e "   └─ ${GREEN}✅ PASSED${NC}"
                PASSED=$((PASSED + 1))
            else
                echo -e "   └─ ${YELLOW}⚠️  WARNING: PDF seems too small${NC}"
                FAILED=$((FAILED + 1))
            fi
        else
            echo -e "   └─ ${RED}❌ FAILED: PDF not created${NC}"
            FAILED=$((FAILED + 1))
        fi
    else
        echo -e "${RED}✗ Failed (HTTP $RESPONSE)${NC}"
        echo -e "   └─ ${RED}❌ FAILED${NC}"
        FAILED=$((FAILED + 1))
    fi
    
    echo ""
    sleep 0.5  # Brief pause between tests
done

# Summary
echo "========================================"
echo "📊 Test Summary"
echo "========================================"
echo -e "Total Templates: ${BLUE}${#TEMPLATES[@]}${NC}"
echo -e "Passed: ${GREEN}${PASSED}${NC}"
echo -e "Failed: ${RED}${FAILED}${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 All templates passed!${NC}"
    echo ""
    echo "✅ Generated PDFs saved to: $RESULTS_DIR/"
    echo ""
    echo "Next steps:"
    echo "  1. Open the PDFs to visually verify formatting"
    echo "  2. Check that all sections appear correctly"
    echo "  3. Verify text isn't cut off or overlapping"
    exit 0
else
    echo -e "${RED}⚠️  Some templates failed${NC}"
    echo ""
    echo "Failed templates need investigation."
    echo "Check the backend logs for error details."
    exit 1
fi
