import { createContext, useContext, useMemo, useState } from 'react';

const AuthContext = createContext(null);

function readUser() {
  try {
    return JSON.parse(localStorage.getItem('user') || 'null');
  } catch {
    return null;
  }
}

function initialsFor(user) {
  const name = user?.name || user?.email || 'H';
  if (user?.name) {
    return user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
  }
  return String(name)[0].toUpperCase();
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readUser);

  const value = useMemo(() => ({
    user,
    initials: initialsFor(user),
    firstName: (user?.name || user?.email || 'Guest').split(' ')[0].split('@')[0],
    setUser(next) {
      try {
        if (next) localStorage.setItem('user', JSON.stringify(next));
        else localStorage.removeItem('user');
      } catch {}
      setUser(next);
    },
  }), [user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
