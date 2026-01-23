require('dotenv').config();

console.log('🚀 Starting server...');
console.log('Environment check:');
console.log('- OPENROUTER_API_KEY:', process.env.OPENROUTER_API_KEY ? 'Set' : 'Missing');
console.log('- YOUTUBE_API_KEY:', process.env.YOUTUBE_API_KEY ? 'Set' : 'Missing');

// Add error handlers
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const upload = multer({ dest: 'uploads/' });
const fs = require('fs');

console.log('✅ All modules loaded successfully');

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

const app = express();
app.use(cors());
app.use(bodyParser.json());

console.log('✅ Express app configured');

// Helper function for fetch calls
async function fetchData(url, options = {}) {
  const fetch = (await import('node-fetch')).default;
  return fetch(url, options);
}

// Simple endpoint for testing
app.get('/health', (req, res) => {
  console.log('Health check requested');
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Simple analysis endpoint for testing
app.post('/api/analyze', upload.fields([{ name: 'resume' }, { name: 'jd' }]), async (req, res) => {
  try {
    console.log('🔥 Analysis endpoint called');
    
    // Return simple mock data for now
    const mockData = {
      success: true,
      data: {
        score: 75,
        missingSkills: ['Python', 'Machine Learning'],
        skillToLearnFirst: 'Python',
        projectSuggestions: ['Build a Web Scraper', 'Create a Data Dashboard'],
        videos: {},
        problems: {}
      }
    };
    
    console.log('✅ Returning mock analysis data');
    res.json(mockData);
  } catch (error) {
    console.error('❌ Analysis error:', error);
    res.status(500).json({ error: 'Analysis failed' });
  }
});

const PORT = 5001;
console.log(`🌐 Starting server on port ${PORT}...`);

app.listen(PORT, () => {
  console.log(`✅ Analysis server running on port ${PORT}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  console.log(`🔗 Analysis endpoint: http://localhost:${PORT}/api/analyze`);
});
