/**
 * Client-side session core.
 *
 * - The short-lived access token lives ONLY in memory (never localStorage → not stealable by XSS
 *   persistence). The long-lived refresh token is an httpOnly cookie the browser manages for us.
 * - On page load we exchange that cookie for a fresh access token (`refreshSession`).
 * - A tiny non-secret localStorage hint ("a session probably exists") avoids a pointless
 *   refresh round-trip (and a 401 in the console) for signed-out visitors.
 */
import axios from 'axios';

export type AuthUser = { id: number; email: string; isAdmin: boolean };
type SessionResponse = { accessToken: string; expiresIn: number; user: AuthUser };

const HINT_KEY = 'astro_session';
const CHANNEL = 'astro-auth';

const baseURL = () =>
  typeof window !== 'undefined'
    ? '/api-proxy'
    : `${process.env.INTERNAL_NEXT_ORIGIN || 'http://127.0.0.1:3000'}/api-proxy`;

/** Bare client (no interceptors) used for the auth endpoints themselves. */
export const authHttp = axios.create({
  baseURL: baseURL(),
  headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
  timeout: 30_000,
});

let accessToken: string | null = null;
let currentUser: AuthUser | null = null;
let refreshTimer: ReturnType<typeof setTimeout> | null = null;
let inFlight: Promise<SessionResponse | null> | null = null;

type Listener = (user: AuthUser | null) => void;
const listeners = new Set<Listener>();
export const subscribeSession = (fn: Listener) => {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
};
const emit = () => listeners.forEach(fn => fn(currentUser));

let channel: BroadcastChannel | null = null;
function bc(): BroadcastChannel | null {
  if (channel || typeof BroadcastChannel === 'undefined') return channel;
  channel = new BroadcastChannel(CHANNEL);
  channel.onmessage = ev => {
    if (ev.data === 'logout') {
      clearLocalSession(false);
    } else if (ev.data === 'login') {
      void refreshSession();
    }
  };
  return channel;
}

export const getAccessToken = () => accessToken;
export const getCurrentUser = () => currentUser;
export const hasSessionHint = () => {
  try {
    return typeof window !== 'undefined' && window.localStorage.getItem(HINT_KEY) === '1';
  } catch {
    return false;
  }
};

function setHint(on: boolean) {
  try {
    if (on) window.localStorage.setItem(HINT_KEY, '1');
    else window.localStorage.removeItem(HINT_KEY);
  } catch {
    /* storage unavailable */
  }
}

function jwtExpMs(token: string): number | null {
  try {
    const seg = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const exp = JSON.parse(atob(seg + '='.repeat((4 - (seg.length % 4)) % 4))).exp;
    return typeof exp === 'number' ? exp * 1000 : null;
  } catch {
    return null;
  }
}

function scheduleRefresh(token: string) {
  if (refreshTimer) clearTimeout(refreshTimer);
  const exp = jwtExpMs(token);
  if (!exp || typeof window === 'undefined') return;
  // Renew a minute early so the user never sees an expiry.
  const delay = Math.max(5_000, exp - Date.now() - 60_000);
  refreshTimer = setTimeout(() => void refreshSession(), delay);
}

function applySession(s: SessionResponse) {
  accessToken = s.accessToken;
  currentUser = s.user;
  setHint(true);
  scheduleRefresh(s.accessToken);
  emit();
}

/** Forget everything locally. `broadcast` tells other tabs to do the same. */
export function clearLocalSession(broadcast = true) {
  accessToken = null;
  currentUser = null;
  if (refreshTimer) clearTimeout(refreshTimer);
  refreshTimer = null;
  setHint(false);
  if (broadcast) bc()?.postMessage('logout');
  emit();
}

/**
 * Exchange the refresh cookie for a new access token. Single-flight per tab, and serialized
 * across tabs with the Web Locks API so two tabs never race the same rotating cookie.
 * Resolves to null when there is no valid session (caller should treat as signed out).
 */
export function refreshSession(): Promise<SessionResponse | null> {
  if (inFlight) return inFlight;
  const run = async (): Promise<SessionResponse | null> => {
    try {
      const { data } = await authHttp.post<SessionResponse>('/auth/refresh');
      applySession(data);
      return data;
    } catch (e) {
      const status = axios.isAxiosError(e) ? e.response?.status : undefined;
      if (status === 401 || status === 403) clearLocalSession(false);
      // Network/5xx: keep local state and the hint; the next call will try again.
      return null;
    }
  };
  const locks = typeof navigator !== 'undefined' ? (navigator as Navigator & { locks?: LockManager }).locks : undefined;
  const p = (locks ? locks.request('astro-refresh', run) : run()) as unknown as Promise<SessionResponse | null>;
  inFlight = p.finally(() => {
    inFlight = null;
  });
  return inFlight;
}

export async function loginRequest(email: string, password: string): Promise<AuthUser> {
  const { data } = await authHttp.post<SessionResponse>('/auth/login', { email, password });
  applySession(data);
  bc()?.postMessage('login');
  return data.user;
}

export async function registerRequest(email: string, password: string): Promise<AuthUser> {
  const { data } = await authHttp.post<SessionResponse>('/auth/register', { email, password });
  applySession(data);
  bc()?.postMessage('login');
  return data.user;
}

export async function logoutRequest(): Promise<void> {
  try {
    await authHttp.post('/auth/logout');
  } catch {
    /* even if the network call fails, drop the local session */
  }
  clearLocalSession(true);
}

export async function logoutEverywhereRequest(): Promise<void> {
  await authHttp.post('/auth/logout-all', undefined, {
    headers: { Authorization: `Bearer ${accessToken ?? ''}` },
  });
  clearLocalSession(true);
}

/** Initialise cross-tab listeners and wake-up refresh. Safe to call many times. */
let started = false;
export function startSessionRuntime() {
  if (started || typeof window === 'undefined') return;
  started = true;
  bc();
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState !== 'visible' || !accessToken) return;
    const exp = jwtExpMs(accessToken);
    if (exp && exp - Date.now() < 90_000) void refreshSession();
  });
  window.addEventListener('online', () => {
    if (hasSessionHint() && !accessToken) void refreshSession();
  });
}
