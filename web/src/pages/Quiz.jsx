import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import AppShell from '../components/AppShell.jsx';
import { post, userId } from '../api/client.js';

const SKILLS = ['Python', 'JavaScript', 'Java', 'DSA', 'React', 'SQL', 'Git', 'C++'];

export default function Quiz() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const recommended = params.get('skill') || 'Python';
  const [skill, setSkill] = useState(recommended);
  const [custom, setCustom] = useState('');
  const [busy, setBusy] = useState('');

  const selected = useMemo(() => custom.trim() || skill, [custom, skill]);

  async function choose(level) {
    setBusy(level);
    try {
      if (level === 'beginner') {
        await post('/api/mastery/set-beginner-level', { userId: userId(), skill: selected }).catch(() => ({}));
        navigate(`/learn-beginner?skill=${encodeURIComponent(selected)}&track=beginner`);
        return;
      }
      if (level === 'intermediate') {
        navigate(`/learn-intermediate?skill=${encodeURIComponent(selected)}&track=intermediate`);
        return;
      }
      navigate(`/eval?skill=${encodeURIComponent(selected)}&track=beginner`);
    } finally {
      setBusy('');
    }
  }

  return (
    <AppShell backTo="/result" pageClass="learn-page">
      <div className="hero-section">
        <div className="target-badge"><i className="fa-solid fa-book-open" /> Skill assessment & placement</div>
        <h1 className="page-title">How do you want to learn?</h1>
        <p className="page-sub">Pick a skill, then choose beginner, intermediate, or prove it with Hiero Eval. Same paths as the live HTML portal.</p>
      </div>

      <section className="card" style={{ marginTop: 22 }}>
        <div className="step-indicator-tag">Step 1 · Choose a skill</div>
        <div className="skill-pick-grid">
          {SKILLS.map((name) => (
            <button key={name} className={`skill-pick${skill === name && !custom ? ' selected' : ''}`} onClick={() => { setSkill(name); setCustom(''); }}>
              {name === recommended ? <div className="pill">Recommended</div> : null}
              <div>{name}</div>
            </button>
          ))}
        </div>
        <input className="form-grid" style={{ width: '100%', padding: 12, borderRadius: 12, border: '1px solid var(--border)', background: 'var(--card-inner-bg)', color: 'inherit' }} placeholder="Or type another skill" value={custom} onChange={(e) => setCustom(e.target.value)} />
      </section>

      <div className="grid-3" style={{ marginTop: 22 }}>
        <button className="level-card path-beginner" onClick={() => choose('beginner')} disabled={!!busy}>
          <div className="pill"><i className="fa-solid fa-seedling" /> Beginner</div>
          <h3>Start from scratch</h3>
          <p className="muted">Follow 3 tutorials, then practice 9 problems. Ask Orbit whenever a concept is unclear.</p>
          <span className="btn btn-main" style={{ marginTop: 16, display: 'inline-block' }}>{busy === 'beginner' ? 'Opening…' : 'Beginner path'}</span>
        </button>
        <button className="level-card path-intermediate" onClick={() => choose('intermediate')} disabled={!!busy}>
          <div className="pill"><i className="fa-solid fa-layer-group" /> Intermediate</div>
          <h3>Fill the gaps</h3>
          <p className="muted">You already know some {selected}. We’ll pinpoint topics you still need.</p>
          <span className="btn btn-ghost" style={{ marginTop: 16, display: 'inline-block' }}>{busy === 'intermediate' ? 'Opening…' : 'Intermediate path'}</span>
        </button>
        <button className="level-card" onClick={() => choose('eval')} disabled={!!busy}>
          <div className="pill"><i className="fa-solid fa-shield-halved" /> Eval</div>
          <h3>Prove it</h3>
          <p className="muted">Already learned {selected}? Verify it. A pass adds a badge; a fail never removes the skill.</p>
          <span className="btn btn-ghost" style={{ marginTop: 16, display: 'inline-block' }}>Open Hiero Eval</span>
        </button>
      </div>
    </AppShell>
  );
}
