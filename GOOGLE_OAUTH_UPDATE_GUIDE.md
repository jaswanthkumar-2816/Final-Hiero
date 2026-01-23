# Google OAuth Configuration Update Guide

## 🎯 Objective
Update Google Cloud Console OAuth redirect URLs to point to the gateway instead of the old authentication server.

---

## 📋 Current Configuration Summary

### **What Changed:**
- ❌ **OLD**: Separate auth server on port 3000
- ✅ **NEW**: Auth routes integrated into gateway on port 2816 (local) or dynamic PORT (Render)

### **Your Environment:**
- **Local Development**: `http://localhost:2816`
- **Production (Render)**: `https://hiero-gateway.onrender.com`

---

## 🔧 Step-by-Step: Update Google Cloud Console

### **Step 1: Access Google Cloud Console**

1. Go to: https://console.cloud.google.com/
2. Sign in with your Google account
3. Select your project (or create one if you haven't)

### **Step 2: Navigate to OAuth Consent Screen**

1. In the left sidebar, click **"APIs & Services"** → **"OAuth consent screen"**
2. Verify your app information is correct
3. Note: You might need to update **Authorized domains** if using a custom domain

### **Step 3: Navigate to Credentials**

1. In the left sidebar, click **"APIs & Services"** → **"Credentials"**
2. Find your OAuth 2.0 Client ID in the list
   - Client ID: `199127558872-r8b08p26i8sbjlfvo1tmrqruhq2m4ro6.apps.googleusercontent.com`
3. Click on the Client ID to edit it

### **Step 4: Update Authorized Redirect URIs**

In the **"Authorized redirect URIs"** section, REMOVE any old URIs and ADD the following:

#### **For Local Development:**
```
http://localhost:2816/auth/google/callback
```

#### **For Production (Render):**
```
https://hiero-gateway.onrender.com/auth/google/callback
```

#### **Optional - If you use other ports during development:**
```
http://localhost:3000/auth/google/callback
http://127.0.0.1:2816/auth/google/callback
```

### **Step 5: Update Authorized JavaScript Origins (if needed)**

In the **"Authorized JavaScript origins"** section, ADD:

#### **For Local Development:**
```
http://localhost:2816
```

#### **For Production (Render):**
```
https://hiero-gateway.onrender.com
```

### **Step 6: Save Changes**

1. Click **"SAVE"** at the bottom of the page
2. Wait a few moments for changes to propagate (usually instant, but can take up to 5 minutes)

---

## ✅ Verification Checklist

After updating Google Cloud Console, verify:

- [ ] Authorized redirect URIs include: `http://localhost:2816/auth/google/callback`
- [ ] Authorized redirect URIs include: `https://hiero-gateway.onrender.com/auth/google/callback`
- [ ] Authorized JavaScript origins include: `http://localhost:2816`
- [ ] Authorized JavaScript origins include: `https://hiero-gateway.onrender.com`
- [ ] Changes saved successfully
- [ ] No old localhost:3000 URLs remain (unless you still need them)

---

## 🔍 How to Test

### **Local Testing:**

1. Restart your gateway server:
   ```bash
   lsof -ti :2816 | xargs kill -9 && node gateway.js
   ```

2. Open browser and go to: `http://localhost:2816/auth/google`

3. You should be redirected to Google login

4. After login, you should be redirected back to: `http://localhost:2816/auth/google/callback`

5. Then redirected to: `http://localhost:2816/dashboard?token=...`

### **Production Testing (Render):**

1. Deploy your gateway to Render

2. Ensure environment variables are set on Render:
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
   - `GOOGLE_CALLBACK_URL=https://hiero-gateway.onrender.com/auth/google/callback`
   - `PUBLIC_URL=https://hiero-gateway.onrender.com`

3. Open browser and go to: `https://hiero-gateway.onrender.com/auth/google`

4. Complete OAuth flow

5. Verify successful redirect to dashboard

---

## 🐛 Troubleshooting

### **Error: "redirect_uri_mismatch"**

**Cause:** The callback URL in your request doesn't match the ones registered in Google Cloud Console.

**Solution:**
1. Check the error message - it will show you which URL was used
2. Add that exact URL to "Authorized redirect URIs" in Google Cloud Console
3. Make sure there are no typos (check http vs https, trailing slashes, etc.)

### **Error: "400 Bad Request"**

**Cause:** Usually related to OAuth configuration issues.

**Solution:**
1. Verify `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in `.env`
2. Check if callback URL is properly registered
3. Clear browser cookies and try again

### **Error: "Cannot GET /auth/google/callback"**

**Cause:** The gateway isn't handling the OAuth callback route.

**Solution:**
1. Verify `routes/auth.js` is mounted in `gateway.js`: `app.use('/', authRoutes);`
2. Check if Passport is initialized: `app.use(passport.initialize());`
3. Restart the gateway server

---

## 📝 Quick Reference

### **Your OAuth Credentials:**
- **Client ID**: `199127558872-r8b08p26i8sbjlfvo1tmrqruhq2m4ro6.apps.googleusercontent.com`
- **Client Secret**: `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`

### **Callback URLs to Register:**
- **Local**: `http://localhost:2816/auth/google/callback`
- **Render**: `https://hiero-gateway.onrender.com/auth/google/callback`

### **Environment Variables (.env):**
```env
PORT=2816
GOOGLE_CLIENT_ID=199127558872-r8b08p26i8sbjlfvo1tmrqruhq2m4ro6.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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
PUBLIC_URL=https://hiero-gateway.onrender.com
GOOGLE_CALLBACK_URL=https://hiero-gateway.onrender.com/auth/google/callback
LOCAL_GOOGLE_CALLBACK_URL=http://localhost:2816/auth/google/callback
```

---

## 🎉 Success Criteria

After completing these steps:

✅ Local OAuth login works on `http://localhost:2816/auth/google`
✅ Production OAuth login works on `https://hiero-gateway.onrender.com/auth/google`
✅ No more "redirect_uri_mismatch" errors
✅ Users successfully redirected to dashboard after login
✅ JWT token properly generated and included in redirect

---

## 📞 Need Help?

If you encounter issues:

1. Check the browser console for errors
2. Check the gateway server logs for errors
3. Verify all environment variables are loaded correctly
4. Make sure the gateway is running on the correct port
5. Clear browser cache and cookies, then try again
