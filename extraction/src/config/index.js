const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

// Load environment variables with fallback hierarchy:
// 1. Current directory extraction/.env
// 2. Parent directory ../.env
const localEnvPath = path.resolve(__dirname, '../../.env');
const parentEnvPath = path.resolve(__dirname, '../../../.env');

if (fs.existsSync(localEnvPath)) {
    dotenv.config({ path: localEnvPath });
} else if (fs.existsSync(parentEnvPath)) {
    dotenv.config({ path: parentEnvPath });
} else {
    dotenv.config();
}

const config = {
    port: parseInt(process.env.EXTRACTION_PORT || process.env.PORT, 10) || 4040,
    nodeEnv: process.env.NODE_ENV || 'development',
    groq: {
        apiKey: process.env.GROQ_API_KEY || '',
        primaryModel: process.env.GROQ_PRIMARY_MODEL || 'openai/gpt-oss-120b',
        // NOTE: these must be live Groq model ids. A bad id makes the whole
        // chain 404 and silently drops the import to the regex parser.
        fallbackModels: (process.env.GROQ_FALLBACK_MODELS || 'openai/gpt-oss-20b,llama-3.3-70b-versatile')
            .split(',')
            .map(m => m.trim())
            .filter(Boolean),
        temperature: 0.05,
        maxTokens: 8192,
        timeoutMs: 45000,
        maxRetries: 3
    },
    upload: {
        maxSizeBytes: (parseInt(process.env.MAX_FILE_SIZE_MB, 10) || 15) * 1024 * 1024,
        allowedMimeTypes: [
            'application/pdf',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/msword',
            'image/png',
            'image/jpeg',
            'image/webp',
            'text/plain'
        ],
        allowedExtensions: ['.pdf', '.docx', '.doc', '.png', '.jpg', '.jpeg', '.webp', '.txt']
    }
};

module.exports = config;
