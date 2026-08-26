'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import { apiJson, apiFetch } from '@/lib/api';
import type { UserRole } from '@/lib/authorization';

export interface AuthUser {
  id?: string;
  name?: string;
  email?: string;
  phone?: string;
  role?: UserRole | string;
  organizationId?: string;
  organizationCode?: string;
  organizationName?: string;
  driverId?: string;
  driverCode?: string;
  [key: string]: unknown;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  authenticated: boolean;
  refreshUser: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  authenticated: false,
  refreshUser: async () => {},
  logout: async () => {},
});

async function fetchCurrentUser(): Promise<AuthUser | null> {
  try {
    const data = await apiJson<{ user?: AuthUser }>('/api/auth/me');
    return data?.user ?? null;
  } catch {
    return null;
  }
}

// Durée d'inactivité avant déconnexion automatique (30 minutes).
const INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000;

// Événements considérés comme une activité utilisateur.
const ACTIVITY_EVENTS = [
  'mousedown',
  'keydown',
  'touchstart',
  'scroll',
  'wheel',
] as const;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    setLoading(true);
    try {
      const currentUser = await fetchCurrentUser();
      setUser(currentUser);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    async function initialize() {
      const currentUser = await fetchCurrentUser();
      if (!mounted) return;
      setUser(currentUser);
      setLoading(false);
    }

    initialize();

    return () => {
      mounted = false;
    };
  }, []);

  // Revalidation lors du retour arrière (bouton précédent)
  useEffect(() => {
    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        // Force une revalidation complète et synchrone
        setLoading(true);
        setUser(null);
        refreshUser();
      }
    };

    window.addEventListener('pageshow', handlePageShow);
    return () => {
      window.removeEventListener('pageshow', handlePageShow);
    };
  }, [refreshUser]);

  const logout = useCallback(async () => {
    try {
      await apiFetch('/api/auth/logout', { method: 'POST' });
    } finally {
      setUser(null);
    }
  }, []);

  // Déconnexion automatique après une période d'inactivité.
  // N'a d'effet que si un utilisateur est actuellement connecté.
  const inactivityTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!user) {
      return;
    }

    function resetTimer() {
      if (inactivityTimer.current) {
        clearTimeout(inactivityTimer.current);
      }
      inactivityTimer.current = setTimeout(() => {
        logout();
      }, INACTIVITY_TIMEOUT_MS);
    }

    resetTimer();

    ACTIVITY_EVENTS.forEach((eventName) => {
      window.addEventListener(eventName, resetTimer, { passive: true });
    });

    // Redémarre aussi le minuteur quand l'onglet redevient visible,
    // pour éviter une déconnexion immédiate après un long moment
    // en arrière-plan sans réel geste utilisateur détecté entre-temps.
    function handleVisibilityChange() {
      if (document.visibilityState === 'visible') {
        resetTimer();
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (inactivityTimer.current) {
        clearTimeout(inactivityTimer.current);
      }
      ACTIVITY_EVENTS.forEach((eventName) => {
        window.removeEventListener(eventName, resetTimer);
      });
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user, logout]);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        authenticated: Boolean(user),
        refreshUser,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
