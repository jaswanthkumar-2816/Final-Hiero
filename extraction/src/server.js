const express = require('express');
const cors = require('cors');
const path = require('path');
const config = require('./config');
const apiRoutes = require('./routes/api');

const app = express();
const PORT = config.port;

// CORS setup allowing all local dev ports and frontend origins
app.use(cors({
    origin: '*',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
}));

// Body Parsers
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Request Logger
app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        console.log(`[EXTRACTION-API] ${req.method} ${req.originalUrl} - ${res.statusCode} (${duration}ms)`);
    });
    next();
});

// Serve static frontend tester
const publicDir = path.join(__dirname, '../public');
app.use(express.static(publicDir));

// Mount Routes under /api/extract and root
app.use('/api/extract', apiRoutes);
app.use('/api', apiRoutes);
app.use('/', apiRoutes);

// Root tester page
app.get(['/', '/index.html', '/tester'], (req, res) => {
    res.sendFile(path.join(publicDir, 'index.html'));
});

// Resume Comparison page
app.get(['/compare', '/compare.html'], (req, res) => {
    res.sendFile(path.join(publicDir, 'compare.html'));
});

// JSON info route on /api
app.get('/api', (req, res) => {
    res.json({
        service: 'Groq AI Resume Extraction Backend',
        status: 'online',
        port: PORT,
        endpoints: {
            upload: 'POST /api/extract/upload (multipart/form-data with "resume" field)',
            text: 'POST /api/extract/text ({ text: "resume text..." })',
            health: 'GET /api/extract/health'
        },
        documentation: 'See README.md for complete API schema & integration guides'
    });
});

// Global Error Handler
app.use((err, req, res, next) => {
    console.error('[EXTRACTION-SERVER] Unhandled error:', err);
    res.status(500).json({
        success: false,
        error: err.message || 'Internal Server Error'
    });
});

// Start Server
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`
╔═══════════════════════════════════════════════════════════════════════════════════╗
║                                                                                   ║
║   🚀 GROQ RESUME DETAILS EXTRACTION BACKEND ONLINE                                ║
║                                                                                   ║
║   🔗 Server Port:    http://localhost:${PORT}                                         ║
║   📄 Upload API:     POST http://localhost:${PORT}/api/extract/upload                 ║
║   📝 Text API:       POST http://localhost:${PORT}/api/extract/text                   ║
║   🩺 Health Check:   GET  http://localhost:${PORT}/api/extract/health                 ║
║                                                                                   ║
║   🧠 Primary Model:  ${config.groq.primaryModel.padEnd(52)} ║
║   ✨ Extra Headings: Automatic detection & form formatting into additionalDetails ║
║                                                                                   ║
╚═══════════════════════════════════════════════════════════════════════════════════╝
`);
    });
}

module.exports = app;
