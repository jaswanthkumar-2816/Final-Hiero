import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import AppShell from '../components/AppShell.jsx';
import { post } from '../api/client.js';

const LANGS = ['English', 'Hindi', 'Telugu', 'Tamil', 'Kannada'];
const CODE_LANGS = ['Python', 'JavaScript', 'Java', 'C++'];

function youtubeId(video) {
  const src = String(video?.videoId || video?.youtube_id || video?.url || '');
  const m = src.match(/(?:v=|youtu\.be\/|embed\/)([\w-]{11})/) || src.match(/^([\w-]{11})$/);
  return m ? m[1] : '';
}

export default function LearnPath({ track = 'beginner' }) {
  const [params] = useSearchParams();
  const skill = params.get('skill') || 'Python';
  const [lang, setLang] = useState('English');
  const [codeLang, setCodeLang] = useState(params.get('code') || 'Python');
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeVideo, setActiveVideo] = useState(null);
  const [orbitOpen, setOrbitOpen] = useState(false);
  const [chat, setChat] = useState([{ role: 'bot', content: `Hi — I'm Orbit. Ask me anything about ${skill}.` }]);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [locate, setLocate] = useState(null);
  const historyRef = useRef([]);
  const bodyRef = useRef(null);

  const isBeginner = track === 'beginner';

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    post('/api/analysis/get-videos', {
      skill,
      score: track === 'beginner' ? 20 : 55,
      lang: lang.toLowerCase(),
      track,
      codingLang: codeLang,
    }).then((data) => {
      if (cancelled) return;
      const pack = data.data?.videos || data.videos || {};
      const langKey = lang.toLowerCase();
      const list = pack[langKey] || pack.english || (Array.isArray(pack) ? pack : Object.values(pack)[0]) || [];
      setVideos(Array.isArray(list) ? list.slice(0, 3) : []);
    }).catch(() => {
      if (!cancelled) setVideos([]);
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, [skill, lang, codeLang, track]);

  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
  }, [chat, locate, orbitOpen]);

  const ytId = useMemo(() => youtubeId(activeVideo), [activeVideo]);

  async function sendOrbit(e) {
    e?.preventDefault();
    const text = draft.trim();
    if (!text || sending) return;
    setDraft('');
    setChat((prev) => [...prev, { role: 'user', content: text }, { role: 'bot', content: 'Orbit is thinking...' }]);
    setSending(true);
    try {
      const listed = videos[0] || {};
      const res = await post('/api/chat', {
        message: text,
        context: {
          page_type: 'learning',
          skill,
          language: lang.toLowerCase(),
          codingLang: codeLang,
          videoId: ytId || listed.videoId,
          videoTitle: activeVideo?.title || listed.title || '',
          tutorials: videos.map((v) => v.title).filter(Boolean),
        },
        skill,
        videoId: ytId || listed.videoId,
        videoTitle: activeVideo?.title || listed.title || '',
        conversationHistory: historyRef.current,
      });
      const answer = res.answer || res.token || "I'm sorry, I couldn't process that.";
      const loc = res.locate && res.locate.success ? res.locate : null;
      historyRef.current = [...historyRef.current, { role: 'user', content: text }, { role: 'assistant', content: answer }].slice(-6);
      setChat((prev) => {
        const next = prev.slice();
        next[next.length - 1] = { role: 'bot', content: answer };
        return next;
      });
      setLocate(loc);
    } catch {
      setChat((prev) => {
        const next = prev.slice();
        next[next.length - 1] = { role: 'bot', content: 'Error connecting to AI tutor. Please check your connection.' };
        return next;
      });
    } finally {
      setSending(false);
    }
  }

  function playFromLocate() {
    if (!locate) return;
    const start = Math.max(0, Math.floor(Number(locate.start || locate.timestamp || 0)));
    const id = locate.videoId || ytId;
    if (id) setActiveVideo({ videoId: id, title: locate.videoTitle || activeVideo?.title, start });
    setOrbitOpen(true);
  }

  function closePlayer() {
    setActiveVideo(null);
    setChat([{ role: 'bot', content: `Welcome back. What in ${skill} should we look at next?` }]);
    setLocate(null);
  }

  return (
    <AppShell backTo="/quiz" backLabel="CHOOSE A DIFFERENT PATH" pageClass="learn-page">
      <div className="selection-flow-card">
        <div className="beginner-welcome-pill">
          <i className={`fa-solid ${isBeginner ? 'fa-seedling' : 'fa-layer-group'}`} />
          {isBeginner ? 'Beginner path · start from scratch' : 'Intermediate path · fill the gaps'}
        </div>
        <div className="step-indicator-tag"><i className="fa-solid fa-bullseye" /> {isBeginner ? 'BEGINNER • GUIDED LESSONS FROM ZERO' : 'INTERMEDIATE • TARGETED LESSONS'}</div>
        <h2 className="page-title" style={{ fontSize: 28 }}>You're learning <span style={{ color: 'var(--primary)' }}>{skill}</span></h2>
        <p className="page-sub">Watch the 3 full tutorials below in your language. Pause, replay, and ask Orbit whenever a concept is unclear — then practice what you understood.</p>
        <p className="muted" style={{ marginTop: 8 }}>Wrong skill? <Link to="/quiz" style={{ color: 'var(--primary)', fontWeight: 700, textDecoration: 'none' }}>Change skill</Link></p>

        <div className="step-indicator-tag" style={{ marginTop: 22 }}><i className="fa-solid fa-language" /> STEP 2 • CHOOSE YOUR PREFERRED LANGUAGE</div>
        <div className="lang-tabs">
          {LANGS.map((name) => (
            <button key={name} className={`lang-tab${lang === name ? ' active' : ''}`} onClick={() => setLang(name)}>{name}</button>
          ))}
        </div>
        <div className="step-indicator-tag" style={{ marginTop: 18 }}><i className="fa-solid fa-code" /> STEP 3 • CHOOSE CODING LANGUAGE</div>
        <div className="lang-tabs">
          {CODE_LANGS.map((name) => (
            <button key={name} className={`lang-tab${codeLang === name ? ' active' : ''}`} onClick={() => setCodeLang(name)}>{name}</button>
          ))}
        </div>

        <div style={{ marginTop: 22, display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <div>
            <div className="step-indicator-tag"><i className="fa-solid fa-code" /> PRACTICE • SOLVE 9 PROBLEMS</div>
            <h3>Practice what you just learned</h3>
          </div>
          <Link className="btn btn-main" to={`/solve?skill=${encodeURIComponent(skill)}&code=${encodeURIComponent(codeLang)}`}>Open problem solving</Link>
        </div>
      </div>

      <section style={{ marginTop: 24 }}>
        <div className="step-indicator-tag"><i className="fa-brands fa-youtube" /> Three tutorials</div>
        {loading ? <p className="muted">Finding videos and problems for this skill…</p> : null}
        <div className="video-grid">
          {videos.map((v, i) => {
            const id = youtubeId(v);
            return (
            <article key={v.videoId || v.url || i} className="card video-card">
              <img className="video-thumb" src={v.thumbnail || (id ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : '')} alt="" />
              <div className="video-title">{v.title || `Tutorial ${i + 1}`}</div>
              <p className="muted">{v.channel || v.reason || 'Recommended for this skill'}</p>
              <button className="btn btn-main" style={{ marginTop: 12 }} onClick={() => { setActiveVideo(v); setOrbitOpen(true); }}>Watch</button>
            </article>
            );
          })}
          {!loading && videos.length === 0 ? <p className="muted">No tutorials returned yet. Orbit can still help you study {skill}.</p> : null}
        </div>
      </section>

      {activeVideo ? (
        <div className="card" style={{ marginTop: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
            <strong>{activeVideo.title || 'Tutorial'}</strong>
            <button className="btn btn-ghost" onClick={closePlayer}>Leave video</button>
          </div>
          {ytId ? (
            <iframe
              title="tutorial"
              style={{ width: '100%', aspectRatio: '16/9', border: 0, borderRadius: 16, marginTop: 12 }}
              src={`https://www.youtube.com/embed/${ytId}?start=${activeVideo.start || 0}&autoplay=1`}
              allow="autoplay; encrypted-media"
            />
          ) : <p className="muted">This tutorial has no playable YouTube id.</p>}
        </div>
      ) : null}

      {orbitOpen ? (
        <div className="orbit-dock">
          <div className="orbit-head">
            <span><i className="fa-solid fa-robot" /> Orbit</span>
            <button className="theme-toggle-btn" style={{ width: 32, height: 32 }} onClick={() => setOrbitOpen(false)}><i className="fa-solid fa-xmark" /></button>
          </div>
          <div className="orbit-body" ref={bodyRef}>
            {chat.map((m, i) => <div key={i} className={`message ${m.role}`}>{m.content}</div>)}
            {locate ? (
              <div className="locate-card">
                <div>{locate.brief || locate.explanation || 'I found that moment in the selected tutorial.'}</div>
                <button className="btn btn-main" style={{ marginTop: 8 }} onClick={playFromLocate}>Play from that time</button>
              </div>
            ) : null}
          </div>
          <form className="orbit-input" onSubmit={sendOrbit}>
            <input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Ask about this skill…" />
            <button className="btn btn-main" disabled={sending}>Send</button>
          </form>
        </div>
      ) : (
        <button className="orbit-float" onClick={() => setOrbitOpen(true)} title="Ask Orbit"><i className="fa-solid fa-robot" /></button>
      )}
    </AppShell>
  );
}
