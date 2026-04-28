/* Reads astrology-backend/.env and writes schema.sql (structure only). */
const fs = require("fs");
const path = require("path");
const mysql = require("mysql2/promise");

function loadEnv(filePath) {
  const raw = fs.readFileSync(filePath, "utf8");
  const env = {};
  for (const line of raw.split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i === -1) continue;
    env[t.slice(0, i).trim()] = t.slice(i + 1).trim();
  }
  return env;
}

async function main() {
  const root = path.join(__dirname, "..");
  const env = loadEnv(path.join(root, ".env"));
  const conn = await mysql.createConnection({
    host: env.DB_HOST || "localhost",
    port: parseInt(env.DB_PORT || "3306", 10),
    user: env.DB_USERNAME,
    password: env.DB_PASSWORD ?? "",
    database: env.DB_DATABASE,
  });

  const [tables] = await conn.query(
    "SELECT TABLE_NAME AS name FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() ORDER BY TABLE_NAME",
  );

  let out = `-- astrology schema (no data)\n-- Generated ${new Date().toISOString()}\n\n`;

  for (const { name } of tables) {
    const [rows] = await conn.query("SHOW CREATE TABLE ??", [name]);
    out += rows[0]["Create Table"] + ";\n\n";
  }

  const [views] = await conn.query(
    "SELECT TABLE_NAME AS name FROM information_schema.VIEWS WHERE TABLE_SCHEMA = DATABASE() ORDER BY TABLE_NAME",
  );
  for (const { name } of views) {
    const [rows] = await conn.query("SHOW CREATE VIEW ??", [name]);
    out += rows[0]["Create View"] + ";\n\n";
  }

  await conn.end();
  fs.writeFileSync(path.join(root, "schema.sql"), out, "utf8");
  console.log("Wrote schema.sql (" + tables.length + " tables, " + views.length + " views)");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
