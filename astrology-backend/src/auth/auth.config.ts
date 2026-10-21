/** Central auth constants/config so every consumer (service, strategy, admin guard) agrees. */
/** Access-token lifetime; env override exists mainly so tests can exercise silent renewal. */
export const ACCESS_TTL_SECONDS = Math.max(10, parseInt(process.env.ACCESS_TTL_SECONDS ?? '', 10) || 15 * 60);
/**
 * Sessions persist until the user signs out (or resets their password / revokes sessions).
 * The 15-minute access token renews silently; these are the refresh-token lifetimes, deliberately
 * very long and sliding (each use re-issues). Tighten via env if a stricter policy is ever wanted.
 */
const envDays = (name: string, fallback: number) => {
  const n = parseInt(process.env[name] ?? '', 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
};
export const REFRESH_IDLE_DAYS = envDays('SESSION_IDLE_DAYS', 3650);
export const REFRESH_ABSOLUTE_DAYS = envDays('SESSION_ABSOLUTE_DAYS', 3650);
/** A just-rotated token presented again within this window is a multi-tab race, not theft. */
export const REFRESH_GRACE_MS = 15_000;
export const RESET_TTL_MINUTES = 30;
export const MAX_FAILED_LOGINS = 5;
export const LOCK_MINUTES = 15;
export const BCRYPT_COST = 12;
export const JWT_ISSUER = 'astrology-api';
export const JWT_AUDIENCE = 'astrology-web';
export const REFRESH_COOKIE = 'astro_rt';

export function jwtSecret(): string {
  const s = process.env.JWT_SECRET;
  if (process.env.NODE_ENV === 'production') {
    if (!s || s.length < 32 || s === 'dev-insecure' || s.startsWith('change-this')) {
      throw new Error('JWT_SECRET must be set to a random string of at least 32 characters in production');
    }
    return s;
  }
  return s || 'dev-insecure-secret-do-not-use-in-production';
}

export function refreshCookiePath(): string {
  return process.env.REFRESH_COOKIE_PATH || '/api-proxy/auth';
}
