/**
 * Parses astrology-backend/info.md (Complete Vedic Astrology Guide) and loads:
 *   - planet_house_interpretations  (planet in each of the 12 houses)
 *   - planet_sign_interpretations   (planet in each of the 12 zodiac signs)
 *
 * Replaces any previously seeded (short, one-line) interpretation text with
 * the full multi-section guide text from info.md.
 *
 * Run: node scripts/seed-placement-meanings.js
 */
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

const PLANET_IDS = {
  Sun: 1, Moon: 2, Mars: 3, Mercury: 4, Jupiter: 5, Venus: 6, Saturn: 7, Rahu: 8, Ketu: 9,
};

const SIGN_IDS = {
  Aries: 1, Taurus: 2, Gemini: 3, Cancer: 4, Leo: 5, Virgo: 6,
  Libra: 7, Scorpio: 8, Sagittarius: 9, Capricorn: 10, Aquarius: 11, Pisces: 12,
};

const HOUSE_HEADING = /^### (\w+) in the (\d{1,2})(?:st|nd|rd|th) House$/;
const SIGN_HEADING = /^### (\w+) in (\w+)$/;

function parseInfoMd(text) {
  const lines = text.split(/\r?\n/);
  const houseRows = [];
  const signRows = [];

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const houseMatch = HOUSE_HEADING.exec(line);
    const signMatch = !houseMatch ? SIGN_HEADING.exec(line) : null;

    if (houseMatch || signMatch) {
      const bodyLines = [];
      let j = i + 1;
      while (j < lines.length && !/^#{1,3} /.test(lines[j])) {
        bodyLines.push(lines[j]);
        j++;
      }
      // Drop trailing "---" separators and blank lines.
      while (bodyLines.length && (bodyLines[bodyLines.length - 1].trim() === '---' || bodyLines[bodyLines.length - 1].trim() === '')) {
        bodyLines.pop();
      }
      while (bodyLines.length && bodyLines[0].trim() === '') bodyLines.shift();
      const body = bodyLines.join('\n');

      if (houseMatch) {
        const [, planetName, houseNumStr] = houseMatch;
        const planetId = PLANET_IDS[planetName];
        const houseId = parseInt(houseNumStr, 10);
        if (planetId && houseId >= 1 && houseId <= 12 && body) {
          houseRows.push([planetId, houseId, body]);
        }
      } else {
        const [, planetName, signName] = signMatch;
        const planetId = PLANET_IDS[planetName];
        const signId = SIGN_IDS[signName];
        if (planetId && signId && body) {
          signRows.push([planetId, signId, body]);
        }
      }
      i = j;
    } else {
      i++;
    }
  }

  return { houseRows, signRows };
}

const DDL = `
CREATE TABLE IF NOT EXISTS \`planet_house_interpretations\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT,
  \`planet_id\` int(11) NOT NULL,
  \`house_id\` int(11) NOT NULL,
  \`interpretation\` mediumtext NOT NULL,
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`uk_planet_house\` (\`planet_id\`,\`house_id\`),
  KEY \`fk_phi_house\` (\`house_id\`),
  CONSTRAINT \`phi_planet\` FOREIGN KEY (\`planet_id\`) REFERENCES \`planets\` (\`id\`) ON DELETE CASCADE,
  CONSTRAINT \`phi_house\` FOREIGN KEY (\`house_id\`) REFERENCES \`houses\` (\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS \`planet_sign_interpretations\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT,
  \`planet_id\` int(11) NOT NULL,
  \`sign_id\` int(11) NOT NULL,
  \`interpretation\` mediumtext NOT NULL,
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`uk_planet_sign\` (\`planet_id\`,\`sign_id\`),
  KEY \`fk_psi_sign\` (\`sign_id\`),
  CONSTRAINT \`psi_planet\` FOREIGN KEY (\`planet_id\`) REFERENCES \`planets\` (\`id\`) ON DELETE CASCADE,
  CONSTRAINT \`psi_sign\` FOREIGN KEY (\`sign_id\`) REFERENCES \`zodiac_signs\` (\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
`;

// Widen an existing planet_house_interpretations.interpretation column from
// text (64KB) to mediumtext, in case the table was created by the older
// short-form seed script.
const WIDEN_COLUMN = `
ALTER TABLE \`planet_house_interpretations\` MODIFY \`interpretation\` mediumtext NOT NULL;
`;

async function main() {
  const infoPath = path.join(__dirname, '..', 'info.md');
  const text = fs.readFileSync(infoPath, 'utf8');
  const { houseRows, signRows } = parseInfoMd(text);

  console.log(`Parsed ${houseRows.length} house placements, ${signRows.length} sign placements from info.md`);
  if (houseRows.length !== 108) throw new Error(`Expected 108 house rows, got ${houseRows.length}`);
  if (signRows.length !== 108) throw new Error(`Expected 108 sign rows, got ${signRows.length}`);

  const c = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USERNAME || 'root',
    password: process.env.DB_PASSWORD ?? '',
    database: process.env.DB_DATABASE || 'astrology',
    multipleStatements: true,
  });

  await c.query(DDL);
  await c.query(WIDEN_COLUMN);

  await c.query('SET FOREIGN_KEY_CHECKS=0');
  await c.query('TRUNCATE TABLE planet_house_interpretations');
  await c.query('TRUNCATE TABLE planet_sign_interpretations');
  await c.query('SET FOREIGN_KEY_CHECKS=1');

  await c.query(
    'INSERT INTO planet_house_interpretations (planet_id, house_id, interpretation) VALUES ?',
    [houseRows],
  );
  await c.query(
    'INSERT INTO planet_sign_interpretations (planet_id, sign_id, interpretation) VALUES ?',
    [signRows],
  );

  const [hc] = await c.query('SELECT COUNT(*) c FROM planet_house_interpretations');
  const [sc] = await c.query('SELECT COUNT(*) c FROM planet_sign_interpretations');
  console.log('Inserted planet_house_interpretations:', hc[0].c, 'planet_sign_interpretations:', sc[0].c);
  await c.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
