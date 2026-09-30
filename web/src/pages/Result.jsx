import { useState } from 'react';
import { Link } from 'react-router-dom';
import AppShell from '../components/AppShell.jsx';
import { post } from '../api/client.js';

export default function Result() {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState('');
  const [analysis, setAnalysis] = useState(null);

  async function analyze(e) {
    e.preventDefault();
    if (!file) {
      setStatus('Choose a resume file first.');
      return;
    }
    setStatus('Analysing…');
    const body = new FormData();
    body.append('resume', file);
    body.append('file', file);
    try {
      const res = await fetch('/api/analysis/upload', { method: 'POST', body });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const fallback = await post('/api/analysis/analyze', { fileName: file.name }).catch(() => data);
        setAnalysis(fallback);
        setStatus(fallback.error ? fallback.error : 'Analysis complete');
        return;
      }
      setAnalysis(data);
      setStatus('Analysis complete');
    } catch (err) {
      setStatus(err.message);
    }
  }

  const skills = analysis?.skills || analysis?.missingSkills || analysis?.recommendedSkills || [];

  return (
    <AppShell pageClass="result-page">
      <div className="pill"><i className="fa-solid fa-magnifying-glass" /> Analyse resume</div>
      <h1 className="page-title">See which skills to learn next</h1>
      <p className="page-sub">Upload a resume. We keep the same analysis APIs and send you into Learn Skills with a recommended path.</p>
      <form className="card" style={{ marginTop: 20 }} onSubmit={analyze}>
        <input type="file" accept=".pdf,.doc,.docx" onChange={(e) => setFile(e.target.files?.[0] || null)} />
        <div style={{ marginTop: 14 }}>
          <button className="btn btn-main" type="submit">Analyse</button>
        </div>
        {status ? <p className="muted" style={{ marginTop: 10 }}>{status}</p> : null}
      </form>
      {analysis ? (
        <section className="card" style={{ marginTop: 18 }}>
          <h3>{analysis.role || analysis.summary || 'Recommended next skills'}</h3>
          <div className="skill-pick-grid">
            {(Array.isArray(skills) ? skills : []).slice(0, 8).map((s) => {
              const name = s.skill || s.name || s;
              return (
                <Link key={name} className="skill-pick" to={`/quiz?skill=${encodeURIComponent(name)}`}>{name}</Link>
              );
            })}
          </div>
          <Link className="btn btn-main" to="/quiz">Continue to Learn Skills</Link>
        </section>
      ) : null}
    </AppShell>
  );
}
