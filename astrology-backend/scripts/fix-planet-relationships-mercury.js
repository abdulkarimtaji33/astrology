/**
 * Inserts missing planet_relationships rows: each graha → Mercury (id 4).
 * The seed dump had no (planet_id, 4) rows, so Mars/Moon/Sun etc. showed Mercury as neutral
 * while Mercury correctly listed Moon & Mars as enemies.
 *
 * is_friendly: 1 = friend, 2 = enemy, 0 = neutral (naisargika, 7 graha + nodes).
 *
 * Usage (from astrology-backend): node scripts/fix-planet-relationships-mercury.js
 * Or: node --env-file=.env scripts/fix-planet-relationships-mercury.js
 */
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env');
  const out = {};
  if (!fs.existsSync(envPath)) return out;
  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const eq = t.indexOf('=');
    if (eq <= 0) continue;
    const key = t.slice(0, eq).trim();
    let val = t.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'")))
      val = val.slice(1, -1);
    out[key] = val;
  }
  return out;
}

const MERCURY_ID = 4;

/** [planet_id, is_friendly] — classical naisargika toward Mercury */
const ROWS = [
  [1, 0], // Sun: neutral
  [2, 1], // Moon: friend
  [3, 2], // Mars: enemy
  [5, 2], // Jupiter: enemy
  [6, 1], // Venus: friend
  [7, 0], // Saturn: neutral
  [8, 1], // Rahu: friend (mirrors Mercury→Rahu)
  [9, 1], // Ketu: friend (mirrors Mercury→Ketu)
];

async function main() {
  const env = { ...loadEnv(), ...process.env };
  const conn = await mysql.createConnection({
    host: env.DB_HOST || 'localhost',
    port: Number(env.DB_PORT || 3306),
    user: env.DB_USERNAME || 'root',
    password: env.DB_PASSWORD ?? '',
    database: env.DB_DATABASE || 'astrology',
  });

  try {
    for (const [planetId, isFriendly] of ROWS) {
      await conn.execute(
        `INSERT INTO planet_relationships (planet_id, related_planet_id, is_friendly)
         VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE is_friendly = VALUES(is_friendly)`,
        [planetId, MERCURY_ID, isFriendly],
      );
      console.log(`OK (${planetId} → ${MERCURY_ID}) is_friendly=${isFriendly}`);
    }
    console.log('Done.');
  } finally {
    await conn.end();
  }
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
