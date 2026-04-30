# 🚀 Ngrok Auto-Update Workflow

## Problem
Every time you restart your computer or ngrok, the URL changes (e.g., from `https://42f66d301e57.ngrok-free.app` to `https://43485d09887e.ngrok-free.app`), breaking OAuth redirects.

## Solution
Automate the entire update process with one command.

---

## 🎯 Quick Start (Recommended)

### Method 1: Automated Script
```bash
cd "/Users/jaswanthkumar/Desktop/shared folder"
./start-with-ngrok.sh
```

This will:
✅ Start ngrok on port 2816
✅ Auto-update all .env files with the new URL
✅ Show you the exact commands to restart services
✅ Print the new callback URLs for Google/GitHub

### Method 2: Manual Steps
If the script doesn't work, follow these steps:

#### Step 1: Start ngrok
```bash
ngrok http 2816
```
Keep this running in a terminal.

#### Step 2: Update environment files
```bash
cd "/Users/jaswanthkumar/Desktop/shared folder"
node update-ngrok-env.js
```

This auto-updates `login system/.env` with:
- `PUBLIC_URL`
- `GOOGLE_CALLBACK_URL`
- `GITHUB_CALLBACK_URL`
- `ALLOWED_ORIGINS`

#### Step 3: Restart Auth Service
```bash
cd "/Users/jaswanthkumar/Desktop/shared folder/login system"
node main.js
```

#### Step 4: Restart Gateway
```bash
cd "/Users/jaswanthkumar/Desktop/shared folder/hiero last prtotype/jss/hiero/hiero last"
PUBLIC_BASE_URL=<your-new-ngrok-url> PROXY_DEBUG=1 node gateway.js
```

Replace `<your-new-ngrok-url>` with the URL from Step 2 output.

#### Step 5: Update OAuth Provider Settings

**Google Cloud Console:**
1. Go to: https://console.cloud.google.com/apis/credentials
2. Click your OAuth 2.0 Client ID
3. Update:
   - **Authorized JavaScript origins:** `https://<new-ngrok-url>`
   - **Authorized redirect URIs:** `https://<new-ngrok-url>/auth/google/callback`
4. Click Save

**GitHub Developer Settings:**
1. Go to: https://github.com/settings/developers
2. Click your OAuth App
3. Update:
   - **Homepage URL:** `https://<new-ngrok-url>`
   - **Authorization callback URL:** `https://<new-ngrok-url>/auth/github/callback`
4. Click Update application

#### Step 6: Test
Open your new ngrok URL in a browser (or share with friends):
```
https://<new-ngrok-url>
```

Click "Login with Google" or "Login with GitHub" — it should work perfectly! 🎉

---

## 🔍 Troubleshooting

### "Cannot reach ngrok API at 127.0.0.1:4040"
- Make sure ngrok is running: `ngrok http 2816`
- Check ngrok dashboard: http://localhost:4040

### "No HTTPS ngrok tunnel found"
- Restart ngrok: `ngrok http 2816`
- Make sure you're using the HTTP tunnel, not TCP

### Still seeing old localhost:3000 redirects
- Clear browser cache or use incognito mode
- Verify `.env` was actually updated (check `login system/.env`)
- Restart both auth service AND gateway
- Double-check Google/GitHub callback URLs match exactly

### "Cannot GET /callback"
- Make sure dashboard is running on port 8082
- Restart gateway with correct PUBLIC_BASE_URL
- Check gateway logs for proxy errors

---

## 📝 File Locations

- **Ngrok update script:** `/Users/jaswanthkumar/Desktop/shared folder/update-ngrok-env.js`
- **Auto-start script:** `/Users/jaswanthkumar/Desktop/shared folder/start-with-ngrok.sh`
- **Auth .env:** `/Users/jaswanthkumar/Desktop/shared folder/login system/.env`
- **Auth server:** `/Users/jaswanthkumar/Desktop/shared folder/login system/main.js`
- **Gateway:** `/Users/jaswanthkumar/Desktop/shared folder/hiero last prtotype/jss/hiero/hiero last/gateway.js`

---

## 💡 Pro Tips

1. **Bookmark your current ngrok URL** so you can share it with friends/testers
2. **Use ngrok reserved domains** (paid plan) to get a permanent URL that never changes
3. **Keep the ngrok terminal open** — closing it kills the tunnel
4. **Test in incognito** to avoid cached redirects
5. **Save the auto-start script** — it saves tons of time!

---

## ✅ Verification Checklist

Before testing, verify:
- [ ] Ngrok is running on port 2816
- [ ] `login system/.env` has the new ngrok URL
- [ ] Auth service (port 3000) is running
- [ ] Gateway (port 2816) is running with PUBLIC_BASE_URL set
- [ ] Dashboard (port 8082) is running
- [ ] Google callback URL updated in console
- [ ] GitHub callback URL updated in settings
- [ ] Browser cache cleared or using incognito

---

## 🎯 Expected Flow

```
User clicks "Login with Google"
    ↓
Gateway forwards to /auth/google (auth service on :3000)
    ↓
Google OAuth page opens
    ↓
User logs in
    ↓
Google redirects to: https://<ngrok>/auth/google/callback
    ↓
Gateway forwards to auth service /auth/google/callback
    ↓
Auth service generates JWT token
    ↓
Redirects to: https://<ngrok>/dashboard?token=...&user=...
    ↓
Gateway forwards to dashboard (port 8082)
    ↓
Dashboard extracts token and logs user in ✅
```

---

## 🆘 Need Help?

If something still doesn't work:
1. Check all terminals for error messages
2. Verify ngrok dashboard shows requests: http://localhost:4040
3. Check browser console (F12) for errors
4. Compare your .env PUBLIC_URL with the actual ngrok URL
5. Make sure ALL services are using the same ngrok URL

---

**Last updated:** November 5, 2025
