import { Link } from 'react-router-dom';
import AppShell from '../components/AppShell.jsx';

export function SimplePage({ title, kicker, sub, children, backTo }) {
  return (
    <AppShell backTo={backTo}>
      {kicker ? <div className="pill">{kicker}</div> : null}
      <h1 className="page-title">{title}</h1>
      {sub ? <p className="page-sub">{sub}</p> : null}
      <div style={{ marginTop: 22 }}>{children}</div>
    </AppShell>
  );
}

export default function Started() {
  return (
    <SimplePage title="Get started with Hiero" kicker="Welcome" sub="Same student journeys as the HTML portal, now routed in React.">
      <div className="grid-3">
        <Link className="card" to="/quiz"><h3>Learn Skills</h3><p className="muted">Beginner or intermediate path, then practice.</p></Link>
        <Link className="card" to="/resume-builder"><h3>Resume Builder</h3><p className="muted">Keep your Hiero resume in sync.</p></Link>
        <Link className="card" to="/result"><h3>Analyse Resume</h3><p className="muted">Find the next skill to learn.</p></Link>
      </div>
    </SimplePage>
  );
}
