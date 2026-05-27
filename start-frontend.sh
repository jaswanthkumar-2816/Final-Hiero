#!/bin/bash

cd "/Users/jaswanthkumar/Desktop/shared folder/hiero last prtotype/jss/hiero/hiero last"

# Kill existing frontend server if running
lsof -ti :8082 | xargs kill -9 2>/dev/null

# Start frontend server
echo "🚀 Starting Frontend Server on port 8082..."
nohup node frontend-server.js > frontend.log 2>&1 &
FRONTEND_PID=$!

sleep 2

# Check if it's running
if lsof -i :8082 > /dev/null 2>&1; then
    echo "✅ Frontend server is running (PID: $FRONTEND_PID)"
    echo "   URL: http://localhost:8082"
else
    echo "❌ Frontend server failed to start"
    cat frontend.log
    exit 1
fi
