# 🚨 URGENT FIX: Update Google OAuth Settings

## Problem
Your friend sees `localhost:3000/auth/google` because **Google Cloud Console** still has the old callback URL.

---

## ✅ SOLUTION: Update Google Console NOW

### Step 1: Go to Google Cloud Console
Click this link: **https://console.cloud.google.com/apis/credentials**

### Step 2: Find Your OAuth Client
- Look for: **OAuth 2.0 Client IDs**
- Find the one with ID: `199127558872-r8b08p26i8sbjlfvo1tmrqruhq2m4ro6.apps.googleusercontent.com`
- Click on it to edit

### Step 3: Update Authorized JavaScript Origins
**DELETE any localhost URLs**, then add:
```
https://43485d09887e.ngrok-free.app
```

### Step 4: Update Authorized Redirect URIs
**DELETE any localhost URLs**, then add:
```
https://43485d09887e.ngrok-free.app/auth/google/callback
```

### Step 5: Save
- Click **SAVE** at the bottom
- Wait 5-10 seconds for Google to update

---

## 🧪 Test Again

1. **Clear your friend's browser cache** or use **Incognito mode**
2. Go to: `https://43485d09887e.ngrok-free.app`
3. Click "Login with Google"
4. Should now redirect to Google (not localhost)

---

## 🎯 Visual Guide

Your Google Console should look like this:

```
OAuth 2.0 Client ID
-------------------

Authorized JavaScript origins:
  https://43485d09887e.ngrok-free.app

Authorized redirect URIs:
  https://43485d09887e.ngrok-free.app/auth/google/callback
```

**⚠️ REMOVE ALL `localhost` URLS!**

---

## ✅ Verification

After updating, test with this command:
```bash
curl -I https://43485d09887e.ngrok-free.app/auth/google
```

You should see a redirect to `accounts.google.com` (not localhost).

---

## 🔍 Common Mistakes

❌ **Don't do this:**
- Leaving old `localhost:3000` URLs in Google Console
- Adding trailing slashes: `https://43485d09887e.ngrok-free.app/`
- Using `http://` instead of `https://`

✅ **Do this:**
- Remove ALL localhost URLs
- Use exact URLs above (no trailing slash)
- Click SAVE and wait 10 seconds

---

## Still Not Working?

If it still shows localhost after updating:

1. **Clear browser cache completely** on friend's laptop
2. **Use Incognito/Private mode**
3. **Wait 1-2 minutes** after saving in Google Console
4. **Check your .env** is correct (it is ✅)
5. **Restart auth service** (already done ✅)
6. **Check ngrok is still running:** http://localhost:4040

---

## 📞 Quick Debug

Run these commands:
```bash
# Check auth service is using new URL
cat "/Users/jaswanthkumar/Desktop/shared folder/login system/.env" | grep PUBLIC_URL

# Should show: PUBLIC_URL=https://43485d09887e.ngrok-free.app
```

---

## 🎯 Expected Flow

```
Friend's Browser
    ↓
https://43485d09887e.ngrok-free.app
    ↓
Clicks "Login with Google"
    ↓
Redirects to: accounts.google.com/o/oauth2/auth?...
    ↓
Friend logs in
    ↓
Google redirects to: https://43485d09887e.ngrok-free.app/auth/google/callback
    ↓
✅ Success!
```

**NOT:**
```
❌ localhost:3000/auth/google (This means Google Console not updated)
```

---

**Updated:** November 5, 2025, 7:50 PM
**Action Required:** Update Google Console NOW
**URL to update:** https://console.cloud.google.com/apis/credentials
