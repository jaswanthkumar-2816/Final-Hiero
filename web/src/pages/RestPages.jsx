import { Link } from 'react-router-dom';
import { SimplePage } from './Started.jsx';

export function Login() {
  return (
    <SimplePage title="Log in" kicker="Account" sub="Auth APIs stay on Express. The original login page remains at `/login.html`.">
      <a className="btn btn-main" href="/login.html">Open current login</a>
    </SimplePage>
  );
}

export function MockInterview() {
  return (
    <SimplePage title="Mock interview" kicker="Practice" sub="The live interview room is still served from the HTML portal.">
      <a className="btn btn-main" href="/mock-interview.html">Open mock interview</a>
    </SimplePage>
  );
}

export function ProjectPage() {
  return (
    <SimplePage title="Projects" kicker="Build">
      <p className="muted">Project APIs remain at `/api/projects`. Original page: `/project.html`.</p>
    </SimplePage>
  );
}

export function ResumeForm() {
  return (
    <SimplePage title="Resume form" backTo="/resume-builder">
      <Link className="btn btn-main" to="/resume-builder">Continue in React builder</Link>
    </SimplePage>
  );
}

export function ResumeReview() {
  return (
    <SimplePage title="Resume review" backTo="/resume-builder">
      <a className="btn btn-main" href="/resume-review.html">Open original review</a>
    </SimplePage>
  );
}

export function SkillProblems() {
  return (
    <SimplePage title="Skill problems" sub="Problem packs now open in the React solve page.">
      <Link className="btn btn-main" to="/solve">Go to Solve</Link>
    </SimplePage>
  );
}

export function Questions() {
  return (
    <SimplePage title="Questions">
      <Link className="btn btn-main" to="/solve">Go to Solve</Link>
    </SimplePage>
  );
}

export function HieroExplained() {
  return (
    <SimplePage title="Hiero explained" kicker="About">
      <p className="muted">Hiero was the earlier production portal. This React app keeps the same UX while migrating the student frontend.</p>
    </SimplePage>
  );
}

export function HieroAstra() {
  return (
    <SimplePage title="Hiero Astra">
      <a className="btn btn-main" href="/hiero-astra.html">Open original Astra page</a>
    </SimplePage>
  );
}

export function AdaptiveTest() {
  return (
    <SimplePage title="Adaptive test">
      <Link className="btn btn-main" to="/quiz">Open skill placement</Link>
    </SimplePage>
  );
}

export function JobSuccess() {
  return (
    <SimplePage title="Application sent">
      <Link className="btn btn-main" to="/companies">Back to companies</Link>
    </SimplePage>
  );
}
