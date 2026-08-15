'use client';
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  name?: string;
  email?: string;
  role?: string;
  organizationCode?: string;
  organizationName?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({ user: null, loading: true, logout: async () => {} });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d && !d.error) {
          const u = d.user || d;
          setUser({
            name: u?.name || 'Utilisateur',
            email: u?.email,
            role: u?.role,
            organizationCode: u?.organizationCode,
            organizationName: u?.organizationName,
          });
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
