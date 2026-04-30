#!/bin/bash

echo "🚀 Starting all Hiero servers..."
echo ""

# Base directory
BASE_DIR="/Users/jaswanthkumar/Desktop/shared folder"

# Kill existing processes
echo "🛑 Stopping existing servers..."
lsof -ti :2816 | xargs kill -9 2>/dev/null
lsof -ti :3000 | xargs kill -9 2>/dev/null
lsof -ti :8082 | xargs kill -9 2>/dev/null
sleep 2

# Start Frontend Server (Port 8082)
echo "📱 Starting Frontend Server (Port 8082)..."
cd "$BASE_DIR/hiero last prtotype/jss/hiero/hiero last"
node frontend-server.js > frontend.log 2>&1 &
FRONTEND_PID=$!
sleep 2

# Start Auth Service (Port 3000)
echo "🔐 Starting Auth Service (Port 3000)..."
cd "$BASE_DIR/login system"
node main.js > auth.log 2>&1 &
AUTH_PID=$!
sleep 2

# Start Gateway (Port 2816)
echo "🌐 Starting Gateway (Port 2816)..."
cd "$BASE_DIR/hiero last prtotype/jss/hiero/hiero last"
PUBLIC_BASE_URL=https://85692af7a6b1.ngrok-free.app node gateway.js > gateway.log 2>&1 &
GATEWAY_PID=$!
sleep 3

echo ""
echo "✅ All servers started!"
echo ""
echo "📊 Server Status:"
echo "─────────────────────────────────────────"

# Check if servers are running
if lsof -i :8082 > /dev/null 2>&1; then
    echo "✅ Frontend (8082) - Running (PID: $FRONTEND_PID)"
else
    echo "❌ Frontend (8082) - Failed to start"
    echo "   Check: $BASE_DIR/hiero last prtotype/jss/hiero/hiero last/frontend.log"
fi

if lsof -i :3000 > /dev/null 2>&1; then
    echo "✅ Auth Service (3000) - Running (PID: $AUTH_PID)"
else
    echo "❌ Auth Service (3000) - Failed to start"
    echo "   Check: $BASE_DIR/login system/auth.log"
fi

if lsof -i :2816 > /dev/null 2>&1; then
    echo "✅ Gateway (2816) - Running (PID: $GATEWAY_PID)"
else
    echo "❌ Gateway (2816) - Failed to start"
    echo "   Check: $BASE_DIR/hiero last prtotype/jss/hiero/hiero last/gateway.log"
fi

echo "─────────────────────────────────────────"
echo ""
echo "🌍 Access your app:"
echo "   Local:  http://localhost:2816"
echo "   Mobile: https://85692af7a6b1.ngrok-free.app"
echo ""
echo "📝 Logs:"
echo "   Frontend: tail -f \"$BASE_DIR/hiero last prtotype/jss/hiero/hiero last/frontend.log\""
echo "   Auth:     tail -f \"$BASE_DIR/login system/auth.log\""
echo "   Gateway:  tail -f \"$BASE_DIR/hiero last prtotype/jss/hiero/hiero last/gateway.log\""
echo ""
