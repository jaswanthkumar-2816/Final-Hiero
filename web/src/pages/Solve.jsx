import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import AppShell from '../components/AppShell.jsx';
import { get } from '../api/client.js';

const LANGS = [
  { id: 'python', name: 'Python', ext: 'py' },
  { id: 'javascript', name: 'JavaScript', ext: 'js' },
  { id: 'java', name: 'Java', ext: 'java' },
  { id: 'cpp', name: 'C++', ext: 'cpp' },
  { id: 'c', name: 'C', ext: 'c' },
];

export default function Solve() {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const skill = params.get('skill') || 'DSA';
  const [lang, setLang] = useState((params.get('code') || 'python').replace('c++', 'cpp'));
  const [problems, setProblems] = useState([]);
  const [idx, setIdx] = useState(0);
  const [code, setCode] = useState('');
  const [filter, setFilter] = useState('all');
  const [consoleText, setConsoleText] = useState('');

  const active = problems[idx];
  const filtered = useMemo(() => {
    if (filter === 'all') return problems.map((p, i) => ({ p, i }));
    return problems.map((p, i) => ({ p, i })).filter(({ p }) => String(p.difficulty).toLowerCase() === filter);
  }, [problems, filter]);

  useEffect(() => {
    let cancelled = false;
    get(`/api/problems/by-skill?skill=${encodeURIComponent(skill)}&lang=${encodeURIComponent(lang)}`)
      .then((data) => {
        if (cancelled) return;
        const list = data.problems || [];
        setProblems(list);
        const first = list[0];
        setIdx(0);
        setCode(first?.starterCode || '');
      })
      .catch(() => { if (!cancelled) setProblems([]); });
    return () => { cancelled = true; };
  }, [skill, lang]);

  function select(i) {
    setIdx(i);
    setCode(problems[i]?.starterCode || '');
  }

  function changeLang(next) {
    setLang(next);
    const nextParams = new URLSearchParams(params);
    nextParams.set('code', next === 'cpp' ? 'c++' : next);
    setParams(nextParams, { replace: true });
  }

  function visualize() {
    if (!code.trim()) {
      setConsoleText('> Write or paste some code first, then click Visualize My Code.');
      return;
    }
    localStorage.setItem('hieroVisualizePayload', JSON.stringify({
      code,
      language: lang,
      problemTitle: active?.title || '',
      problemType: active?.difficulty || '',
      testCases: active?.testCases || [],
    }));
    navigate('/visualize');
  }

  async function runTests() {
    setConsoleText('> Running…');
    try {
      const data = await get(`/api/problems/by-skill?skill=${encodeURIComponent(skill)}&lang=${encodeURIComponent(lang)}`);
      setConsoleText(`> Loaded ${data.count || (data.problems || []).length} problems for ${skill}. Use Visualize My Code to step through this solution.`);
    } catch (err) {
      setConsoleText(`> ${err.message}`);
    }
  }

  return (
    <AppShell backTo={`/learn-beginner?skill=${encodeURIComponent(skill)}`} backLabel="BACK TO LEARN">
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <div className="pill">Problem solving · {skill}</div>
          <h1 className="page-title" style={{ fontSize: 28 }}>{active?.title || 'Choose a problem'}</h1>
        </div>
        <div className="lang-tabs" id="solve-lang-tabs">
          {LANGS.map((l) => (
            <button key={l.id} className={`lang-tab${lang === l.id ? ' active' : ''}`} onClick={() => changeLang(l.id)}>{l.name}</button>
          ))}
        </div>
      </div>

      <div className="lang-tabs" style={{ margin: '12px 0' }}>
        {['all', 'easy', 'medium', 'hard'].map((d) => (
          <button key={d} className={`lang-tab${filter === d ? ' active' : ''}`} onClick={() => setFilter(d)}>{d}</button>
        ))}
      </div>

      <div className="solve-layout">
        <aside className="problem-list">
          {filtered.map(({ p, i }) => (
            <button key={p.id || i} className={`problem-item${i === idx ? ' active' : ''}`} onClick={() => select(i)}>
              <div className="diff">{p.difficulty}</div>
              <div>{p.title}</div>
            </button>
          ))}
        </aside>
        <section>
          <p className="page-sub">{active?.description}</p>
          {active?.hint ? <p className="muted" style={{ marginTop: 8 }}>Hint: {active.hint}</p> : null}
          <div className="muted" style={{ margin: '12px 0 6px' }}>SOLUTION.{LANGS.find((l) => l.id === lang)?.ext}</div>
          <textarea className="code-area" value={code} onChange={(e) => setCode(e.target.value)} spellCheck={false} />
          <div className="solve-actions">
            <button className="btn btn-ghost" onClick={runTests}>Run</button>
            <button className="btn btn-main" onClick={visualize}><i className="fas fa-wand-magic-sparkles" /> Visualize My Code</button>
          </div>
          {consoleText ? <pre className="muted" style={{ marginTop: 12, whiteSpace: 'pre-wrap' }}>{consoleText}</pre> : null}
        </section>
      </div>
    </AppShell>
  );
}
