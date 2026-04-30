#!/bin/bash

echo "🔄 Restarting all Hiero servers..."
echo ""

# Base directory
BASE_DIR="/Users/jaswanthkumar/Desktop/shared folder"

# Kill existing processes
echo "🛑 Stopping existing servers..."
killall -9 node 2>/dev/null
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
echo "─────────────────────────────────────────"

# Check if servers are running
FRONTEND_RUNNING=false
AUTH_RUNNING=false
GATEWAY_RUNNING=false

if lsof -i :8082 >/dev/null 2>&1; then
    echo "✅ Frontend (8082) - Running (PID: $FRONTEND_PID)"
    FRONTEND_RUNNING=true
else
    echo "❌ Frontend (8082) - Failed to start"
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

echo "─────────────────────────────────────────"
echo ""

# Only show access info if all servers are running
if [ "$FRONTEND_RUNNING" = true ] && [ "$AUTH_RUNNING" = true ] && [ "$GATEWAY_RUNNING" = true ]; then
    echo "🌍 Access your app:"
    echo "   Local:  http://localhost:2816"
    echo "   Mobile: Use your ngrok URL (e.g., https://xxxxx.ngrok-free.app)"
    echo ""
    echo "📱 Mobile Testing:"
    echo "   1. Start ngrok: ngrok http 2816"
    echo "   2. Update gateway.js with your ngrok URL"
    echo "   3. Restart servers with this script"
    echo "   4. Visit ngrok URL on your phone"
    echo ""
else
    echo "⚠️  Some servers failed to start. Check the logs above."
fi

echo "📝 View Logs:"
echo "   Frontend: tail -f \"$BASE_DIR/hiero last prtotype/jss/hiero/hiero last/frontend.log\""
echo "   Auth:     tail -f \"$BASE_DIR/login system/auth.log\""
echo "   Gateway:  tail -f \"$BASE_DIR/hiero last prtotype/jss/hiero/hiero last/gateway.log\""
echo ""
