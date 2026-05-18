'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import api from '@/lib/api';
import { isAxiosError } from 'axios';

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
const USER_KEY = 'astro_user';

function b64UrlToUtf8(seg: string): string {
  const pad = '='.repeat((4 - (seg.length % 4)) % 4);
  const b64 = seg.replace(/-/g, '+').replace(/_/g, '/') + pad;
  return decodeURIComponent(
    [...atob(b64)].map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''),
  );
}

/** Unverified decode of access token payload for refresh UX only; server validates. */
function authUserFromJwt(accessToken: string): AuthUser | null {
  try {
    const part = accessToken.split('.')[1];
    if (!part) return null;
    const parsed = JSON.parse(b64UrlToUtf8(part)) as { sub?: unknown; email?: unknown };
    const id = typeof parsed.sub === 'number' ? parsed.sub : Number(parsed.sub);
    const email = typeof parsed.email === 'string' ? parsed.email : '';
    if (!Number.isFinite(id) || !email) return null;
    return { id, email };
  } catch {
    return null;
  }
}

function readStoredUser(): AuthUser | null {
  try {
    const raw =
      typeof window !== 'undefined' ? window.localStorage.getItem(USER_KEY) : null;
    if (!raw) return null;
    const u = JSON.parse(raw) as unknown;
    if (!u || typeof u !== 'object') return null;
    const o = u as Record<string, unknown>;
    const id = Number(o.id);
    const email = String(o.email || '');
    if (!Number.isFinite(id) || !email) return null;
    return { id, email };
  } catch {
    return null;
  }
}

function persistUserBlob(user: AuthUser) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const bootstrapGen = useRef(0);

  const clearSession = useCallback(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(STORAGE_KEY);
      window.localStorage.removeItem(USER_KEY);
    }
    delete api.defaults.headers.common.Authorization;
    setToken(null);
    setUser(null);
  }, []);

  const applyToken = useCallback(
    (t: string | null) => {
      if (t) {
        if (typeof window !== 'undefined') window.localStorage.setItem(STORAGE_KEY, t);
        api.defaults.headers.common.Authorization = `Bearer ${t}`;
        setToken(t);
      } else {
        clearSession();
      }
    },
    [clearSession],
  );

  const logout = useCallback(() => {
    applyToken(null);
  }, [applyToken]);

  useEffect(() => {
    const gen = ++bootstrapGen.current;
    let cancelled = false;

    const t =
      typeof window !== 'undefined' ? window.localStorage.getItem(STORAGE_KEY) : null;
    if (!t) {
      setLoading(false);
      return () => {
        cancelled = true;
      };
    }

    applyToken(t);
    const stored = readStoredUser();
    const fallback = stored ?? authUserFromJwt(t);
    if (fallback) setUser(fallback);

    api
      .get<AuthUser>('/auth/me')
      .then(r => {
        if (cancelled || gen !== bootstrapGen.current) return;
        setUser(r.data);
        persistUserBlob(r.data);
      })
      .catch(err => {
        if (cancelled || gen !== bootstrapGen.current) return;
        if (isAxiosError(err) && err.response?.status === 401) {
          clearSession();
        }
      })
      .finally(() => {
        if (cancelled || gen !== bootstrapGen.current) return;
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [applyToken, clearSession]);

  const login = useCallback(
    async (email: string, password: string) => {
      const { data } = await api.post<{ accessToken: string; user: AuthUser }>('/auth/login', {
        email,
        password,
      });
      applyToken(data.accessToken);
      setUser(data.user);
      persistUserBlob(data.user);
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
      persistUserBlob(data.user);
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
