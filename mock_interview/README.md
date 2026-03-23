# 🎯 Hiero Mock Interview

Premium AI-powered mock interview simulation.

## Features
- **BlazeFace Face Detection** — Google's TensorFlow.js model detects if user is present
- **3-Strike Warning System** — warns verbally + toast notification, terminates on 3rd strike
- **Resume-Driven Questions** — AI reads uploaded resume and asks specific questions
- **Female AI Voice** — professional voice synthesis with real-time AI responses
- **Live Speech Transcript** — displays everything you say in real-time
- **5-Question Session** — structured interview with progress tracker
- **Scoring & Audit Report** — final score + executive analysis by Groq AI

## Files
| File | Description |
|------|-------------|
| `mock-interview.html` | Complete single-file frontend for the mock interview |

## Backend Dependencies
| Endpoint | File | Purpose |
|----------|------|---------|
| `POST /api/interview/chat` | `gateway.js` | Groq AI interview conversation |
| `GET /api/resume/data` | `routes/resume.js` | Fetch user's resume for AI context |

## Security Flow
```
Identity Capture → Hardware Sync → Session (BlazeFace monitoring)
  ↓ Face Missing 7.5s → Warning 1 (verbal + toast)
  ↓ Face Missing again → Warning 2 (final chance)  
  ↓ Face Missing again → Session TERMINATED, Score = 0
```

## Tech Stack
- TensorFlow.js + BlazeFace (face detection)
- Groq API / llama-3.3-70b (interview AI)
- Web Speech API (voice input/output)
- Vanilla HTML/CSS/JS
