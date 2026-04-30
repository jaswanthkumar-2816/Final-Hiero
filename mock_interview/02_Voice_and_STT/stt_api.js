/**
 * Hiero Mock Interview - Voice & STT Engine
 * Module: 02_Voice_and_STT
 * This script provides a frontend-ready connector for AssemblyAI Real-time STT.
 */

class HieroSTTEngine {
    constructor(apiBaseUrl = '/api/mockinterview') {
        this.apiBaseUrl = apiBaseUrl;
        this.socket = null;
    }

    /**
     * Fetch a temporary token from the Hiero Gateway
     */
    async fetchToken() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/token`, { method: 'POST' });
            const data = await response.json();
            return data.token;
        } catch (error) {
            console.error('[Hiero STT] Token fetch failed:', error);
            throw error;
        }
    }

    /**
     * Connect to AssemblyAI Real-time WebSocket
     * @param {Function} onTranscript - Callback for text results
     */
    async connect(onTranscript) {
        const token = await this.fetchToken();
        const url = `wss://api.assemblyai.com/v2/realtime/ws?sample_rate=16000&token=${token}`;

        this.socket = new WebSocket(url);

        this.socket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.text) {
                onTranscript(data.text, data.message_type === 'FinalTranscript');
            }
        };

        this.socket.onerror = (error) => console.error('[Hiero STT] WebSocket Error:', error);
        this.socket.onclose = () => console.log('[Hiero STT] WebSocket Closed');

        return new Promise((resolve) => {
            this.socket.onopen = () => {
                console.log('[Hiero STT] Connected to AssemblyAI');
                resolve();
            };
        });
    }

    /**
     * Send audio data chunk to the WebSocket
     * @param {ArrayBuffer} audioData 
     */
    sendAudio(audioData) {
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            const encoded = btoa(String.fromCharCode(...new Uint8Array(audioData)));
            this.socket.send(JSON.stringify({ audio_data: encoded }));
        }
    }

    disconnect() {
        if (this.socket) {
            this.socket.send(JSON.stringify({ terminate_session: true }));
            this.socket.close();
        }
    }
}

// Export for use in mock-interview.html
window.HieroSTTEngine = HieroSTTEngine;
