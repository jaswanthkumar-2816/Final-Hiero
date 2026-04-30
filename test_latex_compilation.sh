#!/bin/bash

# Test a single template with detailed LaTeX output
echo "🔍 Testing LaTeX compilation for Modern Corporate template..."

# Generate JWT token
TOKEN=$(node -e "
const jwt = require('jsonwebtoken');
const payload = { userId: 'latexTestUser', username: 'latex@test.com' };
const token = jwt.sign(payload, 'X7k9P!mQ2aL5vR8', { expiresIn: '1h' });
console.log(token);
")

BASE_URL="http://localhost:5003"

echo "💾 Saving resume data..."

# Save basic info
curl -s -X POST "${BASE_URL}/api/resume/basic" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d '{
        "full_name": "Chaitanya Reddy N",
        "contact_info": {
            "email": "chaitanya.reddy@email.com",
            "phone": "+91 9876543210",
            "address": "Hyderabad, India"
        },
        "career_objective": "Software engineer with full-stack expertise"
    }' > /dev/null

# Save education
curl -s -X POST "${BASE_URL}/api/resume/education" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d '{
        "education": [{
            "institution": "IIT Hyderabad",
            "degree": "B.Tech Computer Science",
            "graduation_year": "2022",
            "gpa": "8.7/10.0"
        }]
    }' > /dev/null

# Save template and generate
echo "🎨 Setting template to modernsimple..."
curl -s -X POST "${BASE_URL}/api/resume/achievements" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d '{
        "achievements": [],
        "template": "modernsimple"
    }' > /dev/null

echo "🚀 Generating resume with LaTeX..."
response=$(curl -s -X POST "${BASE_URL}/api/resume/generate" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN")

echo "📄 Response: $response"

# Extract filename
filename=$(echo "$response" | jq -r '.file // ""')

if [ ! -z "$filename" ] && [ "$filename" != "null" ]; then
    echo "📁 Generated file: $filename"
    
    # Download and check file size
    curl -s -X GET "${BASE_URL}/api/resume/download?file=${filename}" \
        -H "Authorization: Bearer $TOKEN" \
        -o "latex_test_result.pdf"
    
    file_size=$(stat -f%z "latex_test_result.pdf" 2>/dev/null || stat -c%s "latex_test_result.pdf" 2>/dev/null)
    echo "📊 File size: ${file_size} bytes"
    
    if [ $file_size -gt 10000 ]; then
        echo "✅ LaTeX compilation successful (large file size indicates LaTeX, not PDFKit)"
    else
        echo "⚠️  File is small, likely PDFKit fallback was used"
    fi
    
    # Check temp directory for LaTeX artifacts
    echo "🔍 Checking for LaTeX compilation artifacts..."
    ls -la "hiero backend/temp/" | grep -E "\.(tex|log|aux)$" | tail -5
else
    echo "❌ No file generated"
fi
