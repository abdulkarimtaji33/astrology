'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import api from '@/lib/api';

export type AuthUser = { id: number; email: string };

type AuthContextValue = {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const STORAGE_KEY = 'astro_token';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const applyToken = useCallback((t: string | null) => {
    if (t) {
      localStorage.setItem(STORAGE_KEY, t);
      api.defaults.headers.common.Authorization = `Bearer ${t}`;
      setToken(t);
    } else {
      localStorage.removeItem(STORAGE_KEY);
      delete api.defaults.headers.common.Authorization;
      setToken(null);
      setUser(null);
    }
  }, []);

  const logout = useCallback(() => {
    applyToken(null);
  }, [applyToken]);

  useEffect(() => {
    const t = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
    if (!t) {
      setLoading(false);
      return;
    }
    applyToken(t);
    api
      .get<AuthUser>('/auth/me')
      .then(r => setUser(r.data))
      .catch(() => applyToken(null))
      .finally(() => setLoading(false));
  }, [applyToken]);

  const login = useCallback(
    async (email: string, password: string) => {
      const { data } = await api.post<{ accessToken: string; user: AuthUser }>('/auth/login', {
        email,
        password,
      });
      applyToken(data.accessToken);
      setUser(data.user);
    },
    [applyToken],
  );

  const register = useCallback(
    async (email: string, password: string) => {
      const { data } = await api.post<{ accessToken: string; user: AuthUser }>('/auth/register', {
        email,
        password,
      });
      applyToken(data.accessToken);
      setUser(data.user);
    },
    [applyToken],
  );

  const value = useMemo(
    () => ({ user, token, loading, login, register, logout }),
    [user, token, loading, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
