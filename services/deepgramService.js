/**
 * Deepgram Service (Nova-3 STT & Aura-2 TTS)
 * Provides high-speed neural transcription and ultra-realistic voice synthesis.
 */

const axios = require('axios');
const dotenv = require('dotenv');
const dns = require('dns');
try {
    dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
    dns.setDefaultResultOrder('ipv4first');
} catch (e) {}

dotenv.config();

const DEEPGRAM_API_KEY = process.env.DEEPGRAM_API_KEY || '488a277e12f99d90145228e679c769bcd0458ee4';

/**
 * Transcribe Audio Buffer using Deepgram Nova-3
 * @param {Buffer} audioBuffer - Raw audio data (WebM, WAV, MP3, etc.)
 * @param {string} mimeType - e.g. 'audio/webm', 'audio/wav'
 * @param {Array<string>} keyterms - Domain-specific technical keywords to boost
 * @returns {Promise<{transcript: string, confidence: number, words: Array}>}
 */
async function transcribeAudio(audioBuffer, mimeType = 'audio/webm', keyterms = []) {
    if (!DEEPGRAM_API_KEY) {
        throw new Error('DEEPGRAM_API_KEY is not configured');
    }

    let url = 'https://api.deepgram.com/v1/listen?model=nova-3&smart_format=true&punctuate=true&filler_words=false&numerals=true';
    
    // Add technical keyterms for vocabulary boosting
    if (Array.isArray(keyterms) && keyterms.length > 0) {
        const keytermParams = keyterms.map(k => `keywords=${encodeURIComponent(k)}:2`).join('&');
        url += `&${keytermParams}`;
    }

    const response = await axios.post(url, audioBuffer, {
        headers: {
            'Authorization': `Token ${DEEPGRAM_API_KEY}`,
            'Content-Type': mimeType || 'audio/webm'
        },
        timeout: 15000
    });

    const channel = response.data?.results?.channels?.[0];
    const alternative = channel?.alternatives?.[0];
    const transcript = alternative?.transcript?.trim() || '';
    const confidence = alternative?.confidence || 0;
    const words = alternative?.words || [];

    return { transcript, confidence, words };
}

/**
 * Synthesize Speech from Text using Deepgram Aura-2
 * @param {string} text - The text to speak
 * @param {string} voiceModel - e.g. 'aura-asteria-en', 'aura-luna-en', 'aura-arcas-en'
 * @returns {Promise<Buffer>} - Audio MP3 buffer
 */
async function textToSpeech(text, voiceModel = null) {
    if (!DEEPGRAM_API_KEY) {
        throw new Error('DEEPGRAM_API_KEY is not configured');
    }

    const voice = voiceModel || process.env.DEEPGRAM_TTS_VOICE || 'aura-asteria-en';
    
    // Clean text of markdown symbols that degrade speech synthesis
    const cleanText = text
        .replace(/[*_#`~>]/g, '')
        .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1')
        .trim();

    if (!cleanText) {
        throw new Error('Cannot synthesize empty text');
    }

    const response = await axios.post(
        `https://api.deepgram.com/v1/speak?model=${encodeURIComponent(voice)}`,
        { text: cleanText },
        {
            headers: {
                'Authorization': `Token ${DEEPGRAM_API_KEY}`,
                'Content-Type': 'application/json'
            },
            responseType: 'arraybuffer',
            timeout: 15000
        }
    );

    return Buffer.from(response.data);
}

/**
 * Generate Audio Data URL for direct frontend playback
 * @param {string} text 
 * @param {string} voiceModel 
 * @returns {Promise<string>} - 'data:audio/mp3;base64,...'
 */
async function generateTTSDataUrl(text, voiceModel = null) {
    try {
        const audioBuffer = await textToSpeech(text, voiceModel);
        return `data:audio/mp3;base64,${audioBuffer.toString('base64')}`;
    } catch (err) {
        console.warn('[Deepgram TTS Warning]:', err.message);
        return null;
    }
}

module.exports = {
    transcribeAudio,
    textToSpeech,
    generateTTSDataUrl
};
