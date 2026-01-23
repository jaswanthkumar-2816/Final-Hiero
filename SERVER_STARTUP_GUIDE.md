# 🚀 Complete Server Startup Guide

## 🎯 Current Issues & Solutions

### Issue 1: Port 8082 Refusing Connection ❌
**Problem:** Frontend server (port 8082) is not running  
**Solution:** Start the frontend server

### Issue 2: Token Not Being Used ❌
**Problem:** Frontend has hardcoded localhost URLs that don't work on phone  
**Solution:** Need to update frontend to use relative URLs or detect current host

## 📋 Quick Start - Run All Servers

### Option 1: Use the startup script (Recommended)
```bash
chmod +x "/Users/jaswanthkumar/Desktop/shared folder/start-all-servers.sh"
"/Users/jaswanthkumar/Desktop/shared folder/start-all-servers.sh"
```

### Option 2: Manual startup

**Terminal 1 - Frontend Server (Port 8082)**
```bash
cd "/Users/jaswanthkumar/Desktop/shared folder/hiero last prtotype/jss/hiero/hiero last"
node frontend-server.js
```

**Terminal 2 - Auth Service (Port 3000)**
```bash
cd "/Users/jaswanthkumar/Desktop/shared folder/login system"
node main.js
```

**Terminal 3 - Gateway (Port 2816)**
```bash
cd "/Users/jaswanthkumar/Desktop/shared folder/hiero last prtotype/jss/hiero/hiero last"
PUBLIC_BASE_URL=https://85692af7a6b1.ngrok-free.app node gateway.js
```

## 🔍 Verify All Servers Are Running

```bash
lsof -i :2816 -i :3000 -i :8082 | grep LISTEN
```

You should see 3 processes:
- Port 2816 (gateway)
- Port 3000 (auth)
- Port 8082 (frontend)

## 🐛 Current Frontend Issue

The `public/index.html` file has hardcoded URLs:
```javascript
// Line 135 - Won't work on phone
window.location.href = 'http://localhost:8082/login';

// Line 157 - Won't work on phone
fetch('http://localhost:3000/dashboard', {
```

### 🔧 Fix Needed

The frontend needs to use relative URLs or detect the current host. Since you're using a gateway, all requests should go through the gateway.

**Current Flow (BROKEN on phone):**
```
Phone → Gateway (2816) → Auth (3000) → Redirects to localhost:8082 ❌
Phone tries to access localhost:8082 → Connection refused
```

**Fixed Flow (WORKING on phone):**
```
Phone → Gateway (2816) → Auth (3000) → Redirects to ngrok/dashboard ✅
Phone → Gateway (2816) → Proxies to Frontend (8082) ✅
```

## ✅ What's Working Now

1. ✅ Google OAuth login works
2. ✅ Token is generated correctly
3. ✅ Auth service (3000) running
4. ✅ Gateway (2816) running
5. ✅ OAuth redirects work

## ❌ What Needs Fixing

1. ❌ Frontend server (8082) not running → Start it
2. ❌ Frontend URLs hardcoded to localhost → Update to use gateway
3. ❌ Dashboard should be accessed via gateway, not directly

## 🔄 Recommended Fix for Frontend

The auth service now redirects to:
```
https://85692af7a6b1.ngrok-free.app/dashboard?token=...&user=...
```

The gateway should proxy `/dashboard` to port 8082 (already configured).

But the frontend (index.html) needs to:
1. Use relative URLs (e.g., `/login` instead of `http://localhost:8082/login`)
2. Access API via gateway (e.g., `/dashboard` instead of `http://localhost:3000/dashboard`)

## 📱 Test Flow After Starting All Servers

1. **Start all servers** using the script above
2. **Verify** all 3 servers running
3. **Open on phone:** `https://85692af7a6b1.ngrok-free.app/signup.html`
4. **Click** "Login with Google"
5. **After Google login:**
   - Should redirect to: `https://85692af7a6b1.ngrok-free.app/dashboard?token=...`
   - Gateway should proxy to Frontend (8082)
   - Frontend should display dashboard

## 🎯 Next Steps

1. ✅ Start all three servers
2. 🔄 Test if dashboard loads (might still have issues)
3. 🔧 Fix frontend hardcoded URLs if needed

## 📊 Server Health Check

```bash
# Check all servers
echo "=== Server Status ==="
lsof -i :2816 && echo "✅ Gateway running"
lsof -i :3000 && echo "✅ Auth running"
lsof -i :8082 && echo "✅ Frontend running"

# Check gateway is proxying /dashboard
curl -I http://localhost:2816/dashboard

# Check frontend directly
curl -I http://localhost:8082/
```

## 🚨 Common Issues

### "Cannot GET /dashboard"
- Gateway might not be proxying correctly
- Check gateway.js has `/dashboard` proxy route

### "Connection refused"
- Server not running on that port
- Check with `lsof -i :PORT`

### "Old token being used"
- Clear browser localStorage: `localStorage.clear()`
- Or use incognito mode

---

**Last Updated:** November 7, 2025  
**Status:** Google OAuth working, Frontend server needs to be started
