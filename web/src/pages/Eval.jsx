import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import ThemeToggle from '../components/ThemeToggle.jsx';
import { get, post, userId } from '../api/client.js';

function catalogFor(skillName) {
  const s = String(skillName || '').toLowerCase();
  const fallback = {
    1: { topics: ['Basics', 'Core syntax', 'Simple problems'], sample: 'What is the simplest correct definition of this skill?' },
    2: { topics: ['Patterns', 'Errors', 'Structure'], sample: 'When should you pick one approach over another?' },
    3: { topics: ['Advanced tools', 'Trade-offs', 'Production'], sample: 'What breaks first when this skill is used at scale?' },
  };
  if (s.includes('python')) return {
    1: { topics: ['Syntax', 'Variables', 'Functions'], sample: 'What does a Python function return if there is no return statement?' },
    2: { topics: ['Lists & dicts', 'Errors', 'Modules'], sample: 'When is a dictionary a better choice than a list?' },
    3: { topics: ['OOP', 'Decorators', 'Async'], sample: 'What problem do decorators solve in Python?' },
  };
  return fallback;
}

export default function Eval() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const skill = params.get('skill') || 'Python';
  const track = params.get('track') || 'beginner';
  const [status, setStatus] = useState(null);
  const [chosenLevel, setChosenLevel] = useState(1);
  const catalog = catalogFor(skill);
  const rec = status?.recommendedLevel || 1;
  const learnHref = `/${track === 'intermediate' ? 'learn-intermediate' : 'learn-beginner'}?skill=${encodeURIComponent(skill)}&track=${track}`;

  useEffect(() => {
    get(`/api/eval/status?userId=${encodeURIComponent(userId())}&skill=${encodeURIComponent(skill)}`)
      .then((s) => {
        setStatus(s);
        setChosenLevel(s.recommendedLevel || 1);
      })
      .catch(() => setStatus({}));
  }, [skill]);

  async function startEval() {
    if (status?.canStart === false) {
      alert(status.error || 'Could not start eval right now.');
      return;
    }
    const json = await post('/api/eval/start', {
      userId: userId(),
      skill,
      level: chosenLevel,
      challengeUp: chosenLevel > rec,
    });
    if (!json.success) {
      alert(json.error || 'Could not start eval');
      return;
    }
    sessionStorage.setItem('hieroEvalRound', JSON.stringify({
      skill, track, userId: userId(), status, chosenLevel, attempt: json,
      qIdx: 0, answers: Array(json.quiz.length).fill(null), codingSubs: [], cIdx: 0,
      endsAt: Date.now() + json.timeLimitSec * 1000,
    }));
    navigate(`/eval-round?skill=${encodeURIComponent(skill)}&track=${encodeURIComponent(track)}`);
  }

  return (
    <div className="eval-wrap">
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 18 }}>
        <Link className="btn btn-ghost" to={learnHref}><i className="fa-solid fa-arrow-left" /> Back</Link>
        <ThemeToggle />
      </div>
      <section className="eval-hero">
        <div className="pill"><i className="fa-solid fa-shield-halved" /> Hiero Eval · Resume verification</div>
        <h1 className="page-title">Prove you know <span style={{ color: 'var(--primary)' }}>{skill}</span></h1>
        <p className="page-sub">A pass adds a Verified badge to your resume. A fail never removes the skill — it stays unverified until you pass.</p>
      </section>
      <div className="chip-row" style={{ marginBottom: 16 }}>
        {status?.verifiedLevel
          ? <span className="chip">Verified — Level {status.verifiedLevel}</span>
          : <span className="chip">Unverified on resume</span>}
        <span className="chip">Auto level from your path: {rec}</span>
      </div>
      <div className="grid-3">
        {[1, 2, 3].map((level) => (
          <button key={level} className={`level-card${chosenLevel === level ? ' selected' : ''}`} onClick={() => setChosenLevel(level)}>
            <div className="pill">Level {level}</div>
            <h3>{catalog[level].topics.join(' · ')}</h3>
            <p className="muted">{catalog[level].sample}</p>
          </button>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 10, marginTop: 22 }}>
        <button className="btn btn-main" onClick={startEval}>Start Level {chosenLevel} eval</button>
        <Link className="btn btn-ghost" to={learnHref}>Learn first</Link>
      </div>
    </div>
  );
}
