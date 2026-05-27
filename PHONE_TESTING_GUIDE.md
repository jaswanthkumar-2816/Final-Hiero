# 📱 Phone Testing Guide - OAuth Flow

## ✅ Current Status
All servers are running and configured correctly!

### Running Services:
- ✅ Gateway: Port 2816 (with PUBLIC_BASE_URL)
- ✅ Auth Service: Port 3000
- ✅ Frontend: Port 8082
- ✅ signup.html: Fixed to use relative paths

## 🔍 What to Test on Phone

### Step 1: Access the Signup Page
Open on your phone:
```
https://85692af7a6b1.ngrok-free.app/signup.html
```

**Expected:** You should see the Hiero signup page with "Login with Google" and "Login with GitHub" buttons.

### Step 2: Click "Login with Google"
**Expected:** 
- Redirects to Google's login page
- URL should be: `https://accounts.google.com/o/oauth2/v2/auth?...`

### Step 3: After Google Login
**Expected:**
- Google redirects to: `https://85692af7a6b1.ngrok-free.app/auth/google/callback?code=...`
- Gateway proxies to auth service
- Auth service creates JWT token
- Redirects to: `http://localhost:8082/dashboard?token=...&user=...`

⚠️ **KNOWN ISSUE:** The final redirect goes to `localhost:8082` which won't work on phone!

## 🔧 Fix Needed

The auth service (main.js) is redirecting to:
```
http://localhost:8082/dashboard
```

This needs to be changed to use the ngrok URL for phone testing:
```
https://85692af7a6b1.ngrok-free.app/dashboard
```

OR better yet, redirect to the gateway:
```
https://85692af7a6b1.ngrok-free.app/dashboard
```

Then the gateway can proxy to frontend (8082).

## 🧪 Quick Tests You Can Run

### Test 1: Signup Page Loads
```bash
curl -I http://localhost:2816/signup.html
# Should return: 200 OK
```

### Test 2: OAuth Links Are Relative
```bash
curl -s http://localhost:2816/signup.html | grep 'href="/auth'
# Should show: href="/auth/google" and href="/auth/github"
```

### Test 3: OAuth Redirect Works
```bash
curl -I http://localhost:2816/auth/google
# Should return: 302 Found
# Location: https://accounts.google.com/o/oauth2/v2/auth?...
```

## 🐛 Troubleshooting

### Phone shows "Cannot connect"
1. Check ngrok is running: Visit https://85692af7a6b1.ngrok-free.app
2. If ngrok shows different URL, update PUBLIC_BASE_URL
3. Restart gateway with new URL

### "Login with Google" does nothing
1. Check browser console for errors (F12 on desktop)
2. Verify links in signup.html are `/auth/google` not `http://localhost:3000/auth/google`
3. Test OAuth route: `curl -I http://localhost:2816/auth/google`

### After Google login, shows localhost error
This is expected! The auth service redirects to localhost:8082.
**Fix:** Update main.js to redirect to ngrok URL instead.

## 📝 Files to Check

1. **signup.html** - Should have:
   ```html
   <a href="/auth/google" class="btn google-btn">
   <a href="/auth/github" class="btn github-btn">
   ```

2. **main.js** (auth service) - Check redirect URL after OAuth:
   ```javascript
   // Look for lines like:
   res.redirect(`http://localhost:8082/dashboard?token=${token}...`)
   // Should be:
   res.redirect(`${req.protocol}://${req.get('host')}/dashboard?token=${token}...`)
   ```

3. **gateway.js** - Should have:
   ```javascript
   app.all('/auth/google', gwProxy({ target: 'http://localhost:3000' }));
   ```

## 🚀 Next Steps

1. ✅ signup.html fixed - uses relative paths
2. ✅ Gateway running with PUBLIC_BASE_URL
3. 🔄 Need to fix main.js redirect URL for phone compatibility
4. 🔄 Or add /dashboard proxy route in gateway to serve frontend

