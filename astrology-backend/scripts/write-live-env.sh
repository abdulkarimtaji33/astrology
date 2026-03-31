#!/usr/bin/env bash
# Run on server. Reads DB_* from clearearth backend .env; writes astrology .env (no secrets in git).
set -e
BE="/var/www/astrology-backend"
CE="/var/www/clearearth-backend/.env"
if [ ! -f "$CE" ]; then
  echo "Missing $CE"
  exit 1
fi
JWT="$(openssl rand -hex 32)"
DB_HOST=$(grep -m1 '^DB_HOST=' "$CE" | cut -d= -f2-)
DB_PORT=$(grep -m1 '^DB_PORT=' "$CE" | cut -d= -f2-)
DB_USERNAME=$(grep -m1 '^DB_USER=' "$CE" | cut -d= -f2-)
DB_PASSWORD=$(grep -m1 '^DB_PASSWORD=' "$CE" | cut -d= -f2-)

cat > "$BE/.env" <<ENVEOF
NODE_ENV=production
PORT=6000
DB_HOST=${DB_HOST}
DB_PORT=${DB_PORT}
DB_USERNAME=${DB_USERNAME}
DB_PASSWORD=${DB_PASSWORD}
DB_DATABASE=astrology
JWT_SECRET=${JWT}
JWT_EXPIRES_IN=7d
OPENAI_API_KEY=
ENVEOF
chmod 600 "$BE/.env"
echo "Wrote $BE/.env (DB user from clearearth, database astrology)"
