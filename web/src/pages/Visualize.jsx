import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import ThemeToggle from '../components/ThemeToggle.jsx';
import { post } from '../api/client.js';

const SPEEDS = [0.5, 1, 1.5, 2, 2.5, 3];
const BASE_MS = 700;
const SILENCE_WAV = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA';

function decodeAudio(ctx, buf) {
  const copy = buf.slice(0);
  if (ctx.decodeAudioData.length === 1) return ctx.decodeAudioData(copy);
  return new Promise((resolve, reject) => ctx.decodeAudioData(copy, resolve, reject));
}

const MERGE_DEMO = `def merge(left, right):
    merged = []
    i = 0
    j = 0
    while i < len(left) and j < len(right):
        if left[i] <= right[j]:
            merged.append(left[i])
            i += 1
        else:
            merged.append(right[j])
            j += 1
    while i < len(left):
        merged.append(left[i])
        i += 1
    while j < len(right):
        merged.append(right[j])
        j += 1
    return merged

def merge_sort(nums):
    if nums is None:
        return []
    if len(nums) <= 1:
        return list(nums)
    mid = len(nums) // 2
    left = merge_sort(nums[:mid])
    right = merge_sort(nums[mid:])
    return merge(left, right)

print(merge_sort([38, 27, 43, 3, 9, 82, 10, 19, 50, 1, 62, 14, 7, 91, 4, 25]))
`;

function readPayload(demo) {
  if (demo === 'mergesort' || demo === 'merge-sort') {
    return { code: MERGE_DEMO, language: 'python', problemTitle: 'Merge Sort a Large Array' };
  }
  try {
    return JSON.parse(localStorage.getItem('hieroVisualizePayload') || sessionStorage.getItem('hieroVisualizePayload') || 'null');
  } catch {
    return null;
  }
}

export default function Visualize() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const payload = useMemo(() => readPayload(params.get('demo')), [params]);
  const [steps, setSteps] = useState([]);
  const [idx, setIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(() => Number(localStorage.getItem('hiero-vis-speed')) || 1);
  const [error, setError] = useState('');
  const [voiceOn, setVoiceOn] = useState(() => localStorage.getItem('hiero-vis-voice') !== 'off');
  const timer = useRef(null);
  const audioElRef = useRef(null);
  const audioCtxRef = useRef(null);
  const sourceRef = useRef(null);
  const cacheRef = useRef(new Map());
  const step = steps[idx] || {};

  function unlockAudio() {
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC && !audioCtxRef.current) audioCtxRef.current = new AC();
      if (audioCtxRef.current?.state === 'suspended') audioCtxRef.current.resume();
    } catch {}
    const el = audioElRef.current;
    if (!el || el.dataset.unlocked === '1') return;
    el.src = SILENCE_WAV;
    el.volume = 1;
    el.muted = false;
    el.play().then(() => {
      el.pause();
      el.dataset.unlocked = '1';
    }).catch(() => {});
  }

  function stopVoice() {
    if (sourceRef.current) {
      try { sourceRef.current.stop(); } catch {}
      sourceRef.current = null;
    }
    const el = audioElRef.current;
    if (el) {
      try { el.pause(); } catch {}
    }
  }

  async function speakCaption(caption) {
    let buf = cacheRef.current.get(caption);
    if (!buf) {
      const res = await fetch('/api/visualize/speak', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: caption }),
      });
      if (!res.ok) return;
      buf = await res.arrayBuffer();
      if (!buf?.byteLength) return;
      cacheRef.current.set(caption, buf);
    }
    const ctx = audioCtxRef.current;
    if (ctx) {
      try {
        if (ctx.state === 'suspended') await ctx.resume();
        const decoded = await decodeAudio(ctx, buf);
        const src = ctx.createBufferSource();
        src.buffer = decoded;
        src.connect(ctx.destination);
        sourceRef.current = src;
        await new Promise((resolve) => {
          src.onended = resolve;
          try { src.start(0); } catch { resolve(); }
        });
        return;
      } catch {}
    }
    const el = audioElRef.current;
    if (!el) return;
    const url = URL.createObjectURL(new Blob([buf], { type: 'audio/mpeg' }));
    el.src = url;
    el.muted = false;
    el.volume = 1;
    await el.play();
    await new Promise((resolve) => {
      el.onended = resolve;
      el.onerror = resolve;
    });
    URL.revokeObjectURL(url);
  }

  useEffect(() => {
    let cancelled = false;
    if (!payload?.code) {
      setError('No code was sent. Go back to the editor and click Visualize My Code.');
      return undefined;
    }
    post('/api/visualize', {
      code: payload.code,
      language: payload.language || 'python',
      problemTitle: payload.problemTitle || '',
      problemType: payload.problemType || '',
      testCases: payload.testCases || [],
    }).then((data) => {
      if (cancelled) return;
      if (data.steps?.length) setSteps(data.steps);
      else setError(data.friendlyCaption || data.error || 'Could not visualize this code.');
    }).catch((err) => {
      if (!cancelled) setError(err.message);
    });
    return () => { cancelled = true; };
  }, [payload]);

  useEffect(() => {
    let cancelled = false;
    const caption = String(step.caption || '').replace(/\s+/g, ' ').trim();
    if (!voiceOn || !caption) return undefined;
    (async () => {
      try {
        await speakCaption(caption);
      } catch {}
      if (cancelled || !playing) return;
      if (idx < steps.length - 1) setIdx((i) => i + 1);
      else setPlaying(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [idx, step.caption, voiceOn, playing, steps.length]);

  useEffect(() => {
    if (!playing || voiceOn) {
      clearInterval(timer.current);
      return undefined;
    }
    timer.current = setInterval(() => {
      setIdx((i) => {
        if (i >= steps.length - 1) {
          setPlaying(false);
          return i;
        }
        return i + 1;
      });
    }, Math.round(BASE_MS / speed));
    return () => clearInterval(timer.current);
  }, [playing, speed, steps.length, voiceOn]);

  function changeSpeed(next) {
    setSpeed(next);
    try { localStorage.setItem('hiero-vis-speed', String(next)); } catch {}
  }

  const values = step.state?.dataStructure?.values || [];
  const active = step.state?.activeIndices || [];
  const lines = String(payload?.code || '').split('\n');

  return (
    <div className="vis-page">
      <audio ref={audioElRef} preload="auto" playsInline />
      <div className="vis-header">
        <div>
          <strong><i className="fas fa-wand-magic-sparkles" /> Story Mode Visualizer</strong>
          <span className="muted" style={{ marginLeft: 10 }}>{payload?.problemTitle || 'Story Visualizer'}</span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            className="theme-toggle-btn"
            title={voiceOn ? 'Mute voice' : 'Unmute voice'}
            onPointerDown={unlockAudio}
            onClick={() => {
              unlockAudio();
              const next = !voiceOn;
              setVoiceOn(next);
              try { localStorage.setItem('hiero-vis-voice', next ? 'on' : 'off'); } catch {}
              if (!next) stopVoice();
            }}
          >
            <i className={`fa-solid ${voiceOn ? 'fa-volume-high' : 'fa-volume-xmark'}`} />
          </button>
          <ThemeToggle className="vis-theme-btn theme-toggle-btn" />
          <button className="btn btn-ghost" onClick={() => (window.opener ? window.close() : navigate(-1))}>Close</button>
        </div>
      </div>
      <div className="vis-body">
        <div className="vis-stage">
          {values.length ? (
            <div className="vis-array-row">
              {values.map((val, i) => (
                <div key={i} style={{ textAlign: 'center' }}>
                  <div className={`vis-array-box${active.includes(i) ? ' is-assigning' : ''}`}>{String(val)}</div>
                  <div className="muted">{i}</div>
                </div>
              ))}
            </div>
          ) : <p className="muted">{error || 'Crafting the story of your code...'}</p>}
        </div>
        <aside className="vis-code-panel">
          <div style={{ padding: 12, fontWeight: 800 }} className="muted">LIVE CODE EXECUTION</div>
          {lines.map((line, i) => (
            <div key={i} className={`vis-code-line${step.line === i + 1 ? ' active' : ''}`}>
              <span className="muted">{i + 1}</span>
              <span>{line || ' '}</span>
            </div>
          ))}
        </aside>
      </div>
      <div className="vis-caption">{step.caption || error || 'Crafting the story of your code...'}</div>
      <div className="vis-controls">
        <div>Step {steps.length ? idx + 1 : 0} of {steps.length}</div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button className="btn btn-ghost" onPointerDown={unlockAudio} onClick={() => { unlockAudio(); setPlaying(false); setIdx(0); }}><i className="fas fa-rotate-left" /></button>
          <button className="btn btn-ghost" onPointerDown={unlockAudio} onClick={() => { unlockAudio(); setIdx((i) => Math.max(0, i - 1)); }}><i className="fas fa-backward-step" /></button>
          <button className="play-btn" onPointerDown={unlockAudio} onClick={() => { unlockAudio(); setPlaying((p) => !p); }}><i className={`fas ${playing ? 'fa-pause' : 'fa-play'}`} /></button>
          <button className="btn btn-ghost" onPointerDown={unlockAudio} onClick={() => { unlockAudio(); setIdx((i) => Math.min(steps.length - 1, i + 1)); }}><i className="fas fa-forward-step" /></button>
        </div>
        <div>
          {SPEEDS.map((s) => (
            <button key={s} className={`vis-speed-btn${speed === s ? ' active' : ''}`} onClick={() => changeSpeed(s)}>{s}×</button>
          ))}
        </div>
      </div>
    </div>
  );
}
