# 08_Deployment — Hiero Mock Interview

## Prerequisites

Make sure these are set in your root `.env`:
```env
GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxxxxxxxxxx
AI_MODEL=llama-3.3-70b-versatile
JWT_SECRET=your_jwt_secret_here
MONGODB_URI=mongodb+srv://...   # (for resume data)
```

## Files to Deploy

| File | Location in Project |
|------|--------------------|
| Mock Interview UI | `hiero-prototype/jss/hiero/hiero-last/public/mock-interview.html` |
| Interview Chat API | `gateway.js` → `POST /api/interview/chat` |
| Resume Data API | `routes/resume.js` → `GET /api/resume/data` |

## Run Locally
```bash
cd Final-Hiero
node gateway.js
# Open: http://localhost:2816/mock-interview.html
```

## CDN Dependencies (loaded in browser, no install needed)
```html
<!-- TensorFlow.js + BlazeFace face detection -->
<script src="https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.10.0/dist/tf.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/@tensorflow-models/blazeface@0.0.7/dist/blazeface.min.js"></script>

<!-- Inter font -->
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800" rel="stylesheet">

<!-- Font Awesome icons -->
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
```

## Deployment Checklist
- [ ] `GROQ_API_KEY` set and valid
- [ ] `JWT_SECRET` matches what was used to sign user tokens
- [ ] MongoDB connected (for resume fetching)
- [ ] `mock-interview.html` served as static file by gateway
- [ ] HTTPS enabled (required for camera/mic access on deployed URL)
- [ ] Test face detection on target device (desktop + mobile)

## HTTPS Note
> ⚠️ Camera and Microphone access is **blocked by browsers on HTTP**.
> When deploying to production (Render, Railway, Vercel, etc.),
> HTTPS is automatic. For local testing, `localhost` is always allowed.
