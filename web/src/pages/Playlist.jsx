import { useSearchParams } from 'react-router-dom';
import AppShell from '../components/AppShell.jsx';

export default function Playlist() {
  const [params] = useSearchParams();
  const skill = params.get('skill') || 'this skill';
  return (
    <AppShell backTo={`/learn-beginner?skill=${encodeURIComponent(skill)}`}>
      <div className="pill"><i className="fa-solid fa-list" /> Playlist</div>
      <h1 className="page-title">Tutorials for {skill}</h1>
      <p className="page-sub">The full cinematic playlist still lives at `/playlist.html`. This React route keeps the student map complete.</p>
    </AppShell>
  );
}
