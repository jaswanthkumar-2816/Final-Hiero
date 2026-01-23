#!/bin/bash

# Kill all Hiero services
echo "🛑 Stopping all Hiero services..."

# Kill by ports
lsof -ti:3000 | xargs kill -9 2>/dev/null || true
lsof -ti:5001 | xargs kill -9 2>/dev/null || true
lsof -ti:5003 | xargs kill -9 2>/dev/null || true
lsof -ti:2816 | xargs kill -9 2>/dev/null || true

# Kill by PIDs if file exists
if [ -f .pids ]; then
  kill $(cat .pids) 2>/dev/null || true
  rm -f .pids
fi

echo "✅ All services stopped."
