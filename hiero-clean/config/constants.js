/**
 * HIERO — Central Configuration Constants
 * All magic numbers, thresholds, and shared config live here.
 */

const path = require('path');

// ─── PATHS ──────────────────────────────────────────────
const ROOT_DIR = path.resolve(__dirname, '..');
const PUBLIC_DIR = path.join(__dirname, '..', 'public');
const UPLOADS_DIR = path.join(ROOT_DIR, 'uploads');
const TEMPLATES_DIR = path.join(ROOT_DIR, 'templates');

// ─── SERVER ─────────────────────────────────────────────
const PORT = process.env.PORT || 2816;
const PUBLIC_URL = process.env.PUBLIC_URL || `http://localhost:${PORT}`;

// ─── JWT / AUTH ─────────────────────────────────────────
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    console.error('⚠️  FATAL: JWT_SECRET environment variable is not set. Authentication will fail.');
}
const JWT_EXPIRY = '7d';

// ─── AI / LLM ──────────────────────────────────────────
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const AI_MODEL = process.env.AI_MODEL || 'llama-3.3-70b-versatile';
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

// ─── MASTERY THRESHOLDS ────────────────────────────────
const MASTERY = {
    PASS_THRESHOLD: 75,           // Default topic pass threshold (%)
    ASSESSMENT_READY: 60,         // Min masteryPct to unlock assessment
    PLACEMENT_HIGH: 80,           // Score to skip to topic 2
    PLACEMENT_MID: 40,            // Score for practice mode on topic 1
    RECENCY_DECAY_DAYS: 2,        // Mastery decays by 2% per day without assessment
};

// ─── LEARNING TIERS ────────────────────────────────────
const TIERS = {
    BOUNDARIES: [0, 40, 60, 100],
    NAMES: ['foundational', 'core', 'advanced', 'masterclass'],
    QUIZ_PASSING_SCORE: 70,
};

// ─── SUPPORTED LANGUAGES ───────────────────────────────
const LANGUAGES = {
    en: { name: 'English',   native: 'English',      flag: '🇬🇧' },
    hi: { name: 'Hindi',     native: 'हिंदी',         flag: '🇮🇳' },
    te: { name: 'Telugu',    native: 'తెలుగు',       flag: '🇮🇳' },
    ta: { name: 'Tamil',     native: 'தமிழ்',        flag: '🇮🇳' },
    kn: { name: 'Kannada',   native: 'ಕನ್ನಡ',       flag: '🇮🇳' },
    ml: { name: 'Malayalam', native: 'മലയാളം',      flag: '🇮🇳' },
};

// ─── CORS ──────────────────────────────────────────────
const CORS_ORIGINS = [
    'http://localhost:2816',
    'http://localhost:5173',
    'http://localhost:3000',
    process.env.PUBLIC_URL,
].filter(Boolean);

// ─── EXPORTS ───────────────────────────────────────────
module.exports = {
    ROOT_DIR,
    PUBLIC_DIR,
    UPLOADS_DIR,
    TEMPLATES_DIR,
    PORT,
    PUBLIC_URL,
    JWT_SECRET,
    JWT_EXPIRY,
    GROQ_API_KEY,
    AI_MODEL,
    YOUTUBE_API_KEY,
    MASTERY,
    TIERS,
    LANGUAGES,
    CORS_ORIGINS,
};
