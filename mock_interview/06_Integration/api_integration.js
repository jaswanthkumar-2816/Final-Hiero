/**
 * 06_Integration — Hiero Mock Interview
 * ─────────────────────────────────────────────────────────────
 * Backend API routes that power the Mock Interview feature.
 * Two endpoints:
 *  1. POST /api/interview/chat  → in gateway.js (Groq AI relay)
 *  2. GET  /api/resume/data     → in routes/resume.js
 *
 * This file documents both integrations in one place.
 * ─────────────────────────────────────────────────────────────
 */

// ═══════════════════════════════════════════════════════════════
// ENDPOINT 1: POST /api/interview/chat  (in gateway.js)
// ═══════════════════════════════════════════════════════════════
//
// Purpose: Acts as a secure relay between the browser and Groq API.
// The API key never leaves the server.
//
// Request body:
//   { messages: [{role: "system"|"user"|"assistant", content: string}] }
//
// Response:
//   { choices: [{ message: { content: string } }] }
//

const express = require('express');
const axios = require('axios');
require('dotenv').config();

// ── Groq Interview Chat Handler ───────────────────────────────
// Add this route inside gateway.js Express app:

/*
app.post('/api/interview/chat', async (req, res) => {
  const { messages } = req.body;
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'messages array required' });
  }

  try {
    const response = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: process.env.AI_MODEL || 'llama-3.3-70b-versatile',
        messages: messages,
        max_tokens: 300,
        temperature: 0.7,
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    res.json(response.data);
  } catch (err) {
    console.error('[Interview API] Groq error:', err.response?.data || err.message);
    res.status(500).json({ error: 'AI service unavailable' });
  }
});
*/


// ═══════════════════════════════════════════════════════════════
// ENDPOINT 2: GET /api/resume/data  (in routes/resume.js)
// ═══════════════════════════════════════════════════════════════
//
// Purpose: Returns the authenticated user's resume JSON for
// the mock interview to use when building AI question prompts.
//
// Auth: JWT Bearer token (same token used for dashboard)
//
// Response:
//   { success: true, data: { name, skills, projects, experience, ... } }
//   { success: false, message: "No resume found" }
//

/*
// Add this to routes/resume.js:

router.get('/data', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id || req.user.userId;
    const resumeRecord = await Resume.findOne({ userId });

    if (!resumeRecord) {
      return res.json({ success: false, message: 'No resume found for this user.' });
    }

    res.json({ success: true, data: resumeRecord.data });
  } catch (err) {
    console.error('[Resume Data] Error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});
*/


// ═══════════════════════════════════════════════════════════════
// ENVIRONMENT VARIABLES REQUIRED (.env)
// ═══════════════════════════════════════════════════════════════
//
// GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxxxxxxxxxx
// AI_MODEL=llama-3.3-70b-versatile
// JWT_SECRET=your_jwt_secret_here
//


// ═══════════════════════════════════════════════════════════════
// FRONTEND INTEGRATION (how mock-interview.html calls these)
// ═══════════════════════════════════════════════════════════════
//
// 1. Resume fetch (on sensor calibration stage):
//    fetch('/api/resume/data', {
//      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
//    })
//
// 2. AI chat (on each user answer):
//    fetch('/api/interview/chat', {
//      method: 'POST',
//      headers: { 'Content-Type': 'application/json' },
//      body: JSON.stringify({ messages: conversationHistory })
//    })
//


// ═══════════════════════════════════════════════════════════════
// DATA FLOW DIAGRAM
// ═══════════════════════════════════════════════════════════════
//
//  Browser (mock-interview.html)
//       │
//       ├─ GET /api/resume/data ──► routes/resume.js ──► MongoDB ──► resume JSON
//       │
//       └─ POST /api/interview/chat ──► gateway.js ──► Groq API ──► AI response
//                                              │
//                                         (API key kept secret server-side)
//
