import { Link, useLocation } from 'react-router-dom';
import ThemeToggle, { NavLinkItem } from './ThemeToggle.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const LINKS = [
  { to: '/resume-builder', icon: 'fa-regular fa-file-lines', label: 'Resume Builder', match: ['/resume-builder', '/resume-form'] },
  { to: '/result', icon: 'fa-solid fa-magnifying-glass', label: 'Analyse Resume', match: ['/result', '/analysis'] },
  { to: '/companies', icon: 'fa-solid fa-building', label: 'Target Companies', match: ['/companies', '/company'] },
  { to: '/mock-interview', icon: 'fa-solid fa-microphone', label: 'Mock Interview', match: ['/mock-interview', '/session'] },
  { to: '/quiz', icon: 'fa-solid fa-book-open', label: 'Learn Skills', match: ['/quiz', '/learn', '/learn-beginner', '/learn-intermediate', '/playlist'] },
  { to: '/eval', icon: 'fa-solid fa-shield-halved', label: 'Hiero Eval', match: ['/eval', '/eval-round', '/eval-congrats'] },
];

export default function AppShell({ children, backTo, backLabel = 'BACK', pageClass = '' }) {
  const loc = useLocation();
  const { initials } = useAuth();

  return (
    <div className={`hiero-shell ${pageClass}`.trim()}>
      <header className="nav-header">
        <Link to="/" className="app-brand">
          <div className="app-logo-box"><img src="/logo-hiero.png" alt="Hiero" /></div>
          <span>HIERO</span>
        </Link>
        <nav className="nav-menu">
          {LINKS.map((item) => (
            <NavLinkItem
              key={item.to}
              to={item.to}
              icon={item.icon}
              label={item.label}
              active={item.match.some((m) => loc.pathname === m || loc.pathname.startsWith(m + '/'))}
            />
          ))}
        </nav>
        <div className="nav-actions">
          <ThemeToggle />
          <div className="user-profile-nav">
            <div className="user-avatar-small">{initials}</div>
          </div>
        </div>
      </header>
      <main className="app-container">
        {backTo ? (
          <Link to={backTo} className="btn-back"><i className="fa-solid fa-arrow-left" /> {backLabel}</Link>
        ) : null}
        {children}
      </main>
    </div>
  );
}
