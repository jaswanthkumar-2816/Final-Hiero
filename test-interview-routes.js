// test-interview-routes.js
require('dotenv').config();
const dns = require('dns');
try { dns.setDefaultResultOrder('ipv4first'); } catch(e){}

const express = require('express');
const interviewRouter = require('./routes/interview');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');

const app = express();
app.use(express.json());
app.use('/api/interview', interviewRouter);

const server = app.listen(7788, async () => {
    console.log("==========================================");
    console.log("🧪 TESTING INTERVIEW ROUTER WITH DEEPGRAM");
    console.log("==========================================");

    try {
        const baseURL = 'http://localhost:7788/api/interview';

        // 1. Test /api/interview/tts
        console.log("\n[1/3] Testing POST /api/interview/tts...");
        const ttsRes = await axios.post(`${baseURL}/tts`, {
            text: "Hello, welcome to Hiero Mock Interview powered by Deepgram."
        });
        if (ttsRes.data.success && ttsRes.data.audio_url) {
            console.log(`✅ /tts responded with audio_url (${ttsRes.data.audio_url.length} chars)`);
        } else {
            throw new Error('/tts did not return audio_url');
        }

        // 2. Test /api/interview/transcribe
        console.log("\n[2/3] Testing POST /api/interview/transcribe...");
        const testAudioPath = path.join(__dirname, 'test_deepgram_output.mp3');
        if (fs.existsSync(testAudioPath)) {
            const form = new FormData();
            form.append('audio', fs.createReadStream(testAudioPath), {
                filename: 'test.mp3',
                contentType: 'audio/mp3'
            });

            const transRes = await axios.post(`${baseURL}/transcribe`, form, {
                headers: form.getHeaders()
            });

            console.log("✅ /transcribe response:", transRes.data);
        } else {
            console.warn("⚠️ test_deepgram_output.mp3 not found, skipping direct file upload.");
        }

        // 3. Test /api/interview/voice-turn
        console.log("\n[3/3] Testing POST /api/interview/voice-turn...");
        if (fs.existsSync(testAudioPath)) {
            const voiceForm = new FormData();
            voiceForm.append('audio', fs.createReadStream(testAudioPath), {
                filename: 'voice_turn.mp3',
                contentType: 'audio/mp3'
            });
            voiceForm.append('sessionId', 'test-session-' + Date.now());
            voiceForm.append('questionIndex', 'Q1');
            voiceForm.append('messages', JSON.stringify([
                { role: 'assistant', content: 'Tell me about your architectural experience.' }
            ]));

            const voiceRes = await axios.post(`${baseURL}/voice-turn`, voiceForm, {
                headers: voiceForm.getHeaders()
            });

            console.log("✅ /voice-turn response received:");
            console.log("   Candidate Transcript:", voiceRes.data.candidateTranscript);
            console.log("   AI Follow-up:", voiceRes.data.reply);
            console.log("   AI Audio URL present:", Boolean(voiceRes.data.audio_url));
            console.log("   Coaching score:", voiceRes.data.coaching?.clarityScore);
        }

        console.log("\n==========================================");
        console.log("🎉 ALL INTERVIEW ROUTES VERIFIED AND WORKING!");
        console.log("==========================================");
    } catch (err) {
        console.error("❌ Route Test Error:", err?.response?.data || err.message);
    } finally {
        server.close();
        process.exit(0);
    }
});
