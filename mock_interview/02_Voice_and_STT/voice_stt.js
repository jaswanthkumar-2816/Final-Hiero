/**
 * 02_Voice_and_STT — Hiero Mock Interview
 * ─────────────────────────────────────────────────────────────
 * Voice input (Speech-to-Text) and voice output (Text-to-Speech)
 * using the Web Speech API — works on Chrome, Edge, mobile Safari.
 *
 * HOW IT WORKS:
 *  STT: SpeechRecognition API listens → transcribes in real-time
 *       → fires onFinalResult callback when user stops speaking
 *  TTS: SpeechSynthesisUtterance plays AI responses in female voice
 *       → animates the neural orb while speaking
 *       → auto-starts mic after AI finishes speaking
 * ─────────────────────────────────────────────────────────────
 */

// ── STATE ────────────────────────────────────────────────────
let recognition = null;
let synth = window.speechSynthesis;
let isListening = false;
let isSpeaking = false;

// ── SPEECH RECOGNITION (STT) ─────────────────────────────────
/**
 * Initialises the Web Speech API SpeechRecognition instance.
 * Hooks up interim results for live transcript and final result
 * for sending to the AI question generator.
 *
 * @param {Function} onFinalResult - Called with final transcript string
 * @param {Function} onInterimResult - Called with interim transcript string
 */
function initSpeechRecognition(onFinalResult, onInterimResult) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
        console.error('[Voice] Speech Recognition not supported in this browser.');
        return;
    }

    recognition = new SpeechRecognition();
    recognition.continuous = true;      // Keep listening until manually stopped
    recognition.interimResults = true;  // Show words as user speaks
    recognition.lang = 'en-US';

    recognition.onstart = () => {
        isListening = true;
        document.getElementById('mic-btn')?.classList.add('listening');
        document.getElementById('mic-label').textContent = 'LISTENING...';
    };

    recognition.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
                finalTranscript += transcript;
            } else {
                interimTranscript += transcript;
            }
        }

        // Show live transcript on screen
        if (onInterimResult && (interimTranscript || finalTranscript)) {
            onInterimResult(interimTranscript || finalTranscript);
        }

        // When user finishes a sentence, send to AI
        if (finalTranscript && onFinalResult) {
            onFinalResult(finalTranscript.trim());
        }
    };

    recognition.onend = () => {
        isListening = false;
        document.getElementById('mic-btn')?.classList.remove('listening');
        document.getElementById('mic-label').textContent = 'TAP TO RESPOND';
    };

    recognition.onerror = (event) => {
        console.warn('[Voice STT] Error:', event.error);
        isListening = false;
    };
}

/**
 * Toggles the microphone on/off.
 * Cancels AI speech if listening manually started.
 */
function toggleMic() {
    if (!recognition) return;
    if (isListening) {
        recognition.stop();
    } else {
        synth.cancel(); // Stop AI if still talking
        recognition.start();
    }
}

/**
 * Starts listening automatically (called after AI finishes speaking).
 */
function autoStartMic() {
    if (!isListening && !isSpeaking && recognition) {
        recognition.start();
    }
}

// ── TEXT-TO-SPEECH (TTS) ─────────────────────────────────────
/**
 * Speaks AI text using a female voice.
 * Animates the neural orb during speech.
 * Auto-starts mic after speaking if session is still active.
 *
 * @param {string} text - The AI's response/question to speak
 * @param {Function} onDone - Called when speech finishes
 */
function speakAI(text, onDone) {
    if (!text) return;

    // Update the AI text display
    const aiDisplay = document.getElementById('ai-out');
    if (aiDisplay) aiDisplay.textContent = text;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.pitch = 1.1;
    utterance.rate = 1.0;
    utterance.volume = 1.0;

    // Select best female voice available
    const voices = synth.getVoices();
    const femaleVoice =
        voices.find(v => v.name === 'Google UK English Female') ||
        voices.find(v => v.name === 'Samantha') ||
        voices.find(v => v.name.toLowerCase().includes('female')) ||
        voices.find(v => v.lang === 'en-US') ||
        voices[0];

    if (femaleVoice) utterance.voice = femaleVoice;

    // Orb animation
    const orb = document.getElementById('voice-orb');

    utterance.onstart = () => {
        isSpeaking = true;
        orb?.classList.add('speaking');
    };

    utterance.onend = () => {
        isSpeaking = false;
        orb?.classList.remove('speaking');
        if (onDone) onDone();
    };

    utterance.onerror = (e) => {
        console.warn('[Voice TTS] Error:', e.error);
        isSpeaking = false;
        orb?.classList.remove('speaking');
    };

    synth.speak(utterance);
}

// ── VOICE LOADING HELPER ─────────────────────────────────────
/**
 * Waits for browser voices to load (needed on some browsers).
 * Call before first speakAI() to avoid silent playback.
 *
 * @returns {Promise<void>}
 */
function waitForVoices() {
    return new Promise(resolve => {
        if (synth.getVoices().length > 0) return resolve();
        synth.onvoiceschanged = resolve;
    });
}
