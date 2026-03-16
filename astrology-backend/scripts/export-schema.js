const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

async function exportSchema() {
  const envPath = path.join(__dirname, '..', '.env');
  if (fs.existsSync(envPath)) {
    fs.readFileSync(envPath, 'utf8').split('\n').forEach((line) => {
      const [key, ...v] = line.split('=');
      if (key) process.env[key.trim()] = v.join('=').trim();
    });
  }

  const config = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USERNAME || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_DATABASE || 'astrology',
  };

  const conn = await mysql.createConnection(config);
  const [tables] = await conn.query('SHOW TABLES');
  const tableKey = `Tables_in_${config.database}`;
  const statements = [];

  for (const row of tables) {
    const tableName = row[tableKey];
    const [rows] = await conn.query(`SHOW CREATE TABLE \`${tableName}\``);
    statements.push(rows[0]['Create Table'] + ';\n');
  }

  await conn.end();

  const output = `-- ${config.database} schema (no data)\n-- Generated ${new Date().toISOString()}\n\n` + statements.join('\n');
  const outPath = path.join(__dirname, '..', 'schema.sql');
  fs.writeFileSync(outPath, output, 'utf8');
  console.log('Schema written to schema.sql');
}

exportSchema().catch((err) => {
  console.error(err);
  process.exit(1);
});
