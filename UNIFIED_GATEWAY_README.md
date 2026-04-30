# Hiero Platform - Unified Gateway Setup

## 🚀 Quick Start

### Single Port Access
All services are now accessible through **port 2816** using the unified gateway.

### Start All Services

```bash
./start-all.sh
```

This will start:
- Login System (port 3000) - Internal
- Analysis Server (port 5001) - Internal  
- Resume Backend (port 5003) - Internal
- **Unified Gateway (port 2816)** - **Public Access**

### Access Your Application

Open your browser and navigate to:
```
http://localhost:2816
```

### Stop All Services

```bash
./stop-all.sh
```

## 📋 Service Architecture

```
┌─────────────────────────────────────────┐
│     Unified Gateway (Port 2816)         │
│                                         │
│  → Frontend: /                          │
│  → Login: /login, /signup, /auth/*     │
│  → Analysis: /api/analysis/*           │
│  → Resume: /api/resume/*               │
└─────────────────────────────────────────┘
           │
           ├─────→ Login System (3000)
           ├─────→ Analysis Server (5001)
           └─────→ Resume Backend (5003)
```

## 🔧 Manual Start (if scripts don't work)

### Terminal 1 - Login System
```bash
cd "login system"
node main.js
```

### Terminal 2 - Analysis Server
```bash
node simple-analysis-server.js
```

### Terminal 3 - Resume Backend
```bash
cd "hiero backend"
node server.js
```

### Terminal 4 - Unified Gateway
```bash
node gateway.js
```

## 📝 API Endpoints

All requests should go through `http://localhost:2816`:

### Authentication
- `POST /login` - User login
- `POST /signup` - User registration
- `POST /logout` - User logout
- `GET /auth/google` - Google OAuth
- `GET /auth/github` - GitHub OAuth

### Resume Management
- `POST /generate-resume` - Generate resume
- `POST /download-resume` - Download resume PDF
- `POST /preview-resume` - Preview resume
- `POST /api/resume/*` - Resume creation endpoints

### Analysis
- `POST /api/analysis/analyze-nontech` - Analyze resume vs job description

## 🎯 Features

✅ Single port access (2816)
✅ No CORS issues
✅ Centralized routing
✅ Easy deployment
✅ All services unified

## 🛠️ Troubleshooting

### Port Already in Use
```bash
# Kill process on port 2816
lsof -ti:2816 | xargs kill -9

# Or use the stop script
./stop-all.sh
```

### Check Service Health
```bash
# Login System
curl http://localhost:3000/health

# Analysis Server
curl http://localhost:5001/health

# Resume Backend
curl http://localhost:5003/api/resume/templates

# Gateway
curl http://localhost:2816
```

### View Logs
```bash
# All logs are in the logs/ directory
tail -f logs/gateway.log
tail -f logs/login.log
tail -f logs/analysis.log
tail -f logs/resume.log
```

## 📦 Dependencies

Make sure you have installed:
```bash
npm install compression http-proxy-middleware
```

## 🎨 Updated Files

The following files have been updated to use relative URLs:
- `public/login.html` - Uses `/login` instead of `http://localhost:3000/login`
- `public/index.html` - Uses `/dashboard`, `/logout` instead of full URLs
- `public/resume-builder.html` - Uses `/generate-resume`, `/download-resume`, `/preview-resume`

## 🌟 Benefits

1. **Single URL** - Share just `http://localhost:2816` with your team
2. **No CORS** - All requests to same origin
3. **Easy Deploy** - Deploy gateway + services together
4. **Load Balancing Ready** - Can add multiple backend instances
5. **Security** - Hide internal service ports from public

---

**Happy Building! 🚀**
