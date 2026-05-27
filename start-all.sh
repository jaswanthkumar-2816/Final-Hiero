#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Starting Hiero Platform - Unified Gateway${NC}"
echo ""

# Kill any existing processes on our ports
echo -e "${YELLOW}Cleaning up existing processes...${NC}"
lsof -ti:3000 | xargs kill -9 2>/dev/null || true
lsof -ti:5001 | xargs kill -9 2>/dev/null || true
lsof -ti:5003 | xargs kill -9 2>/dev/null || true
lsof -ti:2816 | xargs kill -9 2>/dev/null || true

sleep 2

# Start Login System (Port 3000)
echo -e "${GREEN}✓ Starting Login System on port 3000...${NC}"
cd "login system"
node main.js > ../logs/login.log 2>&1 &
LOGIN_PID=$!
cd ..

sleep 2

# Start Analysis Server (Port 5001)
echo -e "${GREEN}✓ Starting Analysis Server on port 5001...${NC}"
node simple-analysis-server.js > logs/analysis.log 2>&1 &
ANALYSIS_PID=$!

sleep 2

# Start Resume Creation Backend (Port 5003)
echo -e "${GREEN}✓ Starting Resume Creation Backend on port 5003...${NC}"
cd "hiero backend"
node server.js > ../logs/resume.log 2>&1 &
RESUME_PID=$!
cd ..

sleep 3

# Start Unified Gateway (Port 2816)
echo -e "${GREEN}✓ Starting Unified Gateway on port 2816...${NC}"
node gateway.js > logs/gateway.log 2>&1 &
GATEWAY_PID=$!

sleep 2

echo ""
echo -e "${BLUE}================================================${NC}"
echo -e "${GREEN}✅ All services started successfully!${NC}"
echo -e "${BLUE}================================================${NC}"
echo ""
echo -e "📊 Service Status:"
echo -e "  ${GREEN}•${NC} Login System:         http://localhost:3000 (PID: $LOGIN_PID)"
echo -e "  ${GREEN}•${NC} Analysis Server:      http://localhost:5001 (PID: $ANALYSIS_PID)"
echo -e "  ${GREEN}•${NC} Resume Backend:       http://localhost:5003 (PID: $RESUME_PID)"
echo -e "  ${GREEN}•${NC} Unified Gateway:      http://localhost:2816 (PID: $GATEWAY_PID)"
echo ""
echo -e "${BLUE}🌐 Access your application at:${NC}"
echo -e "   ${GREEN}http://localhost:2816${NC}"
echo ""
echo -e "${YELLOW}📝 Logs are available in the logs/ directory${NC}"
echo -e "${YELLOW}⚠️  Press Ctrl+C to stop all services${NC}"
echo ""

# Save PIDs to file for cleanup
echo "$LOGIN_PID $ANALYSIS_PID $RESUME_PID $GATEWAY_PID" > .pids

# Wait for Ctrl+C
trap "echo -e '\n${YELLOW}Stopping all services...${NC}'; kill $LOGIN_PID $ANALYSIS_PID $RESUME_PID $GATEWAY_PID 2>/dev/null; rm -f .pids; echo -e '${GREEN}All services stopped.${NC}'; exit 0" INT

# Keep script running
wait
