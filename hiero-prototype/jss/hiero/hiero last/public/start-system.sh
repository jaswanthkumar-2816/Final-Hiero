#!/bin/bash

echo "🚀 Starting Hiero Resume Analysis System..."

# Function to check if a port is in use
check_port() {
    lsof -ti:$1 > /dev/null 2>&1
}

# Kill existing processes on ports 5001 and 8080
echo "🔄 Cleaning up existing processes..."
lsof -ti:5001 | xargs kill -9 2>/dev/null || true
lsof -ti:8080 | xargs kill -9 2>/dev/null || true

# Start backend server
echo "🔧 Starting backend server on port 5001..."
cd "../../../../hiero backend/hiero analysis part"
node index.js &
BACKEND_PID=$!

# Wait a moment for backend to start
sleep 3

# Check if backend started successfully
if check_port 5001; then
    echo "✅ Backend server started successfully on port 5001"
else
    echo "❌ Failed to start backend server"
    exit 1
fi

# Start frontend server
echo "🌐 Starting frontend server on port 8080..."
cd "../../../jss/hiero/hiero last/public"
python3 -m http.server 8080 &
FRONTEND_PID=$!

# Wait a moment for frontend to start
sleep 2

# Check if frontend started successfully
if check_port 8080; then
    echo "✅ Frontend server started successfully on port 8080"
else
    echo "❌ Failed to start frontend server"
    exit 1
fi

echo ""
echo "🎉 Hiero Resume Analysis System is now running!"
echo ""
echo "📱 Frontend: http://localhost:8080"
echo "🔧 Backend:  http://localhost:5001"
echo ""
echo "📄 Test the connection: http://localhost:8080/test-connection.html"
echo "📊 Start analyzing: http://localhost:8080/analysis.html"
echo ""
echo "Press Ctrl+C to stop both servers"

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Stopping servers..."
    kill $BACKEND_PID 2>/dev/null || true
    kill $FRONTEND_PID 2>/dev/null || true
    echo "✅ Servers stopped"
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Keep script running
wait 