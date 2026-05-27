# 🔗 OAuth URLs Quick Reference Card

## 📍 Your OAuth Callback URLs

### ✅ What to Add to Google Cloud Console

**Google Cloud Console**: https://console.cloud.google.com/apis/credentials

**Client ID**: `199127558872-r8b08p26i8sbjlfvo1tmrqruhq2m4ro6.apps.googleusercontent.com`

#### Authorized redirect URIs:
```
http://localhost:2816/auth/google/callback
https://hiero-gateway.onrender.com/auth/google/callback
```

#### Authorized JavaScript origins:
```
http://localhost:2816
https://hiero-gateway.onrender.com
```

---

### ✅ What to Add to GitHub OAuth App

**GitHub Developer Settings**: https://github.com/settings/developers

**Client ID**: `Ov23lisLgHA4nfSmzV0a`

#### Authorization callback URL:
```
Production: https://hiero-gateway.onrender.com/auth/github/callback
OR
Local: http://localhost:2816/auth/github/callback
```

**Note**: GitHub only allows ONE callback URL per app. Create separate apps for dev/prod.

---

## 🌐 All Your URLs at a Glance

### Local Development (Port 2816)

| Route | URL | Purpose |
|-------|-----|---------|
| **Homepage** | `http://localhost:2816/` | Landing page |
| **Signup** | `http://localhost:2816/signup` | POST - Create account |
| **Login** | `http://localhost:2816/login` | POST - Email/password login |
| **Verify Email** | `http://localhost:2816/verify-email` | GET - Email verification |
| **Google OAuth Start** | `http://localhost:2816/auth/google` | GET - Initiate Google login |
| **Google Callback** | `http://localhost:2816/auth/google/callback` | GET - Google redirect target |
| **GitHub OAuth Start** | `http://localhost:2816/auth/github` | GET - Initiate GitHub login |
| **GitHub Callback** | `http://localhost:2816/auth/github/callback` | GET - GitHub redirect target |
| **User Info** | `http://localhost:2816/me` | GET - Get current user (requires JWT) |
| **Dashboard** | `http://localhost:2816/dashboard` | Dashboard UI |

### Production - Render

| Route | URL | Purpose |
|-------|-----|---------|
| **Homepage** | `https://hiero-gateway.onrender.com/` | Landing page |
| **Signup** | `https://hiero-gateway.onrender.com/signup` | POST - Create account |
| **Login** | `https://hiero-gateway.onrender.com/login` | POST - Email/password login |
| **Verify Email** | `https://hiero-gateway.onrender.com/verify-email` | GET - Email verification |
| **Google OAuth Start** | `https://hiero-gateway.onrender.com/auth/google` | GET - Initiate Google login |
| **Google Callback** | `https://hiero-gateway.onrender.com/auth/google/callback` | GET - Google redirect target |
| **GitHub OAuth Start** | `https://hiero-gateway.onrender.com/auth/github` | GET - Initiate GitHub login |
| **GitHub Callback** | `https://hiero-gateway.onrender.com/auth/github/callback` | GET - GitHub redirect target |
| **User Info** | `https://hiero-gateway.onrender.com/me` | GET - Get current user (requires JWT) |
| **Dashboard** | `https://hiero-gateway.onrender.com/dashboard` | Dashboard UI |

---

## 🔑 OAuth Provider Settings

### Google OAuth 2.0

**Console**: https://console.cloud.google.com/apis/credentials

| Setting | Value |
|---------|-------|
| **Application Type** | Web application |
| **Client ID** | `199127558872-r8b08p26i8sbjlfvo1tmrqruhq2m4ro6.apps.googleusercontent.com` |
| **Client Secret** | `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` |
| **Authorized redirect URIs** | `http://localhost:2816/auth/google/callback`<br>`https://hiero-gateway.onrender.com/auth/google/callback` |
| **Authorized JavaScript origins** | `http://localhost:2816`<br>`https://hiero-gateway.onrender.com` |
| **Scopes** | `profile`, `email` |

### GitHub OAuth App

**Settings**: https://github.com/settings/developers

#### Production App
| Setting | Value |
|---------|-------|
| **Application Name** | Hiero (Production) |
| **Client ID** | `Ov23lisLgHA4nfSmzV0a` |
| **Client Secret** | `f835f991d8421a0c6a6f9be153c0457489a9735b` |
| **Homepage URL** | `https://hiero-gateway.onrender.com` |
| **Authorization callback URL** | `https://hiero-gateway.onrender.com/auth/github/callback` |
| **Scope** | `user:email` |

#### Development App (Optional - Create if needed)
| Setting | Value |
|---------|-------|
| **Application Name** | Hiero (Development) |
| **Client ID** | *Create new app to get this* |
| **Client Secret** | *Create new app to get this* |
| **Homepage URL** | `http://localhost:2816` |
| **Authorization callback URL** | `http://localhost:2816/auth/github/callback` |
| **Scope** | `user:email` |

---

## 📋 Environment Variables Reference

### Required in `.env` (Local)

```env
PORT=2816
JWT_SECRET=X7k9P!mQ2aL5vR8
GOOGLE_CLIENT_ID=199127558872-r8b08p26i8sbjlfvo1tmrqruhq2m4ro6.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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
GITHUB_CLIENT_ID=Ov23lisLgHA4nfSmzV0a
GITHUB_CLIENT_SECRET=f835f991d8421a0c6a6f9be153c0457489a9735b
EMAIL_USER=jaswanthkumarmuthoju@gmail.com
EMAIL_PASS=hnbe expk vrgs fbfg
PUBLIC_URL=https://hiero-gateway.onrender.com
GOOGLE_CALLBACK_URL=https://hiero-gateway.onrender.com/auth/google/callback
GITHUB_CALLBACK_URL=https://hiero-gateway.onrender.com/auth/github/callback
LOCAL_GOOGLE_CALLBACK_URL=http://localhost:2816/auth/google/callback
LOCAL_GITHUB_CALLBACK_URL=http://localhost:2816/auth/github/callback
```

### Required on Render (Production)

```env
# PORT is auto-assigned by Render
GOOGLE_CLIENT_ID=199127558872-r8b08p26i8sbjlfvo1tmrqruhq2m4ro6.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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
GITHUB_CLIENT_ID=Ov23lisLgHA4nfSmzV0a
GITHUB_CLIENT_SECRET=f835f991d8421a0c6a6f9be153c0457489a9735b
JWT_SECRET=X7k9P!mQ2aL5vR8
EMAIL_USER=jaswanthkumarmuthoju@gmail.com
EMAIL_PASS=hnbe expk vrgs fbfg
PUBLIC_URL=https://hiero-gateway.onrender.com
GOOGLE_CALLBACK_URL=https://hiero-gateway.onrender.com/auth/google/callback
GITHUB_CALLBACK_URL=https://hiero-gateway.onrender.com/auth/github/callback
```

**Note**: Do NOT set `LOCAL_*` variables on Render!

---

## 🧪 Testing URLs

### Test Google OAuth Locally
```
http://localhost:2816/auth/google
```

### Test GitHub OAuth Locally
```
http://localhost:2816/auth/github
```

### Test Google OAuth Production
```
https://hiero-gateway.onrender.com/auth/google
```

### Test GitHub OAuth Production
```
https://hiero-gateway.onrender.com/auth/github
```

---

## 🚨 Common Error Messages & Solutions

### "redirect_uri_mismatch"
**Fix**: Add the exact callback URL to OAuth provider settings
- Google: Check "Authorized redirect URIs"
- GitHub: Check "Authorization callback URL"

### "Cannot GET /auth/google/callback"
**Fix**: Restart gateway server
```bash
lsof -ti :2816 | xargs kill -9 && node gateway.js
```

### "Bad verification code"
**Fix**: Clear cookies and try OAuth flow again

### "Application suspended"
**Fix**: Check email from OAuth provider or contact support

---

## 📞 Where to Update Settings

| Provider | Where to Go | What to Update |
|----------|-------------|----------------|
| **Google** | https://console.cloud.google.com/apis/credentials | Authorized redirect URIs & JavaScript origins |
| **GitHub** | https://github.com/settings/developers | Authorization callback URL |
| **Render** | https://dashboard.render.com/ | Environment variables |

---

## ✅ Quick Checklist

Before testing, make sure:

- [ ] Google Cloud Console has both callback URLs (local + production)
- [ ] GitHub OAuth App has callback URL updated
- [ ] `.env` file has all required variables
- [ ] Gateway server is running on port 2816
- [ ] No other service is using port 2816
- [ ] Port 3000 is not in use (old auth server stopped)

---

## 🎯 Key Points to Remember

1. **Local port changed**: 3000 → 2816
2. **All OAuth callbacks now go to gateway**: No more separate auth server
3. **Same credentials**: Google and GitHub Client IDs/Secrets unchanged
4. **Only URLs changed**: Just update callback URLs in provider settings
5. **Frontend unchanged**: No code changes needed in frontend

---

*Last updated: 2025-12-30*
*Quick tip: Bookmark this page for easy reference!*
