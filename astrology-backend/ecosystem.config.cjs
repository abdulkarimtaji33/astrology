/** PM2 — paths match typical server layout; adjust cwd if your deploy dir differs */
const be = '/var/www/astrology-backend';
const fe = '/var/www/astrology-frontend';

module.exports = {
  apps: [
    {
      name: 'astrology-api',
      cwd: be,
      script: 'dist/main.js',
      instances: 1,
      autorestart: true,
      max_memory_restart: '400M',
      env: { NODE_ENV: 'production' },
    },
    {
      name: 'astrology-web',
      cwd: fe,
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
