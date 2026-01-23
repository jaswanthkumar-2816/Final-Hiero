#!/bin/bash
# Auto-start ngrok + update env + show next steps
# Usage: ./start-with-ngrok.sh

echo "🚀 Starting ngrok on port 2816..."
ngrok http 2816 > /dev/null 2>&1 &
NGROK_PID=$!

echo "⏳ Waiting 3 seconds for ngrok to initialize..."
sleep 3

echo ""
echo "🔄 Auto-updating .env with new ngrok URL..."
node update-ngrok-env.js

if [ $? -eq 0 ]; then
  echo ""
  echo "✅ Setup complete!"
  echo ""
  echo "📋 Next steps:"
  echo "1️⃣  Restart Auth Service:"
  echo "    cd 'Desktop/shared folder/login system' && node main.js"
  echo ""
  echo "2️⃣  Restart Gateway (copy this exact command):"
  NGROK_URL=$(grep "PUBLIC_URL=" "login system/.env" | cut -d'=' -f2)
  echo "    cd 'Desktop/shared folder/hiero last prtotype/jss/hiero/hiero last' && PUBLIC_BASE_URL=$NGROK_URL PROXY_DEBUG=1 node gateway.js"
  echo ""
  echo "3️⃣  Update OAuth providers:"
  echo "    Google:  $NGROK_URL/auth/google/callback"
  echo "    GitHub:  $NGROK_URL/auth/github/callback"
  echo ""
  echo "4️⃣  Test: $NGROK_URL"
  echo ""
  echo "💡 ngrok is running in background (PID: $NGROK_PID)"
  echo "   To stop: kill $NGROK_PID"
else
  echo "❌ Failed to update .env. Make sure ngrok is running."
  kill $NGROK_PID 2>/dev/null
  exit 1
fi
