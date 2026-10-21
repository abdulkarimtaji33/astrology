# Auth overhaul plan (industry-standard)

## Problems found in the current system
| # | Problem | Risk |
|---|---|---|
| 1 | One 7-day JWT stored in `localStorage` | XSS steals a week-long credential; no way to revoke |
| 2 | No refresh tokens, no logout on server | "Sign out" only forgets the token client-side |
| 3 | bcrypt cost 10, no rehash, no 72-byte guard, user-enumeration timing | weak hardening |
| 4 | No brute-force protection (throttler installed but unused) | credential stuffing |
| 5 | `/auth/me` has no guard → 500 (`req.user` undefined) | bug |
| 6 | Admin uses a *separate* 7-day JWT in localStorage + optional shared API key; guard never re-checks DB | demoted/deleted admin keeps access |
| 7 | `JWT_SECRET` falls back to `dev-insecure` | silent insecure prod |
| 8 | No helmet / security headers, CORS fully open | hardening |
| 9 | No forgot/reset password, no change password, no "sign out everywhere" | missing basics |

## Target design
- **Access token**: JWT, 15 min, `iss`/`aud`/`sid` claims, held **in memory only** on the client.
- **Refresh token**: opaque 256-bit random, **httpOnly, SameSite=Strict, Secure (when HTTPS)** cookie scoped to `/api-proxy/auth`; stored **SHA-256 hashed** in `refresh_tokens`; **rotated on every use**; **reuse detection** revokes the whole token family (with a short grace window for multi-tab races); idle 14 d, absolute 60 d.
- **Passwords**: bcrypt cost 12, transparent rehash on login, max 72 bytes, constant-time dummy compare for unknown emails, common-password blocklist.
- **Brute force**: per-account lockout (5 failures → 15 min, generic error) + per-IP throttling on all auth endpoints.
- **Endpoints**: `register, login, refresh, logout, logout-all, me, change-password, forgot-password, reset-password` (reset tokens hashed, 30 min, single use, revoke all sessions on reset/change).
- **Admin**: same session system; guard validates the JWT **and** re-checks `is_admin` in the DB. Legacy API key kept as break-glass, compared in constant time.
- **Hardening**: `helmet`, `trust proxy`, CORS allow-list from env, fail-fast on weak/missing `JWT_SECRET` in production.
- **Frontend**: token store in memory, axios 401 → single-flight refresh → retry once (Web Locks across tabs), session restore on load via refresh cookie, cross-tab logout sync, new `/forgot-password`, `/reset-password`, `/account` pages, admin uses the shared session.

## Steps
- [ ] 1. Backend deps, entities, idempotent table/column bootstrap
- [ ] 2. AuthService (tokens, lockout, rotation, reset) + controller + throttling + guards
- [ ] 3. Admin guard/login on shared auth; `/auth/me` fix; helmet/CORS/secret checks
- [ ] 4. Next proxy: Set-Cookie + client IP forwarding
- [ ] 5. Frontend token store, axios refresh flow, AuthProvider, admin switch
- [ ] 6. New pages: forgot/reset password, account/security
- [ ] 7. Tests: curl flow (login → refresh → reuse → logout), browser flow, build
- [ ] 8. Commit, push, deploy (backend needs `.env` additions: none required; optional `APP_URL`, `COOKIE_SECURE`)
