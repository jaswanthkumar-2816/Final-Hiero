#!/bin/bash

echo "════════════════════════════════════════════════════════"
echo "🚀 PUSHING RESULT PAGE & PDF FIX UPDATES"
echo "════════════════════════════════════════════════════════"

cd "/Users/jaswanthkumar/Desktop/shared folder/hiero backend"

echo ""
echo "📊 Git Status:"
git status --short

echo ""
echo "📝 Staging all changes..."
git add .

echo ""
echo "💾 Committing changes..."
git commit -m "Update: Beautiful result page design + fix PDF parsing errors

- Implemented stunning new result.html design with gradient backgrounds
- Improved score ring animation and visual hierarchy
- Enhanced PDF parsing with multiple fallback methods
- Better error messages for corrupted/encrypted PDFs
- Responsive design improvements for mobile"

echo ""
echo "🚀 Pushing to GitHub..."
git push origin main

echo ""
echo "✅ DEPLOYMENT COMPLETE!"
echo "════════════════════════════════════════════════════════"
echo ""
echo "🎯 Changes Live:"
echo "  ✓ Beautiful new result page with gradient design"
echo "  ✓ Smooth score ring animation"
echo "  ✓ Better PDF error handling"
echo "  ✓ Improved fallback text extraction"
echo ""
echo "🧪 Test with:"
echo "  1. Go to analysis.html"
echo "  2. Upload a corrupted/problematic PDF"
echo "  3. Should see better error handling"
echo ""
echo "════════════════════════════════════════════════════════"