#!/bin/bash

# Template Loading Test Script
# Tests that templates load correctly in resume-builder.html

echo "╔════════════════════════════════════════════════════════════╗"
echo "║     Resume Builder Template Loading Test                  ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Check if Hiero Backend is running
echo "📡 Checking Hiero Backend (port 5003)..."
if curl -s http://localhost:5003/api/resume/templates > /dev/null 2>&1; then
    echo "✅ Hiero Backend is running on port 5003"
    
    # Fetch templates
    echo ""
    echo "🎨 Fetching templates..."
    RESPONSE=$(curl -s http://localhost:5003/api/resume/templates)
    
    # Count templates
    TEMPLATE_COUNT=$(echo "$RESPONSE" | grep -o '"id"' | wc -l | tr -d ' ')
    echo "✅ Found $TEMPLATE_COUNT templates"
    
    # List templates
    echo ""
    echo "📋 Available Templates:"
    echo "$RESPONSE" | grep -o '"id":"[^"]*"' | sed 's/"id":"//g' | sed 's/"//g' | nl
    
    echo ""
    echo "✅ Backend is ready for template loading!"
    echo ""
    echo "📝 Test Instructions:"
    echo "1. Open: http://localhost:8080/resume-builder.html"
    echo "2. Open browser console (F12)"
    echo "3. Look for: '🎨 Loading templates from Hiero Backend...'"
    echo "4. Look for: '✅ Loaded 10 templates'"
    echo "5. Verify: Template cards show colorful icons (not white)"
    echo ""
    
else
    echo "❌ Hiero Backend is NOT running on port 5003"
    echo ""
    echo "⚠️  Templates will use fallback (hardcoded templates)"
    echo ""
    echo "To start Hiero Backend:"
    echo "  cd '/Users/jaswanthkumar/Desktop/shared folder/hiero backend'"
    echo "  npm start"
    echo ""
fi

# Check if frontend is accessible
echo "🌐 Checking frontend server..."
if curl -s http://localhost:8080/ > /dev/null 2>&1; then
    echo "✅ Frontend server is running on port 8080"
else
    echo "⚠️  Frontend server might not be running"
    echo "   Start it with: npm start or your server command"
fi

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║                   Template Test Summary                    ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo "Expected Behavior:"
echo "  ✅ Page loads resume-builder.html"
echo "  ✅ Console shows: '🎨 Loading templates...'"
echo "  ✅ 10 template cards displayed"
echo "  ✅ Each card has colorful icon"
echo "  ✅ Each card has name, description, tags"
echo "  ✅ Preview button shows modal"
echo "  ✅ Start Building button goes to form"
echo "  ✅ Category filters work"
echo ""
echo "Visual Test Checklist:"
echo "  [ ] Icons are colorful (not white/blank)"
echo "  [ ] Template names are visible"
echo "  [ ] Descriptions are clear"
echo "  [ ] Tags show below each template"
echo "  [ ] Premium badges visible on some"
echo "  [ ] Hover shows preview overlay"
echo "  [ ] All buttons work"
echo ""
echo "🎉 If all checks pass, templates are working perfectly!"
echo ""
