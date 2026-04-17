/**
 * HIERO INTERVIEW TEST SERVER (Stand-alone)
 * Purpose: Isolate and test only the Mock Interview logic.
 * Port: 2817
 */
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const interviewRouter = require('./routes/interview');

const app = express();
const PORT = 2817;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static assets for the interview UI
app.use(express.static(path.join(__dirname, 'mock_interview')));

// Connect to MongoDB (Reuse existing DB)
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/hiero';
mongoose.connect(MONGODB_URI)
    .then(() => console.log('✅ AI Test Engine: Connected to MongoDB'))
    .catch(err => console.error('❌ AI Test Engine: MongoDB Connection Error', err));

// Mount the Interview Router
app.use('/api/interview', interviewRouter);

// Root route redirects to the interview UI
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'mock_interview', 'mock-interview.html'));
});

app.listen(PORT, () => {
    console.log(`\n🚀 HIERO INTERVIEW TEST SERVER LIVE AT: http://localhost:${PORT}`);
    console.log(`📂 UI Directory: ${path.join(__dirname, 'mock_interview')}`);
    console.log(`🤖 Logic Provider: routes/interview.js\n`);
});
