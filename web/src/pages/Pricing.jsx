import AppShell from '../components/AppShell.jsx';

export default function Pricing() {
  return (
    <AppShell>
      <div className="pill">Hiero Pro</div>
      <h1 className="page-title">Upgrade when you are ready</h1>
      <p className="page-sub">Payments still go through `/api/payment`. The original pricing page remains at `/pricing.html`.</p>
      <div className="grid-2" style={{ marginTop: 22 }}>
        <article className="card"><h3>Free</h3><p className="muted">Learn, solve, visualize, and eval.</p></article>
        <article className="card"><h3>Pro</h3><p className="muted">Resume templates, extra evals, and priority feedback.</p></article>
      </div>
    </AppShell>
  );
}
