import { Navigate, useSearchParams } from 'react-router-dom';

export default function LearnRedirect() {
  const [params] = useSearchParams();
  const skill = params.get('skill');
  const track = String(params.get('track') || '').toLowerCase();
  if (!skill && track !== 'beginner' && track !== 'intermediate') {
    return <Navigate to="/quiz" replace />;
  }
  const next = track === 'intermediate' ? '/learn-intermediate' : '/learn-beginner';
  const q = new URLSearchParams(params);
  q.set('track', track === 'intermediate' ? 'intermediate' : 'beginner');
  return <Navigate to={`${next}?${q.toString()}`} replace />;
}
