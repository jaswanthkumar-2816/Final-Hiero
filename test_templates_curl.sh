#!/bin/bash

# Test All Resume Templates with cURL
# This script generates resumes with all available templates and saves them to template_test_output folder

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

# Array of all available templates
TEMPLATES=(
  "professionalcv:Professional_CV"
  "modernsimple:Modern_Simple"
  "awesomecv:Awesome_CV"
  "altacv:AltaCV"
  "deedycv:Deedy_CV"
  "elegant:Elegant"
  "functional:Functional"
)

echo "Step 2: Generating resumes with all templates..."
echo "================================================"
echo ""

# Counter for successful generations
SUCCESS_COUNT=0
TOTAL_COUNT=${#TEMPLATES[@]}

# Loop through each template and generate resume
for TEMPLATE_ENTRY in "${TEMPLATES[@]}"; do
    IFS=':' read -r TEMPLATE_ID TEMPLATE_NAME <<< "$TEMPLATE_ENTRY"
    
    echo "Testing template: $TEMPLATE_NAME ($TEMPLATE_ID)"
    echo "-------------------------------------------"
    
    # Create a temporary JSON file with the request data
    cat > /tmp/resume_request.json <<EOF
{
  "template": "$TEMPLATE_ID",
  "basic": {
    "full_name": "John Smith",
    "contact_info": {
      "email": "john.smith@email.com",
      "phone": "+1 (555) 123-4567",
      "linkedin": "https://linkedin.com/in/john-smith",
      "website": "https://johnsmith.dev",
      "address": "San Francisco, CA, USA"
    },
    "career_objective": "Experienced software engineer with 5+ years of expertise in full-stack development, cloud architecture, and team leadership."
  },
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
      "details": "Dean's List, Summa Cum Laude"
    }
  ],
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
  ],
  "skills": {
    "technical": [
      "JavaScript/TypeScript",
      "Python",
      "Java",
      "React.js",
      "Node.js",
      "Express.js",
      "MongoDB",
      "PostgreSQL",
      "AWS",
      "GCP",
      "Docker",
      "Kubernetes"
    ],
    "management": [
      "Team Leadership",
      "Project Management",
      "Agile/Scrum",
      "Code Review"
    ],
    "soft": [
      "Communication",
      "Problem Solving",
      "Critical Thinking",
      "Collaboration"
    ]
  },
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
  ],
  "certifications": [
    "AWS Certified Solutions Architect - Professional",
    "Google Cloud Professional Developer",
    "Certified Kubernetes Administrator (CKA)"
  ]
}
EOF
    
    # Generate resume with current template
    RESPONSE=$(curl -s -X POST "http://localhost:5003/api/resume/generate-fast" \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $TOKEN" \
      -d @/tmp/resume_request.json)
    
    echo "Response: $RESPONSE"
    
    # Check if generation was successful
    if echo "$RESPONSE" | grep -q "filename"; then
        # Extract filename from response
        FILENAME=$(echo "$RESPONSE" | grep -o '"filename":"[^"]*"' | cut -d'"' -f4)
        
        if [ -n "$FILENAME" ]; then
            # Download the resume
            OUTPUT_FILE="$OUTPUT_DIR/${TEMPLATE_NAME}_Resume.pdf"
            curl -s -X GET "http://localhost:5003/api/resume/download?file=$FILENAME" \
              -H "Authorization: Bearer $TOKEN" \
              -o "$OUTPUT_FILE"
            
            # Check if file was downloaded successfully
            if [ -f "$OUTPUT_FILE" ] && [ -s "$OUTPUT_FILE" ]; then
                FILE_SIZE=$(du -h "$OUTPUT_FILE" | cut -f1)
                echo "✅ Success: $OUTPUT_FILE ($FILE_SIZE)"
                SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
            else
                echo "❌ Failed: Download unsuccessful"
            fi
        else
            echo "❌ Failed: Could not extract filename"
        fi
    else
        echo "❌ Failed: Generation unsuccessful"
    fi
    
    echo ""
    sleep 1  # Small delay between requests
done

# Clean up temp file
rm -f /tmp/resume_request.json

echo "======================================"
echo "Test Summary"
echo "======================================"
echo "Total templates tested: $TOTAL_COUNT"
echo "Successful generations: $SUCCESS_COUNT"
echo "Failed generations: $((TOTAL_COUNT - SUCCESS_COUNT))"
echo ""
echo "Generated resumes are saved in: $OUTPUT_DIR/"
echo ""

# List all generated files
if [ $SUCCESS_COUNT -gt 0 ]; then
    echo "Generated files:"
    ls -lh "$OUTPUT_DIR/" | grep ".pdf" | awk '{print "  - " $9 " (" $5 ")"}'
    echo ""
    echo "✅ Test completed! Check the $OUTPUT_DIR folder for all generated resumes."
    echo ""
    echo "To view the resumes, open the folder:"
    echo "  open $OUTPUT_DIR"
else
    echo "⚠️ No resumes were generated successfully."
    echo "Please check if the backend server is running on http://localhost:5003"
    echo ""
    echo "To start the backend server, run:"
    echo "  cd 'hiero backend' && npm start"
fi
