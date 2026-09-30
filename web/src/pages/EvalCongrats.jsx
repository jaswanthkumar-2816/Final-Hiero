import { useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import ThemeToggle from '../components/ThemeToggle.jsx';

export default function EvalCongrats() {
  const [params] = useSearchParams();
  const saved = useMemo(() => {
    try { return JSON.parse(sessionStorage.getItem('hieroEvalCongrats') || 'null'); } catch { return null; }
  }, []);
  const skill = params.get('skill') || saved?.skill || 'this skill';
  const level = params.get('level') || saved?.level || saved?.result?.level || '';

  return (
    <div className="eval-wrap">
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}><ThemeToggle /></div>
      <section className="eval-hero" style={{ textAlign: 'center', padding: 48 }}>
        <div className="pill"><i className="fa-solid fa-certificate" /> Verified</div>
        <h1 className="page-title">You proved {skill}{level ? ` · Level ${level}` : ''}</h1>
        <p className="page-sub" style={{ margin: '0 auto' }}>A pass adds a Verified badge to your resume. Keep the skill on your profile and continue learning.</p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 22 }}>
          <Link className="btn btn-main" to="/resume-builder">Open resume builder</Link>
          <Link className="btn btn-ghost" to={`/learn-beginner?skill=${encodeURIComponent(skill)}`}>Back to learn</Link>
        </div>
      </section>
    </div>
  );
}
