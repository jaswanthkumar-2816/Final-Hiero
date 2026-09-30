import { Link } from 'react-router-dom';
import AppShell from '../components/AppShell.jsx';

export default function Analysis() {
  return (
    <AppShell>
      <div className="pill"><i className="fa-solid fa-chart-line" /> Analysis</div>
      <h1 className="page-title">Resume analysis workspace</h1>
      <p className="page-sub">Upload and review from Analyse Resume. The original HTML analysis page stays recoverable at `/analysis.html`.</p>
      <div className="grid-2" style={{ marginTop: 22 }}>
        <Link className="card" to="/result"><h3>Analyse a resume</h3><p className="muted">Extract skills and open a learning path.</p></Link>
        <Link className="card" to="/resume-builder"><h3>Edit resume</h3><p className="muted">Same backend, React form.</p></Link>
      </div>
    </AppShell>
  );
}
