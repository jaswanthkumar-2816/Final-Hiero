/**
 * HIERO — AI Service Wrapper
 * Single source of truth for all Groq/OpenAI API calls.
 * Modules MUST use this instead of calling APIs directly.
 */

const axios = require('axios');
const { GROQ_API_KEY, AI_MODEL } = require('../config/constants');

/**
 * Generate text completion from Groq
 * @param {string} prompt - The user prompt
 * @param {object} options - { temperature, maxTokens, systemPrompt }
 * @returns {string} The generated text content
 */
async function generate(prompt, options = {}) {
    const { temperature = 0.3, maxTokens = 3000, systemPrompt } = options;

    if (!GROQ_API_KEY) {
        throw new Error('GROQ_API_KEY not configured');
    }

    const messages = [];
    if (systemPrompt) messages.push({ role: 'system', content: systemPrompt });
    messages.push({ role: 'user', content: prompt });

    const res = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
        model: AI_MODEL,
        messages,
        temperature,
        max_tokens: maxTokens,
    }, {
        headers: {
            'Authorization': `Bearer ${GROQ_API_KEY}`,
            'Content-Type': 'application/json',
        },
    });

    return res.data.choices?.[0]?.message?.content || '';
}

/**
 * Generate and parse JSON from Groq
 * Extracts the first JSON object from the response text.
 * @param {string} prompt - The user prompt requesting JSON output
 * @param {object} options - { temperature, maxTokens }
 * @returns {object} Parsed JSON object
 */
async function generateJSON(prompt, options = {}) {
    const raw = await generate(prompt, options);
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) {
        throw new Error('No JSON found in AI response');
    }
    return JSON.parse(match[0]);
}

/**
 * Check if AI is configured
 */
function isAvailable() {
    return !!GROQ_API_KEY;
}

module.exports = { generate, generateJSON, isAvailable };
