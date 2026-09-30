import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AppShell from '../components/AppShell.jsx';
import { get } from '../api/client.js';

export default function Companies() {
  const [items, setItems] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    get('/api/opportunities').then((data) => {
      setItems(data.opportunities || data.companies || data.items || []);
    }).catch((err) => setError(err.message));
  }, []);

  return (
    <AppShell>
      <div className="pill"><i className="fa-solid fa-building" /> Target companies</div>
      <h1 className="page-title">Companies matching your profile</h1>
      <p className="page-sub">Same `/api/opportunities` feed. Original HTML remains at `/companies.html`.</p>
      {error ? <p className="error">{error}</p> : null}
      <div className="grid-3" style={{ marginTop: 22 }}>
        {items.map((c, i) => (
          <article key={c.id || c.name || i} className="card">
            <h3>{c.name || c.company || c.title}</h3>
            <p className="muted">{c.role || c.description || c.location}</p>
            <Link className="btn btn-ghost" style={{ marginTop: 12, display: 'inline-block' }} to={`/company?id=${encodeURIComponent(c.id || c.name || i)}`}>View</Link>
          </article>
        ))}
        {!items.length && !error ? <p className="muted">No companies returned yet.</p> : null}
      </div>
    </AppShell>
  );
}

export function Company() {
  return (
    <AppShell backTo="/companies">
      <h1 className="page-title">Company</h1>
      <p className="page-sub">Open the original page at `/company.html` if you need the full recruiter workflow. This React route keeps navigation consistent.</p>
    </AppShell>
  );
}
