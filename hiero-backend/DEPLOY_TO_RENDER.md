# 🚀 Deploy Resume Backend (Port 5003) to Render

## ✅ Your Code is Ready!

Your `server.js` already has the correct configuration:
```javascript
const PORT = process.env.PORT || 5003;
app.listen(PORT, () => logger.info(`🚀 Server running on port ${PORT}`));
```

This means:
- **Localhost**: Uses port `5003`
- **Render**: Uses Render's assigned port automatically

---

## 📋 Step-by-Step Deployment

### 1️⃣ Push to GitHub

```bash
cd "/Users/jaswanthkumar/Desktop/shared folder/hiero backend"

# Initialize git if not done
git init

# Add all files
git add .

# Commit
git commit -m "Resume backend ready for Render deployment"

# Create a repo on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git branch -M main
git push -u origin main
```

### 2️⃣ Create Web Service on Render

1. Go to: https://dashboard.render.com
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub account
4. Select your repository
5. Configure:

```
Name:                 hiero-resume-backend
Environment:          Node
Region:               Choose closest to you
Branch:               main
Build Command:        npm install
Start Command:        npm start
Instance Type:        Free
```

### 3️⃣ Add Environment Variables

Click **"Environment"** tab and add:

```
NODE_ENV=production
JWT_SECRET=your-random-secret-string-here
```

**Optional** (if using these features):
```
MONGODB_URI=your-mongodb-connection-string
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
```

### 4️⃣ Deploy!

Click **"Create Web Service"**

Render will:
1. Clone your repo
2. Run `npm install`
3. Start with `npm start` (runs `node server.js`)
4. Assign a port (Render sets `process.env.PORT`)
5. Give you a URL like: `https://hiero-resume-backend.onrender.com`

**Deployment takes ~5 minutes**

---

## 🧪 Test Your Deployment

After deployment completes:

```bash
# Test health endpoint
curl https://YOUR-APP-NAME.onrender.com/health

# Should return:
{
  "status": "ok",
  "message": "Backend server is running",
  "timestamp": "2025-11-17T...",
  "port": "10000"
}
```

---

## 🔗 Update Frontend to Use Render URL

Once deployed, update your `resume-builder.html`:

```javascript
// OLD (local only):
const BACKEND_URL = "http://localhost:5003";

// NEW (works everywhere):
const BACKEND_URL = "https://YOUR-APP-NAME.onrender.com";
```

Or make it **smart** (works both locally and via Render):

```javascript
function getBackendURL() {
  const hostname = window.location.hostname;
  
  // Local development
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://localhost:5003';
  }
  
  // Production (phone access via ngrok/network)
  return 'https://YOUR-APP-NAME.onrender.com';
}

const BACKEND_URL = getBackendURL();
```

---

## 📝 What Gets Deployed

### Routes Available:
- ✅ `GET /health` - Health check
- ✅ `POST /generate-resume` - Generate resume
- ✅ `POST /download-resume` - Download PDF
- ✅ `POST /preview-resume` - Preview HTML
- ✅ `POST /api/auth/signup` - User signup
- ✅ `POST /api/auth/login` - User login
- ✅ `GET /templates/previews/*` - Template images

### Dependencies Installed:
```json
{
  "express": "^4.18.2",
  "puppeteer": "^24.29.1",
  "pdfkit": "^0.17.2",
  "winston": "^3.8.2",
  "bcrypt": "^6.0.0",
  "jsonwebtoken": "^9.0.0",
  "mongoose": "^8.0.0",
  "multer": "^1.4.5-lts.1",
  "cors": "^2.8.5",
  "dotenv": "^16.0.3"
}
```

---

## ⚠️ Important Notes

### Free Tier Limitations:
- ✅ 750 hours/month free
- ⚠️ Spins down after 15 min of inactivity
- ⚠️ First request after sleep takes ~30 seconds

### Puppeteer on Render:
Puppeteer (for PDF generation) works on Render's free tier! ✅

### Storage:
- Files in `/temp` are **ephemeral** (deleted on restart)
- That's OK for resume generation (temporary files)

---

## 🔥 Quick Start (Copy-Paste)

```bash
# 1. Navigate to backend
cd "/Users/jaswanthkumar/Desktop/shared folder/hiero backend"

# 2. Initialize and push to GitHub
git init
git add .
git commit -m "Deploy to Render"
git remote add origin https://github.com/YOUR_USERNAME/hiero-backend.git
git push -u origin main

# 3. Go to Render dashboard
open https://dashboard.render.com

# 4. Create Web Service → Connect repo → Deploy!
```

---

## ✅ After Deployment Checklist

- [ ] Deployment status shows "Live"
- [ ] Health check returns JSON: `curl https://your-app.onrender.com/health`
- [ ] Update `BACKEND_URL` in `resume-builder.html`
- [ ] Test resume download works from phone
- [ ] Add Render URL to CORS if needed

---

## 🎯 Result

After deployment:

### Your Computer:
```
Uses: http://localhost:5003 (fast, local)
```

### Friend's Phone:
```
Uses: https://your-app.onrender.com (deployed, accessible)
```

**Both work!** 🎉

---

## 🆘 Troubleshooting

### "Application failed to respond"
- Check logs in Render dashboard
- Verify `npm start` runs `node server.js`
- Check environment variables are set

### "Cannot find module"
- Check `package.json` includes all dependencies
- Verify `type: "module"` if using ES6 imports

### PDF Generation Slow
- Render free tier has limited CPU
- Consider upgrading to Starter plan ($7/month) for faster PDF generation

---

## 📞 Need Help?

1. Check Render logs: Dashboard → Your Service → Logs
2. Test locally first: `npm start` (should work on localhost:5003)
3. Check health endpoint returns JSON

**You're ready to deploy!** 🚀
