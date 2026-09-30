import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const ThemeContext = createContext(null);

function readTheme() {
  try {
    return localStorage.getItem('theme') || localStorage.getItem('hiero-theme') || 'dark';
  } catch {
    return 'dark';
  }
}

function applyDomTheme(theme) {
  const light = theme === 'light';
  document.documentElement.setAttribute('data-theme', light ? 'light' : 'dark');
  document.documentElement.classList.toggle('light-mode', light);
  document.body.classList.toggle('light-mode', light);
  document.documentElement.style.colorScheme = light ? 'light' : 'dark';
}

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(readTheme);

  useEffect(() => {
    applyDomTheme(theme);
  }, [theme]);

  const value = useMemo(() => ({
    theme,
    isLight: theme === 'light',
    setTheme(next) {
      const resolved = next === 'light' ? 'light' : 'dark';
      try {
        localStorage.setItem('theme', resolved);
        localStorage.setItem('hiero-theme', resolved);
      } catch {}
      setThemeState(resolved);
    },
    toggleTheme() {
      const next = theme === 'light' ? 'dark' : 'light';
      try {
        localStorage.setItem('theme', next);
        localStorage.setItem('hiero-theme', next);
      } catch {}
      setThemeState(next);
    },
  }), [theme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside ThemeProvider');
  return ctx;
}
