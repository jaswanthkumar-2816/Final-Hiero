#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "🚀 Starting Hiero Resume Builder Backend..."
echo ""

# Navigate to backend directory
cd "/Users/jaswanthkumar/Desktop/shared folder/login system"

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "${YELLOW}📦 Installing dependencies...${NC}"
    npm install
    echo ""
fi

# Check if port 3000 is already in use
if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null ; then
    echo "${RED}⚠️  Port 3000 is already in use${NC}"
    echo "Kill the existing process? (y/n)"
    read -r response
    if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
        PID=$(lsof -t -i:3000)
        kill -9 $PID
        echo "${GREEN}✅ Killed process on port 3000${NC}"
        sleep 1
    else
        echo "${RED}❌ Cannot start server - port 3000 is in use${NC}"
        exit 1
    fi
fi

echo "${GREEN}🔥 Starting backend server...${NC}"
echo ""
echo "Backend will be available at: http://localhost:3000"
echo "Press Ctrl+C to stop the server"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Start the server
npm start
