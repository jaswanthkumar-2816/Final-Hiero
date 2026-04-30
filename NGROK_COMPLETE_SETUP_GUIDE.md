# Complete Ngrok Setup Guide - Frontend + Backend 🚀

## Problem Understanding

### Before (Local Development) ✅
```
Frontend: file:///Users/.../resume-builder.html (or http://localhost:8082)
Backend:  http://localhost:3000
Status:   ✅ Everything worked perfectly!
```

**Why it worked:** Both on same computer, can talk directly.

### Now (Ngrok Frontend Only) ❌
```
Frontend: https://85692e7a76b1.ngrok-free.app (online, public)
Backend:  http://localhost:3000 (still on your computer, not public)
Status:   ❌ "Backend server not responding"
```

**Why it fails:** Frontend is online but backend is still locked inside your computer. The internet cannot reach `localhost:3000`!

## The Complete Solution

You need to expose BOTH frontend and backend through Ngrok.

### Setup Method 1: Separate Ngrok Tunnels (Recommended)

This method gives you separate URLs for frontend and backend.

#### Step 1: Start Backend Server
```bash
cd "login system"
node main.js

# You should see:
# ✅ Server started on port 3000
# ✅ Browser instance ready
```

#### Step 2: Start Ngrok for Backend (Terminal 2)
```bash
ngrok http 3000
```

You'll get:
```
Forwarding: https://abc123xyz.ngrok-free.app -> http://localhost:3000
```

**🔴 IMPORTANT: Copy this URL!** This is your backend URL.

#### Step 3: Configure Frontend
Open `resume-builder.html` and find this line (around line 1030):

```javascript
const BACKEND_URL_OVERRIDE = null; // Change this when using Ngrok!
```

Change it to:
```javascript
const BACKEND_URL_OVERRIDE = 'https://abc123xyz.ngrok-free.app'; // Your backend Ngrok URL
```

**💡 Use the EXACT URL from Step 2!**

#### Step 4: Serve Frontend Through Backend (Option A - Easiest)

Copy `resume-builder.html` to backend's public folder:
```bash
cp "hiero last prtotype/jss/hiero/hiero last/public/resume-builder.html" "login system/public/"
```

Access frontend:
```
https://abc123xyz.ngrok-free.app/resume-builder.html
```

**✅ DONE!** Both frontend and backend are now accessible through Ngrok!

#### Step 4: Separate Frontend Server (Option B - More Complex)

If you want separate Ngrok URLs for frontend and backend:

```bash
# Terminal 3: Serve frontend
cd "hiero last prtotype/jss/hiero/hiero last/public"
python3 -m http.server 8080

# Terminal 4: Ngrok for frontend
ngrok http 8080
# Get: https://xyz789.ngrok-free.app
```

Then:
1. Update `BACKEND_URL_OVERRIDE` to your backend Ngrok URL
2. Access frontend at: `https://xyz789.ngrok-free.app/resume-builder.html`

---

### Setup Method 2: Single Ngrok Tunnel (Simpler)

Serve both frontend and backend on same Ngrok tunnel.

#### Step 1: Copy Frontend to Backend
```bash
cp "hiero last prtotype/jss/hiero/hiero last/public/resume-builder.html" "login system/public/"
cp "hiero last prtotype/jss/hiero/hiero last/public/logohiero.png" "login system/public/"
```

#### Step 2: Start Backend
```bash
cd "login system"
node main.js
```

#### Step 3: Start Ngrok
```bash
ngrok http 3000
```

Get URL like: `https://abc123.ngrok-free.app`

#### Step 4: Configure Frontend
In `resume-builder.html`, set:
```javascript
const BACKEND_URL_OVERRIDE = null; // Keep as null (auto-detect)
```

#### Step 5: Access
```
https://abc123.ngrok-free.app/resume-builder.html
```

**✅ DONE!** Everything on one URL!

---

## Configuration Reference

### BACKEND_URL_OVERRIDE Options

In `resume-builder.html`, find this section:

```javascript
// ========== BACKEND CONFIGURATION ==========
const BACKEND_URL_OVERRIDE = null;
```

**Set it based on your scenario:**

| Scenario | Set BACKEND_URL_OVERRIDE To |
|----------|----------------------------|
| Local development (file:// or localhost) | `null` (auto-detects localhost:3000) |
| Ngrok - Same tunnel for frontend & backend | `null` (auto-detects same origin) |
| Ngrok - Separate backend tunnel | `'https://your-backend-ngrok-url'` |
| Production - Same domain | `null` (auto-detects same origin) |
| Production - Separate backend API | `'https://api.yourdomain.com'` |

### Console Messages

**Local Development:**
```javascript
🌐 Backend URL: http://localhost:3000
🔄 Using AUTO-DETECT - Set BACKEND_URL_OVERRIDE if backend is on different URL
```

**Ngrok with Override:**
```javascript
🌐 Backend URL: https://abc123.ngrok-free.app
✅ Using OVERRIDE - Backend URL manually configured
```

**Ngrok without Override (Warning):**
```javascript
🌐 Backend URL: https://85692e7a76b1.ngrok-free.app
⚠️ Using same origin for backend. If backend is separate, set BACKEND_URL_OVERRIDE!
🔄 Using AUTO-DETECT - Set BACKEND_URL_OVERRIDE if backend is on different URL
```

---

## Complete Example Setup

### Terminal 1: Backend
```bash
cd "/Users/jaswanthkumar/Desktop/shared folder/login system"
node main.js

# Output:
# ✅ Server started on port 3000
# ✅ Browser instance ready - PDF generation will be fast!
```

### Terminal 2: Ngrok Backend
```bash
ngrok http 3000

# Output:
# Forwarding: https://f3a7122174.ngrok-free.app -> http://localhost:3000
```

### Edit Configuration
Open `resume-builder.html` and change line ~1030:
```javascript
const BACKEND_URL_OVERRIDE = 'https://f3a7122174.ngrok-free.app';
```

### Copy to Backend Public Folder
```bash
cp "hiero last prtotype/jss/hiero/hiero last/public/resume-builder.html" "login system/public/"
cp "hiero last prtotype/jss/hiero/hiero last/public/logohiero.png" "login system/public/"
```

### Access Application
```
Open: https://f3a7122174.ngrok-free.app/resume-builder.html
```

### Test
1. Click any template (e.g., "Classic Professional")
2. Preview should appear (not "temporarily unavailable")
3. Console should show: `✅ Using OVERRIDE - Backend URL manually configured`
4. Network tab should show: `POST https://f3a7122174.ngrok-free.app/preview-resume` → 200 OK

---

## Troubleshooting

### Issue: "Backend server not responding"

**Check 1: Backend Running?**
```bash
curl http://localhost:3000/health
# Should return: {"status":"Login system is running","port":"3000"}
```

**Check 2: Ngrok Tunnel Active?**
```bash
# In Ngrok terminal, should see:
# Session Status: online
# Forwarding: https://...ngrok-free.app -> http://localhost:3000
```

**Check 3: BACKEND_URL_OVERRIDE Correct?**
```javascript
// In resume-builder.html, should be:
const BACKEND_URL_OVERRIDE = 'https://YOUR-EXACT-NGROK-URL';
// NOT localhost! Must be the Ngrok URL from Terminal 2
```

**Check 4: Console Messages?**
```javascript
// Open F12, should see:
🌐 Backend URL: https://YOUR-NGROK-URL
✅ Using OVERRIDE - Backend URL manually configured

// NOT:
🌐 Backend URL: http://localhost:3000  ← Wrong! This won't work via Ngrok
```

### Issue: Ngrok Shows "Tunnel Not Found"

**Cause:** Ngrok free tier URLs expire/change on restart

**Solution:**
1. Restart Ngrok: `ngrok http 3000`
2. Copy NEW URL
3. Update `BACKEND_URL_OVERRIDE` with NEW URL
4. Refresh browser

### Issue: CORS Error

```
Access to fetch at 'https://...' from origin 'https://...' has been blocked by CORS policy
```

**Solution:** CORS should already be enabled in `main.js` (line 93).

If not, add:
```javascript
const cors = require('cors');
app.use(cors());
```

### Issue: Mixed Content Warning

```
Mixed Content: The page at 'https://...' was loaded over HTTPS, 
but requested an insecure resource 'http://localhost:3000'
```

**Cause:** `BACKEND_URL_OVERRIDE` is set to `http://localhost:3000` but you're accessing via Ngrok HTTPS.

**Solution:** Change to Ngrok HTTPS URL:
```javascript
const BACKEND_URL_OVERRIDE = 'https://your-backend-ngrok-url'; // HTTPS, not HTTP!
```

---

## Quick Reference

### What You Need Running

| Component | Command | Terminal | Port |
|-----------|---------|----------|------|
| Backend Server | `node main.js` | Terminal 1 | 3000 |
| Backend Ngrok | `ngrok http 3000` | Terminal 2 | - |

### URLs

| Item | URL | Notes |
|------|-----|-------|
| Backend Local | `http://localhost:3000` | Only works locally |
| Backend Public | `https://abc123.ngrok-free.app` | Use this in BACKEND_URL_OVERRIDE |
| Frontend | `https://abc123.ngrok-free.app/resume-builder.html` | After copying to public/ |

### File Locations

| File | Path |
|------|------|
| Backend | `/Users/jaswanthkumar/Desktop/shared folder/login system/main.js` |
| Frontend | `/Users/jaswanthkumar/Desktop/shared folder/hiero last prtotype/jss/hiero/hiero last/public/resume-builder.html` |
| Backend Public | `/Users/jaswanthkumar/Desktop/shared folder/login system/public/` |

---

## Why This Setup Is Better

### Before Fix
- ❌ Hardcoded localhost URLs
- ❌ Broke when using Ngrok
- ❌ No flexibility
- ❌ Confusing errors

### After Fix
- ✅ Configurable backend URL
- ✅ Works with Ngrok
- ✅ Works locally
- ✅ Works in production
- ✅ Clear console messages
- ✅ One setting to change (`BACKEND_URL_OVERRIDE`)

---

## Summary

**🎯 Key Takeaway:**

When using Ngrok for your frontend, you MUST also expose your backend through Ngrok (or put both on same tunnel), then configure `BACKEND_URL_OVERRIDE` to point to the backend's Ngrok URL.

**📝 Quick Setup:**

1. Start backend: `node main.js`
2. Start Ngrok: `ngrok http 3000`
3. Copy Ngrok URL: `https://abc123.ngrok-free.app`
4. Edit `resume-builder.html`: Set `BACKEND_URL_OVERRIDE = 'https://abc123.ngrok-free.app'`
5. Copy to backend public folder
6. Access: `https://abc123.ngrok-free.app/resume-builder.html`
7. ✅ Everything works!

---

**Date**: November 11, 2025  
**Status**: ✅ COMPLETE - Ngrok setup guide ready  
**Impact**: CRITICAL - Essential for remote access/sharing
