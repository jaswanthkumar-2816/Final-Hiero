require('dotenv').config();
console.log('Starting server...');
console.log('OPENROUTER_API_KEY:', process.env.OPENROUTER_API_KEY ? 'Set' : 'Not set');
console.log('YOUTUBE_API_KEY:', process.env.YOUTUBE_API_KEY ? 'Set' : 'Not set');

const express = require('express');
console.log('Express loaded');

const cors = require('cors');
console.log('CORS loaded');

const app = express();
console.log('Express app created');

app.use(cors());
console.log('CORS configured');

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const PORT = 5001;
app.listen(PORT, () => {
  console.log(`Analysis server running on port ${PORT}`);
});
