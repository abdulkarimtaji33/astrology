'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  clearLocalSession,
  getAccessToken,
  getCurrentUser,
  hasSessionHint,
  loginRequest,
  logoutRequest,
  refreshSession,
  registerRequest,
  startSessionRuntime,
  subscribeSession,
  type AuthUser,
} from '@/lib/auth-session';

export type { AuthUser };

type AuthContextValue = {
  user: AuthUser | null;
  /** In-memory access token (for the rare caller that needs it). */
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(getCurrentUser());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    startSessionRuntime();
    // Drop the pre-refresh-token era credentials left in storage by older versions.
    try {
      window.localStorage.removeItem('astro_token');
      window.localStorage.removeItem('astro_user');
      window.localStorage.removeItem('astrologyAdminJwt');
    } catch {
      /* ignore */
    }

    const unsub = subscribeSession(u => setUser(u));
    let cancelled = false;

    const boot = async () => {
      if (getCurrentUser()) {
        setUser(getCurrentUser());
      } else if (hasSessionHint()) {
        // The refresh cookie is httpOnly, so JS can't see it; ask the server.
        await refreshSession();
      }
      if (!cancelled) setLoading(false);
    };
    void boot();

    return () => {
      cancelled = true;
      unsub();
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    await loginRequest(email, password);
  }, []);

  const register = useCallback(async (email: string, password: string) => {
    await registerRequest(email, password);
  }, []);

  const logout = useCallback(async () => {
    await logoutRequest();
    // Make sure no stale in-memory state survives even if the network call failed.
    clearLocalSession(false);
  }, []);

  const value = useMemo(
    () => ({ user, token: getAccessToken(), loading, login, register, logout }),
    [user, loading, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
