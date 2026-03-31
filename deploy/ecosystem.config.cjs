/** PM2 — isolated app names; does not touch clearearth-api / lunchboxai-api */
module.exports = {
  apps: [
    {
      name: 'astrology-api',
      cwd: '/var/www/astrology-backend',
      script: 'dist/main.js',
      instances: 1,
      autorestart: true,
      max_memory_restart: '400M',
      env: { NODE_ENV: 'production' },
    },
    {
      name: 'astrology-web',
      cwd: '/var/www/astrology-frontend',
      script: 'npm',
      args: 'run start:prod',
      interpreter: 'none',
      instances: 1,
      autorestart: true,
      max_memory_restart: '512M',
      env: { NODE_ENV: 'production' },
    },
  ],
};
