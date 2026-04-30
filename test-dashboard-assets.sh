#!/bin/bash

echo "🧪 Testing Hiero Dashboard Assets..."
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
PASSED=0
FAILED=0

# Function to test endpoint
test_endpoint() {
    local url=$1
    local name=$2
    
    response=$(curl -s -o /dev/null -w "%{http_code}" "$url" 2>/dev/null)
    
    if [ "$response" = "200" ]; then
        echo -e "${GREEN}✅ PASS${NC} - $name (HTTP $response)"
        ((PASSED++))
    else
        echo -e "${RED}❌ FAIL${NC} - $name (HTTP $response)"
        ((FAILED++))
    fi
}

echo "📡 Testing Server Status..."
echo "─────────────────────────────────────────"

# Check if servers are running
if lsof -i :8082 >/dev/null 2>&1; then
    echo -e "${GREEN}✅${NC} Frontend Server (8082) - Running"
    ((PASSED++))
else
    echo -e "${RED}❌${NC} Frontend Server (8082) - Not Running"
    echo "   Run: ./restart-all-servers.sh"
    ((FAILED++))
fi

if lsof -i :3000 >/dev/null 2>&1; then
    echo -e "${GREEN}✅${NC} Auth Service (3000) - Running"
    ((PASSED++))
else
    echo -e "${RED}❌${NC} Auth Service (3000) - Not Running"
    ((FAILED++))
fi

if lsof -i :2816 >/dev/null 2>&1; then
    echo -e "${GREEN}✅${NC} Gateway (2816) - Running"
    ((PASSED++))
else
    echo -e "${RED}❌${NC} Gateway (2816) - Not Running"
    ((FAILED++))
fi

echo ""
echo "📂 Testing Frontend Direct Access..."
echo "─────────────────────────────────────────"

test_endpoint "http://localhost:8082/" "Dashboard HTML"
test_endpoint "http://localhost:8082/styles.css" "Styles CSS"
test_endpoint "http://localhost:8082/logohiero%20copy.png" "Logo Image"

echo ""
echo "🌐 Testing Gateway Proxy..."
echo "─────────────────────────────────────────"

test_endpoint "http://localhost:2816/dashboard" "Dashboard via Gateway"
test_endpoint "http://localhost:2816/dashboard/styles.css" "Styles via Gateway"
test_endpoint "http://localhost:2816/dashboard/logohiero%20copy.png" "Logo via Gateway"

echo ""
echo "📊 Test Summary:"
echo "─────────────────────────────────────────"
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ All tests passed!${NC}"
    echo ""
    echo "🎉 Your dashboard is ready for mobile testing!"
    echo ""
    echo "Next steps:"
    echo "1. Make sure ngrok is running: ngrok http 2816"
    echo "2. Visit your ngrok URL on mobile"
    echo "3. Click 'Get Started' and login with Google"
    echo "4. You should see the dashboard with logo and styles!"
    echo ""
    exit 0
else
    echo -e "${RED}❌ Some tests failed.${NC}"
    echo ""
    echo "To fix:"
    echo "1. Run: ./restart-all-servers.sh"
    echo "2. Run this test again: ./test-dashboard-assets.sh"
    echo ""
    exit 1
fi
