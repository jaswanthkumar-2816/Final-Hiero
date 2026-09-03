/**
 * HIERO — Shared Helper Functions
 * Pure functions used across multiple modules.
 */

const { MASTERY, TIERS, LANGUAGES } = require('../config/constants');

// ─── SKILL NORMALIZATION ───────────────────────────────
// Maps variations/abbreviations to canonical skill names
const SKILL_ALIASES = {
    'js': 'javascript',
    'ts': 'typescript',
    'react.js': 'react',
    'reactjs': 'react',
    'py': 'python',
    'ml': 'machine learning',
    'dl': 'deep learning',
    'node': 'nodejs',
    'node.js': 'nodejs',
    'ds': 'data science',
    'data structures': 'dsa',
    'algorithms': 'dsa',
    'data structures & algorithms': 'dsa',
};

function normalizeSkill(raw) {
    if (!raw) return '';
    const s = raw.toLowerCase().trim();
    // Direct alias match
    if (SKILL_ALIASES[s]) return SKILL_ALIASES[s];
    // Partial match
    for (const [alias, canonical] of Object.entries(SKILL_ALIASES)) {
        if (s.startsWith(alias) || s.includes(alias)) return canonical;
    }
    return s;
}

// ─── TIER CALCULATION ──────────────────────────────────
function calculateTier(score) {
    const s = Number(score) || 0;
    if (s <= TIERS.BOUNDARIES[1]) return TIERS.NAMES[0]; // foundational
    if (s <= TIERS.BOUNDARIES[2]) return TIERS.NAMES[1]; // core
    if (s < TIERS.BOUNDARIES[3])  return TIERS.NAMES[2]; // advanced
    return TIERS.NAMES[3]; // masterclass
}

// ─── MASTERY SCORE CALCULATION ─────────────────────────
function calcMasteryPct(progress) {
    const practiceAttempts = progress.practiceAttempts || [];
    const assessmentAttempts = progress.assessmentAttempts || [];

    // Average practice score
    const practiceScore = practiceAttempts.length > 0
        ? practiceAttempts.reduce((sum, a) => sum + (a.passedTests / Math.max(a.totalTests, 1) * 100), 0) / practiceAttempts.length
        : 0;

    // Latest assessment score
    const assessmentScore = assessmentAttempts.length > 0
        ? assessmentAttempts[assessmentAttempts.length - 1].score
        : 0;

    // Recency decay
    const daysSinceLastAssess = progress.lastAssessedAt
        ? (Date.now() - new Date(progress.lastAssessedAt).getTime()) / (1000 * 60 * 60 * 24)
        : 999;
    const recencyDecay = Math.max(0, 100 - (daysSinceLastAssess * MASTERY.RECENCY_DECAY_DAYS));

    return Math.min(100, Math.round(
        (practiceScore * 0.3) + (assessmentScore * 0.6) + (recencyDecay * 0.1)
    ));
}

// ─── LANGUAGE HELPERS ──────────────────────────────────
function getLanguageInfo(code) {
    return LANGUAGES[code] || LANGUAGES.en;
}

function langCodeFromName(name) {
    const map = {
        english: 'en', hindi: 'hi', telugu: 'te', tamil: 'ta', kannada: 'kn', malayalam: 'ml',
    };
    return map[(name || '').toLowerCase()] || 'en';
}

// ─── GENERIC QUESTION GENERATOR ────────────────────────
function generateGenericQuiz(topicName, skillName) {
    return [
        { question: `What is the primary purpose of ${topicName}?`, options: ['Data storage', 'Core functionality of the skill', 'UI rendering', 'Network communication'], correctIndex: 1, subConcept: 'fundamentals' },
        { question: `Which is a best practice in ${skillName}?`, options: ['Ignore errors', 'Write clean, documented code', 'Avoid testing', 'Use global variables'], correctIndex: 1, subConcept: 'best-practices' },
        { question: `A common use case for ${topicName} is?`, options: ['Printing documents', 'Solving real-world technical problems', 'Designing logos', 'Writing emails'], correctIndex: 1, subConcept: 'use-cases' },
        { question: `The first step when learning ${topicName} is?`, options: ['Advanced projects', 'Understanding core concepts', 'Deploying to production', 'Writing tests first'], correctIndex: 1, subConcept: 'learning-path' },
        { question: `${topicName} is most relevant for which role?`, options: ['Graphic Designer', 'Software/Tech roles', 'HR Manager', 'Sales Executive'], correctIndex: 1, subConcept: 'career-relevance' },
    ];
}

// ─── HTTP HELPERS ──────────────────────────────────────
function getUserId(req, fallbackUserId) {
    return req.user?.userId || req.user?.id || req.body?.userId || req.query?.userId || fallbackUserId || 'guest-user';
}

module.exports = {
    normalizeSkill,
    calculateTier,
    calcMasteryPct,
    getLanguageInfo,
    langCodeFromName,
    generateGenericQuiz,
    getUserId,
};
