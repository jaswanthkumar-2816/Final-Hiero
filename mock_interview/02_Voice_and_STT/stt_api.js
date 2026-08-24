/**
 * Hiero Mock Interview - Deepgram Voice & STT Engine
 * Module: 02_Voice_and_STT
 * High-precision STT (Nova-3) and Neural TTS (Aura-2) connector.
 */

class HieroDeepgramEngine {
    constructor(apiBaseUrl = '/api/interview') {
        this.apiBaseUrl = apiBaseUrl;
        this.currentAudio = null;
    }

    /**
     * Transcribe an audio Blob using Deepgram Nova-3 via Backend
     * @param {Blob} audioBlob 
     * @returns {Promise<string>}
     */
    async transcribeBlob(audioBlob) {
        try {
            const formData = new FormData();
            formData.append('audio', audioBlob, 'candidate-response.webm');

            const token = localStorage.getItem('token');
            const headers = {};
            if (token) headers['Authorization'] = `Bearer ${token}`;

            const response = await fetch(`${this.apiBaseUrl}/transcribe`, {
                method: 'POST',
                headers,
                body: formData
            });

            const data = await response.json();
            if (data.success) {
                return data.text;
            } else {
                throw new Error(data.error || 'Transcription failed');
            }
        } catch (error) {
            console.error('[Hiero Deepgram STT] Transcription failed:', error);
            throw error;
        }
    }

    /**
     * Synthesize and play AI Speech using Deepgram Aura-2
     * @param {string} text 
     * @param {string} voiceModel 
     * @returns {Promise<HTMLAudioElement>}
     */
    async speak(text, voiceModel = 'aura-asteria-en') {
        try {
            if (this.currentAudio) {
                try { this.currentAudio.pause(); } catch(e){}
            }

            const response = await fetch(`${this.apiBaseUrl}/tts`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text, voice: voiceModel })
            });

            const data = await response.json();
            if (data.success && data.audio_url) {
                this.currentAudio = new Audio(data.audio_url);
                await this.currentAudio.play();
                return this.currentAudio;
            } else {
                throw new Error(data.error || 'TTS generation failed');
            }
        } catch (error) {
            console.error('[Hiero Deepgram TTS] Speech synthesis failed:', error);
            throw error;
        }
    }

    /**
     * Stop currently active speech audio
     */
    stopSpeaking() {
        if (this.currentAudio) {
            try {
                this.currentAudio.pause();
                this.currentAudio = null;
            } catch(e){}
        }
    }
}

// Export for frontend use
window.HieroDeepgramEngine = HieroDeepgramEngine;
