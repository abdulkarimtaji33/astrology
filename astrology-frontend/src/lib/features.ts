/**
 * Self-service signup is built but hidden for now. Flip with NEXT_PUBLIC_ENABLE_SIGNUP=true
 * (build-time) — and, if you also want the API closed, ALLOW_REGISTRATION=false on the backend.
 */
export const SIGNUP_ENABLED = process.env.NEXT_PUBLIC_ENABLE_SIGNUP === 'true';
