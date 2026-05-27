#!/bin/bash

echo "🔄 Restarting Auth Service..."

# Kill existing auth service
lsof -ti :3000 | xargs kill -9 2>/dev/null
sleep 2

# Start auth service
cd "/Users/jaswanthkumar/Desktop/shared folder/login system"
node main.js > auth.log 2>&1 &

sleep 2

# Check if running
if lsof -i :3000 > /dev/null 2>&1; then
    echo "✅ Auth service restarted successfully"
    lsof -i :3000 | grep LISTEN
else
    echo "❌ Failed to restart auth service"
    echo "Check log: tail -20 /Users/jaswanthkumar/Desktop/shared\ folder/login\ system/auth.log"
fi
