#!/usr/bin/env bash
# After git pull on server: git lfs pull  then  bash scripts/import-db.sh
set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SQL="$ROOT/astrology.sql"
if [ ! -f "$SQL" ]; then
  echo "Missing $SQL — run: git lfs pull"
  exit 1
fi
mysql -u root -e "CREATE DATABASE IF NOT EXISTS astrology CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
mysql -u root astrology < "$SQL"
echo "Imported astrology.sql into database astrology"
