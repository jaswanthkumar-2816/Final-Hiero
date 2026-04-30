#!/bin/bash

# Stop All Hiero Servers Script

echo "🛑 Stopping all Hiero servers..."
echo ""

# Kill processes on specific ports
echo "Stopping Gateway (2816)..."
lsof -ti :2816 | xargs kill -9 2>/dev/null

echo "Stopping Auth Service (3000)..."
lsof -ti :3000 | xargs kill -9 2>/dev/null

echo "Stopping Frontend (8082)..."
lsof -ti :8082 | xargs kill -9 2>/dev/null

sleep 2

echo ""
echo "✅ All servers stopped!"
echo ""
echo "To check if ports are free:"
echo "  lsof -i :2816 -i :3000 -i :8082"
echo ""
