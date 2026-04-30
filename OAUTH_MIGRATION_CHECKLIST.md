# 🚀 Quick Start Checklist - OAuth Migration

## ✅ Completed Steps

- [x] Updated `.env` with local callback URLs
- [x] Changed PORT from 3000 → 2816
- [x] Updated `gateway.js` default PORT to 2816
- [x] Updated `routes/auth.js` PUBLIC_URL to use port 2816
- [x] Updated `routes/auth.js` to support local GitHub credentials
- [x] Auth router already mounted in gateway (`app.use('/', authRoutes)`)
- [x] Passport already initialized in gateway

## ⏳ Next Steps (REQUIRED)

### 1. Update Google Cloud Console OAuth Settings

**URL:** https://console.cloud.google.com/apis/credentials

**What to do:**
1. Find OAuth Client ID: `199127558872-r8b08p26i8sbjlfvo1tmrqruhq2m4ro6.apps.googleusercontent.com`
2. Click to edit
3. Add these "Authorized redirect URIs":
   - `http://localhost:2816/auth/google/callback`
   - `https://hiero-gateway.onrender.com/auth/google/callback`
4. Add these "Authorized JavaScript origins":
   - `http://localhost:2816`
   - `https://hiero-gateway.onrender.com`
5. Save

**Detailed guide:** See `GOOGLE_OAUTH_UPDATE_GUIDE.md`

---

### 2. Update GitHub OAuth App Settings

**URL:** https://github.com/settings/developers

**Option A - Use Production Credentials for Local (Quick & Easy):**
1. Edit existing OAuth App
2. Change "Authorization callback URL" to: `http://localhost:2816/auth/github/callback`
3. Save

**Option B - Create Separate Dev App (Recommended):**
1. Create NEW OAuth App for local development
2. Set callback URL to: `http://localhost:2816/auth/github/callback`
3. Copy Client ID and Secret
4. Add to `.env`:
   ```env
   LOCAL_GITHUB_CLIENT_ID=<new-client-id>
   LOCAL_GITHUB_CLIENT_SECRET=<new-client-secret>
   ```
5. Keep production app with: `https://hiero-gateway.onrender.com/auth/github/callback`

**Detailed guide:** See `GITHUB_OAUTH_UPDATE_GUIDE.md`

---

### 3. Restart Gateway Server

**Stop current server:**
```bash
lsof -ti :2816 | xargs kill -9
```

**Or stop the running one on port 3000:**
```bash
lsof -ti :3000 | xargs kill -9
```

**Start gateway:**
```bash
node gateway.js
```

**Expected output:**
```
✅ Gateway server started on port 2816
🔐 OAuth configuration:
   GOOGLE_CLIENT_ID       = loaded
   GOOGLE_CALLBACK_URL    = https://hiero-gateway.onrender.com/auth/google/callback
   PUBLIC_URL             = https://hiero-gateway.onrender.com

📡 Frontend: http://localhost:2816
🔐 Auth routes available at root level
   - POST /signup
   - POST /login
   - GET /auth/google
   - GET /auth/github
```

---

### 4. Test OAuth Flows

**Test Google OAuth:**
1. Open browser
2. Go to: `http://localhost:2816/auth/google`
3. Sign in with Google
4. Should redirect to: `http://localhost:2816/dashboard?token=...`

**Test GitHub OAuth:**
1. Open browser
2. Go to: `http://localhost:2816/auth/github`
3. Authorize with GitHub
4. Should redirect to: `http://localhost:2816/dashboard?token=...`

**If you get errors:**
- Check that you updated OAuth provider settings
- Check server logs for error messages
- See troubleshooting guides in the summary docs

---

### 5. Deploy to Render (When Ready)

1. **Push changes to Git:**
   ```bash
   git add .
   git commit -m "Integrate auth into gateway on port 2816"
   git push
   ```

2. **Set environment variables on Render:**
   Go to your Render dashboard and set:
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
   - `GITHUB_CLIENT_ID`
   - `GITHUB_CLIENT_SECRET`
   - `GOOGLE_CALLBACK_URL=https://hiero-gateway.onrender.com/auth/google/callback`
   - `GITHUB_CALLBACK_URL=https://hiero-gateway.onrender.com/auth/github/callback`
   - `PUBLIC_URL=https://hiero-gateway.onrender.com`
   - `JWT_SECRET=X7k9P!mQ2aL5vR8`
   - `EMAIL_USER=jaswanthkumarmuthoju@gmail.com`
   - `EMAIL_PASS=hnbe expk vrgs fbfg`

   **Note:** Don't set `LOCAL_*` variables on Render, only on local `.env`

3. **Test on Render:**
   - Visit: `https://hiero-gateway.onrender.com/auth/google`
   - Visit: `https://hiero-gateway.onrender.com/auth/github`

---

## 📊 Current Status

| Item | Status |
|------|--------|
| Code Changes | ✅ Complete |
| `.env` Updated | ✅ Complete |
| Google OAuth Settings | ⏳ **YOU NEED TO DO THIS** |
| GitHub OAuth Settings | ⏳ **YOU NEED TO DO THIS** |
| Local Testing | ⏳ Pending OAuth updates |
| Production Deployment | ⏳ Pending local testing |

---

## 🎯 Summary

**What changed:**
- Auth system moved INTO gateway
- Port 3000 → Port 2816 (local)
- No more separate auth server
- All routes work the same from frontend perspective

**What you need to do:**
1. Update Google Cloud Console redirect URLs
2. Update GitHub OAuth App redirect URLs
3. Restart gateway server
4. Test OAuth flows locally
5. Deploy to Render when ready

**Where to get help:**
- `AUTH_INTEGRATION_SUMMARY.md` - Complete overview
- `GOOGLE_OAUTH_UPDATE_GUIDE.md` - Google setup
- `GITHUB_OAUTH_UPDATE_GUIDE.md` - GitHub setup

---

## ⚡ Quick Commands

**Kill port 2816:**
```bash
lsof -ti :2816 | xargs kill -9
```

**Kill port 3000:**
```bash
lsof -ti :3000 | xargs kill -9
```

**Start gateway:**
```bash
node gateway.js
```

**Check what's running on port 2816:**
```bash
lsof -i :2816
```

**View logs:**
```bash
# Gateway server will output logs to console
# Just watch the terminal where you ran 'node gateway.js'
```

---

## 🎉 You're Almost Done!

Just update the OAuth provider settings and you'll be all set! 🚀
