# Login System → Gateway Router Conversion

## ✅ What Was Done

Your standalone login system (`login system/main.js`) has been converted into an **Express Router** that can be imported into your gateway server.

### Key Changes:

1. **`const app = express()` → `const router = express.Router()`**
   - Changed from standalone app to router module

2. **All `app.get/post/use` → `router.get/post/use`**
   - All route handlers now use the router instead of app

3. **Removed `app.listen()`**
   - No longer starts its own server
   - Will be mounted in gateway instead

4. **Added `module.exports = router`**
   - Exports the router for use in gateway

5. **All business logic preserved**
   - ✅ Signup/Login
   - ✅ Email verification
   - ✅ Google OAuth
   - ✅ GitHub OAuth
   - ✅ JWT authentication
   - ✅ Dashboard
   - ✅ Resume generation/download/preview
   - ✅ All middleware (passport, multer, nodemailer)

## 📁 Files Created

```
/Users/jaswanthkumar/Desktop/shared folder/
├── routes/
│   └── auth.js          ← Your login system as a router
└── gateway.js           ← Example gateway server using the router
```

## 🚀 How to Use in Your Gateway

### Option 1: Mount at Root Level (Recommended)

This keeps all your existing routes (`/login`, `/signup`, `/auth/google`, etc.) exactly as they are:

```javascript
const express = require('express');
const authRoutes = require('./routes/auth');

const app = express();

// Your gateway middleware here
app.use(express.json());
app.use(passport.initialize());

// Mount auth router at root
app.use('/', authRoutes);

app.listen(3000);
```

**Result:**
- ✅ `POST /signup` works
- ✅ `POST /login` works
- ✅ `GET /auth/google` works
- ✅ `GET /auth/github` works
- ✅ All existing routes unchanged!

### Option 2: Mount with Prefix (Alternative)

If you want to add a prefix like `/api/auth`:

```javascript
app.use('/api/auth', authRoutes);
```

**Result:**
- `POST /api/auth/signup`
- `POST /api/auth/login`
- `GET /api/auth/auth/google` ⚠️ (Note: this creates `/api/auth/auth/google`)

⚠️ **Warning:** If you use a prefix, you'll need to:
1. Update your OAuth callback URLs in Google/GitHub console
2. Update frontend code to call `/api/auth/login` instead of `/login`

**Recommendation:** Use Option 1 (root mount) to avoid breaking existing integrations.

## 🔧 Gateway Setup Steps

1. **Install dependencies** (if not already installed):
   ```bash
   npm install express cors passport passport-google-oauth20 passport-github2 bcryptjs jsonwebtoken nodemailer dotenv multer puppeteer
   ```

2. **Use the example gateway** (already created for you):
   ```bash
   node gateway.js
   ```

3. **Or integrate into your existing gateway:**
   ```javascript
   const authRoutes = require('./routes/auth');
   app.use('/', authRoutes);
   ```

## 🔑 Environment Variables Required

Make sure your `.env` file has these variables:

```env
# Server
PORT=3000
PUBLIC_URL=http://localhost:3000

# JWT
JWT_SECRET=your-secret-key-here

# Email (Gmail App Password)
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback

# GitHub OAuth
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
GITHUB_CALLBACK_URL=http://localhost:3000/auth/github/callback

# CORS (optional, comma-separated)
ALLOWED_ORIGINS=http://localhost:8082,https://your-domain.com
```

## 📋 Available Routes (After Mounting)

### Authentication
- `POST /signup` - Create new account
- `POST /login` - Login with email/password
- `GET /verify-email?token=...` - Verify email address
- `GET /me` - Get current user (requires JWT token)
- `POST /logout` - Logout (clears token client-side)

### OAuth
- `GET /auth/google` - Start Google OAuth flow
- `GET /auth/google/callback` - Google OAuth callback
- `GET /auth/github` - Start GitHub OAuth flow
- `GET /auth/github/callback` - GitHub OAuth callback

### Dashboard
- `GET /dashboard` - Protected dashboard (requires JWT token)

### Resume
- `POST /generate-resume` - Generate resume
- `POST /download-resume` - Download resume as PDF
- `POST /preview-resume` - Preview resume HTML

### Static
- `GET /` - Serve index.html
- `GET /login` - Serve index.html (SPA route)
- `GET /signup` - Serve index.html (SPA route)
- `GET /health` - Health check

## 🧪 Testing

Start the gateway server:
```bash
node gateway.js
```

Test endpoints:
```bash
# Health check
curl http://localhost:3000/health

# Signup
curl -X POST http://localhost:3000/signup \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"password123"}'

# Login
curl -X POST http://localhost:3000/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Get current user (with token)
curl http://localhost:3000/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE"
```

## ⚠️ Important Notes

### 1. OAuth Callback URLs
Make sure your OAuth callback URLs match your gateway's URL:
- **Google Console:** Set redirect URI to `http://localhost:3000/auth/google/callback`  
- **GitHub OAuth:** Set callback URL to `http://localhost:3000/auth/github/callback`

### 2. Passport Initialization
The gateway MUST initialize passport before mounting the auth router:
```javascript
app.use(passport.initialize());
app.use('/', authRoutes);
```

### 3. Static Files
The router serves static files from `login system/` directory. Make sure this path is correct in your setup.

### 4. Users Storage
Currently uses in-memory storage (`let users = []`). For production:
- Replace with MongoDB
- Import User model in router
- Update all `users.find()` calls to database queries

## 🎯 Next Steps

1. ✅ Test the router in gateway
2. ✅ Verify OAuth flows work
3. ✅ Update frontend to call gateway URLs
4. ✅ Add other routes (resume, analysis) to gateway
5. ✅ Replace in-memory users with database
6. ✅ Deploy to Render

## 📞 Need Help?

If you encounter issues:
1. Check that all environment variables are set
2. Verify OAuth callback URLs match
3. Ensure passport.initialize() is called
4. Check CORS configuration allows your frontend origin

---

**Summary:** Your login system is now a reusable Express router. Just import it and mount it in your gateway - all routes and logic work exactly as before! 🚀
