import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext.jsx';

export default function ThemeToggle({ className = 'theme-toggle-btn' }) {
  const { isLight, toggleTheme } = useTheme();
  return (
    <button type="button" className={className} onClick={toggleTheme} title={isLight ? 'Switch to dark theme' : 'Switch to light theme'} aria-label="Switch theme">
      <i className={isLight ? 'fa-solid fa-moon' : 'fa-solid fa-sun'} />
    </button>
  );
}

export function NavLinkItem({ to, icon, label, active }) {
  return (
    <Link to={to} className={`nav-btn${active ? ' active' : ''}`}>
      <i className={icon} />
      <span>{label}</span>
    </Link>
  );
}
