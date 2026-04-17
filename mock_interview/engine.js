/**
 * HIERO MOCK - NEURAL COMMAND CENTER ENGINE
 * Version: HYPER-IMMERSION v2.0
 */

const state = {
    isRunning: false,
    isVoiceActive: false,
    orbState: "idle", // idle, speaking, listening
    trustScore: 100,
    depthScore: 0,
    userName: "Jaswanth Kumar",
    level: "MID",
    startTime: null,
    timerId: null,
    history: [],
    analyser: null,
    dataArray: null,
    animationId: null,
    canvas: null,
    ctx: null
};

// UI Elements
const els = {
    shroud: document.getElementById('startupShroud'),
    hud: document.getElementById('app'),
    video: document.getElementById('userCamera'),
    orb: document.getElementById('orbContainer'),
    canvas: document.getElementById('neuralCanvas'),
    transcript: document.getElementById('aiTranscript'),
    depthFill: document.getElementById('depthFill'),
    depthVal: document.getElementById('depthVal'),
    timer: document.getElementById('mainTimer'),
    input: document.getElementById('userInput'),
    mindStream: document.getElementById('mindStream')
};

// --- SYSTEM INITIALIZATION ---
function setLevel(btn, lvl) {
    state.level = lvl;
    document.querySelectorAll('.lvl-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
}

async function startInterview() {
    els.shroud.style.opacity = '0';
    els.shroud.style.pointerEvents = 'none';

    // HUD BOOT SEQUENCE
    setTimeout(() => {
        els.shroud.style.display = 'none';
        els.hud.classList.remove('hidden-ui');
        initCamera();
        initNeuralAnimation();
        
        state.isRunning = true;
        state.startTime = Date.now();
        startTimer();

        // Neural Greet
        const greet = `Neural Link Established. Calibration complete. Candidate: ${state.userName}. Level: ${state.level}. To begin the audit, state your primary specialization and high-level architectural experience.`;
        addMessage("assistant", greet);
    }, 800);
}

async function initCamera() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        els.video.srcObject = stream;
        
        // Setup Audio Analyser
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const source = audioCtx.createMediaStreamSource(stream);
        state.analyser = audioCtx.createAnalyser();
        state.analyser.fftSize = 256;
        source.connect(state.analyser);
        state.dataArray = new Uint8Array(state.analyser.frequencyBinCount);
    } catch (e) {
        console.error("Camera/Mic Lock Failed", e);
    }
}

// --- NEURAL PERSONA ANIMATION ---
function initNeuralAnimation() {
    state.ctx = els.canvas.getContext('2d');
    els.canvas.width = 650;
    els.canvas.height = 650;

    function draw() {
        if (!state.isRunning) return;
        state.ctx.clearRect(0, 0, 650, 650);
        
        const time = Date.now() * 0.001;
        let micVolume = 0;
        
        if (state.analyser && state.orbState === "listening") {
            state.analyser.getByteFrequencyData(state.dataArray);
            micVolume = state.dataArray.reduce((p, c) => p + c, 0) / state.dataArray.length;
        }

        let color = "#00ff66"; // Cyan-Green
        let amp = 1 + (micVolume / 100);

        if (state.orbState === "speaking") {
            color = "#9d00ff"; // Purple
            amp = 1.3 + Math.sin(time * 15) * 0.4;
        }

        // Draw Neural Fluid Waves
        for (let j = 0; j < 2; j++) {
            state.ctx.beginPath();
            state.ctx.lineWidth = j === 0 ? 1 : 2;
            state.ctx.strokeStyle = color;
            state.ctx.globalAlpha = j === 0 ? 0.2 : 0.8;

            for (let i = 0; i <= 360; i += 5) {
                const rad = i * Math.PI / 180;
                const offset = j * 30;
                const noise = Math.sin(rad * (4 + j) + time * 3) * (15 + offset) * amp;
                const r = (180 + offset) + noise;
                const x = 325 + Math.cos(rad) * r;
                const y = 325 + Math.sin(rad) * r;
                
                if (i === 0) state.ctx.moveTo(x, y);
                else state.ctx.lineTo(x, y);
            }
            state.ctx.closePath();
            state.ctx.stroke();
        }

        state.animationId = requestAnimationFrame(draw);
    }
    draw();
}

// --- CONVERSATION LOGIC ---
function toggleVoice() {
    state.isVoiceActive = !state.isVoiceActive;
    const btn = document.getElementById('voiceToggle');
    btn.textContent = state.isVoiceActive ? "VOICE_LINK_ACTIVE" : "VOICE_LINK_OFF";
    btn.classList.toggle('active');
    
    if (state.isVoiceActive) initSTT();
    else if (recognition) recognition.stop();
}

let recognition;
function initSTT() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
        state.orbState = "listening";
        els.orb.className = "orb-stage listening";
        document.getElementById('orbStatus').textContent = "PHONETIC_SCAN";
    };

    recognition.onresult = (e) => {
        const text = e.results[e.results.length-1][0].transcript;
        addMessage("user", text);
        processAIResponse(text);
    };

    recognition.start();
}

async function processAIResponse(input) {
    state.orbState = "idle";
    document.getElementById('orbStatus').textContent = "ANALYZING_DATA";
    
    try {
        const r = await fetch('/api/interview/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                message: input, 
                history: state.history,
                context: { level: state.level, userName: state.userName }
            })
        });
        const d = await r.json();
        
        if (d.success) {
            addMessage("assistant", d.response);
            updateHUD(d);
        }
    } catch (e) {
        addMessage("assistant", "Neural link jitter detected. Connectivity compromised.");
    }
}

function addMessage(role, text) {
    state.history.push({ role, content: text });
    if (role === "assistant") {
        state.orbState = "speaking";
        els.orb.className = "orb-stage speaking";
        document.getElementById('orbStatus').textContent = "VOCALIZING_AUDIT";
        typeTranscript(text);
        speak(text);
    }
}

function typeTranscript(text) {
    els.transcript.textContent = text;
    // Log to mindStream
    const logs = ["COMPUTING_TRADE_OFFS", "SCANNED_KEYWORDS", "DEPTH_ASSESSMENT", "SENTIMENT_LOCK"];
    const log = document.createElement('div');
    log.textContent = `> ${logs[Math.floor(Math.random()*logs.length)]} :: 0x${Math.floor(Math.random()*9999).toString(16)}`;
    els.mindStream.prepend(log);
    if (els.mindStream.children.length > 5) els.mindStream.lastElementChild.remove();
}

function speak(text) {
    const synth = window.speechSynthesis;
    const utt = new SpeechSynthesisUtterance(text);
    const voices = synth.getVoices();
    utt.voice = voices.find(v => v.name.includes('Google US English') || v.name.includes('Samantha')) || voices[0];
    utt.rate = 1.05;
    utt.volume = 1.0;
    
    utt.onend = () => {
        state.orbState = "listening";
        els.orb.className = "orb-stage listening";
        document.getElementById('orbStatus').textContent = "PHONETIC_SCAN";
    };
    synth.speak(utt);
}

function updateHUD(data) {
    if (data.telemetrySummary) {
        state.depthScore = Math.min(100, state.depthScore + data.telemetrySummary.logicDepthIncrease);
        els.depthFill.style.width = state.depthScore + "%";
        els.depthVal.textContent = (state.depthScore / 10).toFixed(1);
    }
    document.getElementById('sentimentDisplay').textContent = data.sentiment || "NEUTRAL";
}

function startTimer() {
    state.timerId = setInterval(() => {
        const diff = Date.now() - state.startTime;
        const m = Math.floor(diff / 60000).toString().padStart(2, '0');
        const s = Math.floor((diff % 60000) / 1000).toString().padStart(2, '0');
        els.timer.textContent = `${m}:${s}`;
    }, 1000);
}

function endSession() {
    state.isRunning = false;
    clearInterval(state.timerId);
    window.speechSynthesis.cancel();
    if (recognition) recognition.stop();
    
    document.getElementById('finalDepth').textContent = (state.depthScore / 10).toFixed(1);
    document.getElementById('reportModal').style.display = 'flex';
    
    let verdict = "Your architectural depth is insufficient. You relied on buzzwords but failed the cross-examination on core implementation trade-offs.";
    if (state.depthScore > 70) verdict = "LETHAL DEPTH. You navigated the adversarial audit with precision. Your understanding of trade-offs is top 1%. Hire immediately.";
    else if (state.depthScore > 40) verdict = "STABLE COMPETENCY. You have a solid grasp of concepts but need to refine your logic on high-load scenarios.";
    
    document.getElementById('harshTruth').textContent = verdict;
}
