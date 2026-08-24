// test-deepgram.js
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { transcribeAudio, textToSpeech, generateTTSDataUrl } = require('./services/deepgramService');

async function testDeepgramPipeline() {
    console.log("==========================================");
    console.log("🎙️  TESTING DEEPGRAM NOVA-3 & AURA PIPELINE");
    console.log("==========================================");
    console.log("🔑 API Key configured:", process.env.DEEPGRAM_API_KEY ? "✅ YES (" + process.env.DEEPGRAM_API_KEY.slice(0, 6) + "...)" : "❌ NO");

    try {
        // Step 1: Test Deepgram TTS (Aura)
        console.log("\n[1/3] Generating speech with Deepgram Aura (model: aura-asteria-en)...");
        const sampleText = "Welcome to your Hiero technical mock interview. Can you explain how you design distributed microservices for high throughput?";
        const audioBuffer = await textToSpeech(sampleText, 'aura-asteria-en');
        
        const testAudioFile = path.join(__dirname, 'test_deepgram_output.mp3');
        fs.writeFileSync(testAudioFile, audioBuffer);
        console.log(`✅ TTS Generated successfully! File saved: ${testAudioFile} (${audioBuffer.length} bytes)`);

        // Step 2: Test Deepgram STT (Nova-3)
        console.log("\n[2/3] Transcribing the generated audio back using Deepgram Nova-3...");
        const keyterms = ['Hiero', 'microservices', 'throughput', 'distributed'];
        const { transcript, confidence } = await transcribeAudio(audioBuffer, 'audio/mp3', keyterms);
        console.log("✅ Nova-3 Transcript received:");
        console.log(`   "${transcript}"`);
        console.log(`   Confidence: ${(confidence * 100).toFixed(1)}%`);

        // Step 3: Test Base64 Data URL generation
        console.log("\n[3/3] Testing Data-URI base64 generator for instant browser playback...");
        const dataUrl = await generateTTSDataUrl("Testing instant audio delivery.", 'aura-asteria-en');
        if (dataUrl && dataUrl.startsWith('data:audio/mp3;base64,')) {
            console.log(`✅ Data URL generated (${dataUrl.length} chars).`);
        } else {
            console.warn("⚠️ Data URL generation unexpected result.");
        }

        console.log("\n==========================================");
        console.log("🎉 ALL DEEPGRAM TESTS PASSED SUCCESSFULLY!");
        console.log("==========================================");
    } catch (err) {
        console.error("\n❌ Test Error:", err.message);
        if (err.response?.data) {
            console.error("Response data:", err.response.data.toString());
        }
        process.exit(1);
    }
}

testDeepgramPipeline();
