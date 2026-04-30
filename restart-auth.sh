#!/bin/bash

# Kill existing auth service
echo "Stopping auth service..."
lsof -ti :3000 | xargs kill -9 2>/dev/null
sleep 2

# Start auth service
echo "Starting auth service..."
cd "/Users/jaswanthkumar/Desktop/shared folder/login system"
node main.js > auth.log 2>&1 &

sleep 2

# Verify it's running
if lsof -i :3000 > /dev/null 2>&1; then
    echo "✅ Auth service started successfully on port 3000"
    ps aux | grep "main.js" | grep -v grep
else
    echo "❌ Failed to start auth service"
    tail -20 auth.log
fi
