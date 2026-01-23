#!/bin/bash

# 🎯 Hiero Analysis Backend Test Script
# Usage: bash test-analysis-backend.sh [resume.pdf] [jd.pdf]

BACKEND="https://hiero-analysis-part.onrender.com"

echo "🎯 HIERO ANALYSIS BACKEND TESTER"
echo "================================"
echo ""

# Test 1: Health Check
echo "1️⃣ Health Check..."
HEALTH=$(curl -s "$BACKEND/health")
echo "   Response: $HEALTH"
echo ""

# Test 2: API Health
echo "2️⃣ API Health..."
API_HEALTH=$(curl -s "$BACKEND/api/analysis/health")
echo "   Response: $API_HEALTH"
echo ""

# Test 3: Full Analysis
if [ -n "$1" ] && [ -n "$2" ]; then
  echo "3️⃣ Full Analysis Test..."
  echo "   Resume: $(basename "$1")"
  echo "   JD: $(basename "$2")"
  echo ""
  
  RESPONSE=$(curl -s -X POST "$BACKEND/api/analyze" \
    -F "resume=@$1" \
    -F "jd=@$2")
  
  echo "   Results:"
  echo "$RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$RESPONSE" | sed 's/^/   /'
else
  echo "3️⃣ Full Analysis Test"
  echo "   Usage: bash test-analysis-backend.sh [resume.pdf] [jd.pdf]"
  echo ""
  echo "   Example:"
  echo "   bash test-analysis-backend.sh resume.pdf job_description.pdf"
fi

echo ""
echo "✅ Test Complete!"
