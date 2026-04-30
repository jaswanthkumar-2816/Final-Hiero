#!/bin/bash
echo "Testing Googlebot access to hiero.in..."
echo ""
echo "1. Testing robots.txt:"
curl -A "Googlebot/2.1" https://hiero.in/robots.txt
echo ""
echo "2. Testing main page:"
curl -I -A "Googlebot/2.1" https://hiero.in/ | grep -E "HTTP|cf-|blocked"
echo ""
echo "If you see 'Status: 200' and no 'blocked', Googlebot can access!"
