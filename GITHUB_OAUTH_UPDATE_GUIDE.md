# GitHub OAuth Configuration Update Guide

## 🎯 Objective
Update GitHub OAuth App settings to point to the gateway instead of the old authentication server.

---

## 📋 Current Configuration Summary

### **What Changed:**
- ❌ **OLD**: Separate auth server on port 3000
- ✅ **NEW**: Auth routes integrated into gateway on port 2816 (local) or dynamic PORT (Render)

### **Your Environment:**
- **Local Development**: `http://localhost:2816`
- **Production (Render)**: `https://hiero-gateway.onrender.com`

---

## 🔧 Step-by-Step: Update GitHub OAuth App

### **Step 1: Access GitHub Developer Settings**

1. Go to: https://github.com/settings/developers
2. Click on **"OAuth Apps"** in the left sidebar
3. Find your OAuth App in the list (or create a new one if needed)
4. Click on the app name to edit it

### **Step 2: Update Application Settings**

#### **Homepage URL:**
```
https://hiero-gateway.onrender.com
```
or for local development:
```
http://localhost:2816
```

#### **Authorization callback URL:**

You'll need to update this to your gateway URL. GitHub allows only ONE callback URL per OAuth App, so you have two options:

##### **Option 1: Use Production URL (Recommended)**
```
https://hiero-gateway.onrender.com/auth/github/callback
```

For local development, you'll need to create a separate OAuth App (see Step 3).

##### **Option 2: Use Local URL (For Development)**
```
http://localhost:2816/auth/github/callback
```

**Note:** For local development, you can't use `https://`, only `http://` on localhost.

### **Step 3: Create Separate OAuth Apps (Recommended Approach)**

Since GitHub only allows one callback URL per app, the best practice is to create TWO OAuth Apps:

#### **Production OAuth App:**
- **Application name**: `Hiero (Production)`
- **Homepage URL**: `https://hiero-gateway.onrender.com`
- **Authorization callback URL**: `https://hiero-gateway.onrender.com/auth/github/callback`
- **Client ID**: `Ov23lisLgHA4nfSmzV0a` (your current one)
- **Client Secret**: `f835f991d8421a0c6a6f9be153c0457489a9735b` (your current one)

#### **Development OAuth App:**
- **Application name**: `Hiero (Development)`
- **Homepage URL**: `http://localhost:2816`
- **Authorization callback URL**: `http://localhost:2816/auth/github/callback`
- **Client ID**: (will be generated)
- **Client Secret**: (will be generated)

### **Step 4: Update Your .env File**

If you created separate OAuth Apps, update your `.env`:

```env
# Production GitHub OAuth (Render)
GITHUB_CLIENT_ID=Ov23lisLgHA4nfSmzV0a
GITHUB_CLIENT_SECRET=f835f991d8421a0c6a6f9be153c0457489a9735b
GITHUB_CALLBACK_URL=https://hiero-gateway.onrender.com/auth/github/callback

# Development GitHub OAuth (Local)
LOCAL_GITHUB_CLIENT_ID=<your-dev-client-id>
LOCAL_GITHUB_CLIENT_SECRET=<your-dev-client-secret>
LOCAL_GITHUB_CALLBACK_URL=http://localhost:2816/auth/github/callback
```

Then update `routes/auth.js` to use local credentials when available:

```javascript
// GitHub Auth
passport.use(new GitHubStrategy({
    clientID: process.env.LOCAL_GITHUB_CLIENT_ID || process.env.GITHUB_CLIENT_ID || 'dummy',
    clientSecret: process.env.LOCAL_GITHUB_CLIENT_SECRET || process.env.GITHUB_CLIENT_SECRET || 'dummy',
    callbackURL: process.env.LOCAL_GITHUB_CALLBACK_URL || process.env.GITHUB_CALLBACK_URL || `${PUBLIC_URL}/auth/github/callback`,
}, ...
```

### **Step 5: Save Changes**

1. Click **"Update application"** at the bottom
2. Changes are applied immediately

---

## ✅ Verification Checklist

After updating GitHub OAuth App:

- [ ] Authorization callback URL updated to gateway URL
- [ ] Homepage URL updated to gateway URL
- [ ] Client ID and Client Secret copied to `.env` file
- [ ] Changes saved successfully
- [ ] Created separate OAuth App for local development (optional but recommended)

---

## 🔍 How to Test

### **Local Testing:**

1. Restart your gateway server:
   ```bash
   lsof -ti :2816 | xargs kill -9 && node gateway.js
   ```

2. Open browser and go to: `http://localhost:2816/auth/github`

3. You should be redirected to GitHub authorization page

4. Click "Authorize" to grant access

5. You should be redirected back to: `http://localhost:2816/auth/github/callback`

6. Then redirected to: `http://localhost:2816/dashboard?token=...`

### **Production Testing (Render):**

1. Deploy your gateway to Render

2. Ensure environment variables are set on Render:
   - `GITHUB_CLIENT_ID`
   - `GITHUB_CLIENT_SECRET`
   - `GITHUB_CALLBACK_URL=https://hiero-gateway.onrender.com/auth/github/callback`
   - `PUBLIC_URL=https://hiero-gateway.onrender.com`

3. Open browser and go to: `https://hiero-gateway.onrender.com/auth/github`

4. Complete OAuth flow

5. Verify successful redirect to dashboard

---

## 🐛 Troubleshooting

### **Error: "The redirect_uri MUST match the registered callback URL for this application"**

**Cause:** The callback URL in your request doesn't match the one registered in GitHub OAuth App settings.

**Solution:**
1. Check the URL shown in the error message
2. Update the "Authorization callback URL" in GitHub OAuth App settings to match exactly
3. Remember: GitHub is strict about URL matching (no trailing slashes, exact protocol, etc.)

### **Error: "Bad verification code"**

**Cause:** The OAuth flow was interrupted or the code expired.

**Solution:**
1. Clear browser cookies
2. Try the OAuth flow again
3. Make sure your gateway server is running continuously during the OAuth flow

### **Error: "Application suspended"**

**Cause:** Your GitHub OAuth App might be suspended or misconfigured.

**Solution:**
1. Check your GitHub email for any suspension notices
2. Review GitHub's OAuth App policies
3. Contact GitHub Support if needed

### **Error: "Cannot GET /auth/github/callback"**

**Cause:** The gateway isn't handling the OAuth callback route.

**Solution:**
1. Verify `routes/auth.js` is mounted in `gateway.js`: `app.use('/', authRoutes);`
2. Check if Passport is initialized: `app.use(passport.initialize());`
3. Restart the gateway server

---

## 📝 Quick Reference

### **Your Current OAuth Credentials:**
- **Client ID**: `Ov23lisLgHA4nfSmzV0a`
- **Client Secret**: `f835f991d8421a0c6a6f9be153c0457489a9735b`

### **Callback URLs to Register:**
- **Local**: `http://localhost:2816/auth/github/callback`
- **Render**: `https://hiero-gateway.onrender.com/auth/github/callback`

### **Environment Variables (.env):**
```env
PORT=2816
GITHUB_CLIENT_ID=Ov23lisLgHA4nfSmzV0a
GITHUB_CLIENT_SECRET=f835f991d8421a0c6a6f9be153c0457489a9735b
PUBLIC_URL=https://hiero-gateway.onrender.com
GITHUB_CALLBACK_URL=https://hiero-gateway.onrender.com/auth/github/callback
LOCAL_GITHUB_CALLBACK_URL=http://localhost:2816/auth/github/callback
```

---

## 🎉 Success Criteria

After completing these steps:

✅ Local OAuth login works on `http://localhost:2816/auth/github`
✅ Production OAuth login works on `https://hiero-gateway.onrender.com/auth/github`
✅ No more "redirect_uri mismatch" errors
✅ Users successfully redirected to dashboard after login
✅ JWT token properly generated and included in redirect

---

## 🔒 Security Best Practices

1. **Never commit OAuth secrets to Git**: Keep `.env` in `.gitignore`
2. **Rotate secrets regularly**: Generate new Client Secrets periodically
3. **Use separate apps for dev/prod**: Isolate development and production environments
4. **Limit OAuth scope**: Only request the permissions you actually need (we use `user:email`)
5. **Validate state parameter**: Consider adding CSRF protection to OAuth flows

---

## 📞 Need Help?

If you encounter issues:

1. Check the browser console for errors
2. Check the gateway server logs for errors
3. Verify all environment variables are loaded correctly
4. Make sure the gateway is running on the correct port
5. Clear browser cache and cookies, then try again
6. Check GitHub OAuth App settings match your callback URLs exactly
