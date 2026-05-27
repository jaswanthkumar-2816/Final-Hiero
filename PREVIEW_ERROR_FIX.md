# 🔧 Template Preview Error - Fix Guide

## Problem
Getting "Failed to load preview" error when clicking on template cards.

## Root Cause
The frontend is trying to call `http://localhost:3000/preview-resume` but:
1. Backend server is not running, OR
2. Backend is running on different port, OR
3. Network/CORS issue

## Quick Fix Steps

### Step 1: Start the Backend Server

Open a terminal and run:

```bash
cd "/Users/jaswanthkumar/Desktop/shared folder/login system"
npm start
```

**Expected output:**
```
✅ Server started on port 3000
🔥 Pre-warming browser instance...
✅ Browser instance ready - PDF generation will be fast!
```

### Step 2: Verify Server is Running

In another terminal, test the server:

```bash
# Test if server is alive
curl http://localhost:3000/health

# Should return: {"status":"ok"}
```

### Step 3: Test Preview Endpoint

```bash
curl -X POST http://localhost:3000/preview-resume \
  -H "Content-Type: application/json" \
  -d '{
    "template": "modern",
    "personalInfo": {
      "fullName": "Test User",
      "email": "test@example.com",
      "phone": "1234567890"
    },
    "experience": [],
    "education": []
  }'
```

**Expected:** HTML content should be returned

### Step 4: Refresh Browser

After backend is running:
1. Hard refresh the browser: `Cmd + Shift + R` (Mac) or `Ctrl + Shift + R` (Windows)
2. Click on any template card
3. Preview should now load successfully

## Alternative: Make Preview Work Without Backend

If you want the preview to work without needing the backend running, I can add a fallback that generates basic HTML previews on the frontend. Let me know if you want this option.

## Troubleshooting

### Issue: Port 3000 Already in Use
```bash
# Find what's using port 3000
lsof -i :3000

# Kill the process if needed
kill -9 <PID>

# Then start backend again
npm start
```

### Issue: Backend Crashes
Check the logs in the terminal where you ran `npm start`. Common issues:
- Missing dependencies: Run `npm install`
- Port permissions: Try using port 3001 instead

### Issue: CORS Error
The backend already has CORS enabled in main.js. If you still see CORS errors:
1. Make sure backend is running
2. Check browser console for exact error
3. Verify both frontend and backend are on localhost

## Quick Test Checklist

- [ ] Backend terminal shows "Server started on port 3000"
- [ ] `curl http://localhost:3000/health` returns `{"status":"ok"}`
- [ ] Browser is on same domain (localhost or file://)
- [ ] Hard refresh browser after starting backend
- [ ] Template preview modal opens without errors

## Status Check

Run this command to see if everything is ready:

```bash
# Check if backend is running
if curl -s http://localhost:3000/health > /dev/null; then
  echo "✅ Backend is running!"
else
  echo "❌ Backend is NOT running. Start it with: cd 'login system' && npm start"
fi
```

## Next Steps

1. **Start backend** (if not running)
2. **Refresh browser** 
3. **Click template card** - Preview should work!
4. **Select template** and continue building your resume

---

**Quick Start Command:**
```bash
cd "/Users/jaswanthkumar/Desktop/shared folder/login system" && npm start
```

Then refresh your browser and try again! 🚀
