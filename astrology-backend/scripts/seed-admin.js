const bcrypt = require('bcrypt');
const { execSync } = require('child_process');

bcrypt.hash('admin123!@#', 10).then(hash => {
  const sql = `UPDATE users SET password_hash='${hash}', is_admin=1 WHERE email='admin@admin.com';`;
  const escaped = sql.replace(/"/g, '\\"');
  execSync(`C:\\xampp\\mysql\\bin\\mysql.exe -u root astrology -e "${escaped}"`);
  console.log('Admin password updated. Hash:', hash);

  // Verify it works
  bcrypt.compare('admin123!@#', hash).then(ok => {
    console.log('Verification:', ok ? 'PASS' : 'FAIL');
  });
});
