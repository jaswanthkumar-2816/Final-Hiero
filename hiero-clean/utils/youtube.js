/**
 * HIERO — YouTube Video Service
 * Fetches tutorial videos with fallback to curated pools.
 */

const axios = require('axios');
const { YOUTUBE_API_KEY } = require('../config/constants');
const { calculateTier } = require('./helpers');

// ─── CURATED VIDEO POOLS (Fallback when no API key) ────
const VIDEO_POOLS = {
    react: {
        foundational: ['bMknfKXIFA8', 'SqcY0GlETPk', 'w7ejDZ8SWv8'],
        core: ['TNhaISOUy6Q', '35lXWvCuM8o', 'O6P86uwfdR0'],
        advanced: ['7kAW7Qx2yD0', 'd56mG7DezGs', 'cVw6-F648D4'],
        masterclass: ['ZCuYvjZfFA0', '00pxxT_4gLw', '4UZrsTqkcW4'],
    },
    python: {
        foundational: ['_uQrJ0TkZlc', 'rfscVS0vtbw', 'kqtD5dpn9C8'],
        core: ['JeznW_7DlB0', 'HGOBQPFzWKo', '8ext9G7xfeg'],
        advanced: ['cKPlPJyQrtE', 'qUebd2NmbHU', '7k2v4kU_z9g'],
        masterclass: ['XGF3Qu4dUqk', '0vT9FwzB2pg', 'eWRfhZUzrAc'],
    },
    javascript: {
        foundational: ['W6NZfCO5SIk', 'H3XIJYEPdus', 'pkDg23nL2vE'],
        core: ['hdI2bqOjy3c', 'sbMstS2Q5uA', 'po5e6yC3t24'],
        advanced: ['R9I85RhV7Cg', 'Bv_5Zv5c-Ts', '3PHXvlpOkfU'],
        masterclass: ['ZvbzSrg0afE', 'musPosdXqGg', 'nZ1DMMsyVyI'],
    },
};

const MODULE_TITLES = {
    foundational: ['Module 1: Foundations & Core Concepts', 'Module 2: Essential Building Blocks', 'Module 3: Beginner Practice Lab'],
    core: ['Module 1: Core Functionality & Workflows', 'Module 2: Practical Data & State Patterns', 'Module 3: Hands-on Problem Solving'],
    advanced: ['Module 1: Advanced Architecture Deep Dive', 'Module 2: Production Real-World Application', 'Module 3: Performance & Optimization Mastery'],
    masterclass: ['Module 1: Production System Architecture', 'Module 2: Enterprise Scale Patterns', 'Module 3: Expert Masterclass Capstone'],
};

function getFallbackVideos(skillId, score, lang) {
    const tier = calculateTier(score);
    const pool = VIDEO_POOLS[skillId] || VIDEO_POOLS.python;
    const ids = pool[tier] || pool.foundational;
    const titles = MODULE_TITLES[tier] || MODULE_TITLES.foundational;

    return ids.map((ytId, i) => ({
        videoId: ytId,
        title: titles[i] || `Module ${i + 1}`,
        url: `https://www.youtube.com/embed/${ytId}`,
        thumbnail: `https://i.ytimg.com/vi/${ytId}/hqdefault.jpg`,
        duration: i === 0 ? 'PT45M' : i === 1 ? 'PT1H15M' : 'PT2H',
        moduleNumber: i + 1,
        isFallback: true,
    }));
}

async function fetchVideos(skill, score, lang) {
    if (!YOUTUBE_API_KEY) {
        return getFallbackVideos(skill, score, lang);
    }

    try {
        const tier = calculateTier(score);
        const searchQuery = `${skill} ${tier} tutorial`;

        const res = await axios.get('https://www.googleapis.com/youtube/v3/search', {
            params: {
                part: 'snippet',
                type: 'video',
                maxResults: 3,
                q: searchQuery,
                key: YOUTUBE_API_KEY,
                order: 'relevance',
            },
        });

        return (res.data.items || []).map((item, i) => ({
            videoId: item.id.videoId,
            title: item.snippet.title,
            url: `https://www.youtube.com/embed/${item.id.videoId}`,
            thumbnail: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.medium?.url,
            moduleNumber: i + 1,
            isFallback: false,
        }));
    } catch (err) {
        console.error(`[YouTube] API error for ${skill}:`, err.message);
        return getFallbackVideos(skill, score, lang);
    }
}

module.exports = { fetchVideos, getFallbackVideos };
