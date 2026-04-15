# 07_Testing — Hiero Mock Interview Test Guide

## Manual Test Checklist

### Stage 1: Welcome Screen
- [ ] Page loads with neural orb animation
- [ ] Background particle animation running
- [ ] "Begin Simulation" button works → advances to Stage 2

### Stage 2: Identity Capture
- [ ] Camera permission prompt appears on entering stage
- [ ] Live video feed shows in circular frame
- [ ] Scan line animation visible
- [ ] "Lock Identity" captures a still frame
- [ ] Captured photo shown, live feed hidden
- [ ] "Retake" returns to live feed
- [ ] "Authorize Sensors" → advances to Stage 3

### Stage 3: Sensor Calibration
- [ ] Camera chip shows PENDING → SYNCED on permission grant
- [ ] Mic chip shows PENDING → SYNCED on permission grant
- [ ] "Launch Neural Session" button disabled until both SYNCED
- [ ] Resume status shows "Loaded" if resume exists in account
- [ ] Resume shows "Unavailable" if no resume uploaded

### Stage 4: Interview Session
- [ ] Loading screen shows "SYNCING RESUME DATA" for ~2.5s
- [ ] Session camera (full screen) displays live feed
- [ ] HUD badge shows "LOADING FACE AI..." then "SCANNING..."
- [ ] After BlazeFace loads: badge shows "ID VERIFIED" when face detected
- [ ] Neural orb visible below camera
- [ ] AI speaks opening line in female voice
- [ ] Mic auto-starts after AI finishes speaking
- [ ] Tapping mic button toggles listening on/off
- [ ] Transcript box shows what user says in real-time
- [ ] AI responds to answers with next question
- [ ] Question progress dots fill (1 per answer, up to 5)
- [ ] Question counter updates "X / 5"

### Stage 4: Face Detection (3-Strike System)
- [ ] Cover camera or move face out of frame
- [ ] Badge changes to "FACE NOT DETECTED" (red)
- [ ] After ~7.5s away → Warning Toast slides in from top
- [ ] AI speaks: "Warning. Your face is not visible..."
- [ ] Strike pip 1 fills red in warning toast
- [ ] Warning count shows "1 / 3"
- [ ] Return face → badge returns to "ID VERIFIED"
- [ ] Second violation → "Warning 2 of 3 — FINAL CHANCE" toast
- [ ] Third violation → Security screen appears
- [ ] Security screen shows: SCORE: 0

### Stage 5: Audit Report
- [ ] Score (0-100) displayed in circle
- [ ] Executive feedback paragraph rendered
- [ ] Improvement tips listed if provided by AI
- [ ] "New Simulation" button reloads page correctly

---

## API Test

### Test /api/interview/chat
```bash
curl -X POST http://localhost:2816/api/interview/chat \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"Tell me about yourself"}]}'
```
Expected: `{ choices: [{ message: { content: "..." } }] }`

### Test /api/resume/data
```bash
curl http://localhost:2816/api/resume/data \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```
Expected: `{ success: true, data: { name: "...", skills: [...], ... } }`

---

## BlazeFace Detection Test
1. Start an interview session
2. Wait for "ID VERIFIED" to appear (model loaded)
3. Cover camera with hand → badge should turn red within 1.5s
4. Uncover → badge returns to green within 1.5s
5. Stay away for 7.5s → should trigger warning strike

---

## Known Limitations
- BlazeFace requires internet connection to load model from CDN (~4MB)
- Speech Recognition only works in Chrome, Edge, and Safari 14.5+
- If GROQ_API_KEY is expired/missing → interview chat will fail silently
