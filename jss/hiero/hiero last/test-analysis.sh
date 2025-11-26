#!/bin/bash

# Test analysis endpoint with sample data
echo "Testing /api/analyze endpoint..."

# Create a simple test with text-based JD
curl -i -X POST http://localhost:5001/api/analyze \
  -F "resume=@/dev/null" \
  -F "jdText=Looking for a Python developer with React and SQL skills"

echo -e "\n\nTest complete!"
