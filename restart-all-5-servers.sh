#!/bin/bash

echo "🔄 Restarting ALL Hiero servers (including Analysis & Resume APIs)..."
echo ""

# Base directory
BASE_DIR="/Users/jaswanthkumar/Desktop/shared folder"

# Kill existing processes
echo "🛑 Stopping existing servers..."
killall -9 node 2>/dev/null
sleep 2

# Start Resume & Analysis Server (Port 5003 - Unified)
echo "📄 Starting Resume & Analysis Server (Port 5003)..."
cd "$BASE_DIR/hiero backend"
nohup node server.js > resume.log 2>&1 &
RESUME_PID=$!
sleep 2

# Start Frontend Server (Port 8082)
echo "📱 Starting Frontend Server (Port 8082)..."
cd "$BASE_DIR/hiero last prtotype/jss/hiero/hiero last"
nohup node frontend-server.js > frontend.log 2>&1 &
FRONTEND_PID=$!
sleep 2

# Start Auth Service (Port 3000)  
echo "🔐 Starting Auth Service (Port 3000)..."
cd "$BASE_DIR/login system"
nohup node main.js > auth.log 2>&1 &
AUTH_PID=$!
sleep 2

# Start Gateway (Port 2816)
echo "🌐 Starting Gateway (Port 2816)..."
cd "$BASE_DIR/hiero last prtotype/jss/hiero/hiero last"
nohup node gateway.js > gateway.log 2>&1 &
GATEWAY_PID=$!
sleep 3

echo ""
echo "✅ All servers started!"
echo ""
echo "📊 Server Status:"
echo "═════════════════════════════════════════"

# Check if servers are running
RESUME_RUNNING=false
FRONTEND_RUNNING=false
AUTH_RUNNING=false
GATEWAY_RUNNING=false

if lsof -i :5003 >/dev/null 2>&1; then
    echo "✅ Resume & Analysis API (5003) - Running (PID: $RESUME_PID)"
    RESUME_RUNNING=true
else
    echo "❌ Resume & Analysis API (5003) - Failed to start"
    echo "   Check: $BASE_DIR/hiero backend/resume.log"
fi

if lsof -i :8082 >/dev/null 2>&1; then
    echo "✅ Frontend UI (8082) - Running (PID: $FRONTEND_PID)"
    FRONTEND_RUNNING=true
else
    echo "❌ Frontend UI (8082) - Failed to start"
    echo "   Check: $BASE_DIR/hiero last prtotype/jss/hiero/hiero last/frontend.log"
fi

if lsof -i :3000 >/dev/null 2>&1; then
    echo "✅ Auth Service (3000) - Running (PID: $AUTH_PID)"
    AUTH_RUNNING=true
else
    echo "❌ Auth Service (3000) - Failed to start"
    echo "   Check: $BASE_DIR/login system/auth.log"
fi

if lsof -i :2816 >/dev/null 2>&1; then
    echo "✅ Gateway (2816) - Running (PID: $GATEWAY_PID)"
    GATEWAY_RUNNING=true
else
    echo "❌ Gateway (2816) - Failed to start"
    echo "   Check: $BASE_DIR/hiero last prtotype/jss/hiero/hiero last/gateway.log"
fi

echo "═════════════════════════════════════════"
echo ""

# Only show access info if all servers are running
if [ "$RESUME_RUNNING" = true ] && [ "$FRONTEND_RUNNING" = true ] && [ "$AUTH_RUNNING" = true ] && [ "$GATEWAY_RUNNING" = true ]; then
    echo "🎉 All servers are running!"
    echo ""
    echo "🌍 Access Points:"
    echo "   Local:  http://localhost:2816"
    echo "   Mobile: Your ngrok URL"
    echo ""
    echo "🔌 API Endpoints (via Gateway):"
    echo "   Analysis & Resume: /api/* (via :5003)"
    echo "   Auth:      /auth/*"
    echo "   Dashboard: /dashboard"
    echo ""
else
    echo "⚠️  Some servers failed to start. Check the logs above."
    echo ""
fi

echo "📝 View Logs:"
echo "   Analysis: tail -f \"$BASE_DIR/hiero backend/hiero analysis part/analysis.log\""
echo "   Resume:   tail -f \"$BASE_DIR/hiero backend/resume.log\""
echo "   Frontend: tail -f \"$BASE_DIR/hiero last prtotype/jss/hiero/hiero last/frontend.log\""
echo "   Auth:     tail -f \"$BASE_DIR/login system/auth.log\""
echo "   Gateway:  tail -f \"$BASE_DIR/hiero last prtotype/jss/hiero/hiero last/gateway.log\""
echo ""
echo "🛑 Stop All: killall -9 node"
echo ""
