# Astrology production deploy

## Server

| | |
|---|---|
| **SSH** | `ssh root@72.60.223.25` |
| **Monorepo root** | `/var/www/astrology` (single `.git` — contains `astrology-backend/` and `astrology-frontend/`) |
| **Backend path** | `/var/www/astrology/astrology-backend` (symlink: `/var/www/astrology-backend` → same) |
| **Frontend path** | `/var/www/astrology/astrology-frontend` (symlink: `/var/www/astrology-frontend` → same) |
| **API (NestJS)** | PM2 process **`astrology-api`** → `dist/main.js`, **PORT 6000** (`NODE_ENV=production`) |
| **Web (Next.js)** | PM2 process **`astrology-web`** → `npm run start:prod` → **`next start -p 6600 --hostname 0.0.0.0`** |
| **API proxy** | Browser calls `/api-proxy/*` on the Next app; route forwards to `BACKEND_URL` or default `http://127.0.0.1:6000` |
| **Nginx** | No site file dedicated to Astrology on this host (Clearearth uses `/etc/nginx/sites-available/clearearth`). Astrology is reached via **direct TCP** to **6600** (web) and **6000** (API) unless you add a reverse proxy. |
| **PM2 reference config** | `/var/www/ecosystem.astrology.config.cjs` |

## Git remote (on server)

- **Repository:** `https://github.com/abdulkarimtaji33/astrology.git`
- **Branch:** `master`

Push from your machine first (`git push origin master`), then deploy on the server.

---

## One-time / rare: database migrations

Auth and reminders expect MySQL tables/columns from `schema.sql` and migrations. On the server (adjust MySQL user/password as needed):

```bash
ssh root@72.60.223.25
mysql -u root astrology < /var/www/astrology/astrology-backend/scripts/migrate-auth-mysql.sql
```

To (re)seed a bcrypt admin password for `admin@admin.com` (edit `scripts/seed-admin.js` if you change the password):

```bash
cd /var/www/astrology/astrology-backend
node scripts/seed-admin.js
```

**Production `.env`** (backend, not in git): must include at least `PORT`, `DB_*`, `JWT_SECRET`, and **`ADMIN_API_KEY`** for admin HTTP routes and `/admin/login` to return an API key. Without `ADMIN_API_KEY`, `/admin/health` returns **503** (“admin API is disabled”).

Frontend **`.env.production`** (typical): `INTERNAL_NEXT_ORIGIN=http://127.0.0.1:6600`; optional `BACKEND_URL=http://127.0.0.1:6000` if not using the default.

---

## Deploy (after `git push` to `astrology`)

```bash
ssh root@72.60.223.25
cd /var/www/astrology
git pull origin master

cd astrology-backend
npm ci
npm run build

cd ../astrology-frontend
npm ci
npm run build

pm2 restart astrology-api --update-env
pm2 restart astrology-web
pm2 list
```

Optional: `pm2 logs astrology-api --lines 80` / `pm2 logs astrology-web --lines 80` if something fails.

---

## Last verified deploy

| | |
|---|---|
| **Date** | 2026-04-28 |
| **Commit** | `e8c1d5d` — feat: auth, reminders, admin UX, theme, and reminders admin CRUD |
| **Checks** | `curl` to `127.0.0.1:6600` → **200**; `127.0.0.1:6000` → **200**; both PM2 processes **online** |

---

## Quick verify

```bash
pm2 show astrology-api
pm2 show astrology-web
curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:6600/
curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:6000/
```

---

## Notes

- **Other PM2 apps** on the same host (e.g. `clearearth-api`, `lunchboxai-api`) — only restart `astrology-api` / `astrology-web` for Astrology changes.
- Keep `.env` and `.env.production` only on the server; do not commit secrets.
- If the API fails after auth changes, confirm MySQL has `users`, `user_id` on `birth_records`, and `transit_reminders` with `user_id`.
