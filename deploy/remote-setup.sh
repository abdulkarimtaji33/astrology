#!/usr/bin/env bash
set -euo pipefail
BE="/var/www/astrology-backend"
FE="/var/www/astrology-frontend"
JWT="$(openssl rand -hex 32)"

mysql -u root -e "CREATE DATABASE IF NOT EXISTS astrology CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;" || true

cat > "$BE/.env" <<ENVEOF
NODE_ENV=production
PORT=6000
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=
DB_DATABASE=astrology
JWT_SECRET=${JWT}
JWT_EXPIRES_IN=7d
OPENAI_API_KEY=
ENVEOF
chmod 600 "$BE/.env"

cat > "$FE/.env.production" <<ENVEOF
INTERNAL_NEXT_ORIGIN=http://127.0.0.1:6600
ENVEOF

if [ -f "$BE/schema.sql" ]; then
  mysql -u root astrology < "$BE/schema.sql" || true
fi

cd "$BE"
npm ci --omit=dev
npm run build

cd "$FE"
npm ci
npm run build

pm2 delete astrology-api 2>/dev/null || true
pm2 delete astrology-web 2>/dev/null || true
pm2 start /var/www/ecosystem.astrology.config.cjs
pm2 save

echo "astrology-api :6000  astrology-web :6600"
