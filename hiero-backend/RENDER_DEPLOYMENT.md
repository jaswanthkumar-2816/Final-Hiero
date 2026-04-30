# Deploy Backend to Render

## ✅ Your Code is Ready!

Your `server.js` already has this line:
```javascript
const PORT = process.env.PORT || 5003;
app.listen(PORT, () => logger.info(`🚀 Server running on port ${PORT}`));
```

This means:
- **Localhost**: Runs on `5003` automatically
- **Render**: Uses Render's assigned port automatically

---

## 🚀 Deployment Steps

### 1. Push Code to GitHub

```bash
cd "/Users/jaswanthkumar/Desktop/shared folder/hiero backend"

# Initialize git if not already done
git init
git add .
git commit -m "Ready for Render deployment"

# Create repo on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

### 2. Create Web Service on Render

1. Go to https://dashboard.render.com
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository
4. Configure:

```
Name:              hiero-resume-backend
Environment:       Node
Region:            Choose closest to you
Branch:            main
Build Command:     npm install
Start Command:     npm start
Instance Type:     Free
```

### 3. Add Environment Variables

In Render dashboard, add these:

```
JWT_SECRET              = your-secure-random-secret-here
MONGODB_URI            = your-mongodb-connection-string (optional)
NODE_ENV               = production
```

**Optional (if using these features):**
```
YOUTUBE_API_KEY        = your-youtube-api-key
OPENROUTER_API_KEY     = your-openrouter-api-key
```

### 4. Deploy!

Click **"Create Web Service"**

Render will:
1. Clone your repo
2. Run `npm install`
3. Start with `npm start` (which runs `node server.js`)
4. Assign a port automatically
5. Give you a public URL like: `https://hiero-resume-backend.onrender.com`

---

## 📋 package.json Check

Make sure your `package.json` has:

```json
{
  "name": "hiero-backend",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "start": "node server.js"
  },
  "dependencies": {
    "express": "^4.21.2",
    "cors": "^2.8.5",
    "mongoose": "^8.0.0",
    "winston": "^3.11.0",
    "multer": "^1.4.5-lts.1",
    "pdfkit": "^0.15.0",
    "puppeteer": "^23.0.0",
    "dotenv": "^16.4.5",
    "jsonwebtoken": "^9.0.2",
    "bcrypt": "^5.1.1"
  }
}
```

---

## 🧪 Testing

### Local Test (port 5003):
```bash
npm start
curl http://localhost:5003/health
```

### Render Test (after deployment):
```bash
curl https://YOUR-APP.onrender.com/health
```

Should return:
```json
{
  "status": "ok",
  "message": "Backend server is running",
  "timestamp": "2025-11-17T...",
  "port": 10000
}
```

---

## 🔗 Update Frontend

After deployment, update your frontend to use the Render URL:

**In your gateway or frontend config:**
```javascript
// Old:
const BACKEND_URL = 'http://localhost:5003';

// New:
const BACKEND_URL = 'https://YOUR-APP.onrender.com';
```

Or use environment variable:
```javascript
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5003';
```

---

## ⚡ How PORT Works

### Localhost (Development):
```javascript
process.env.PORT = undefined  // Not set
PORT = process.env.PORT || 5003  // Uses 5003
app.listen(5003)
```
**Result:** `http://localhost:5003`

### Render (Production):
```javascript
process.env.PORT = "10000"  // Render sets this
PORT = process.env.PORT || 5003  // Uses 10000
app.listen(10000)
```
**Result:** `https://your-app.onrender.com` (Render handles the routing)

---

## 📝 Summary

✅ Your code is **already ready** for deployment!
✅ No code changes needed - PORT handling is correct
✅ Just push to GitHub and create Render service
✅ Add environment variables on Render dashboard
✅ Deploy and get public URL

**That's it!** 🎉
