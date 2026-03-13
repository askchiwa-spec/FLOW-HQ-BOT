module.exports = {
  apps: [
    {
      name: 'flowhq-control-plane',
      script: './dist/server.js',
      cwd: '/var/www/flowhq/apps/control-plane',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      exp_backoff_restart_delay: 3000,
      env: {
        NODE_ENV: 'production',
        PORT: 3100,
        PROJECT_ROOT: '/var/www/flowhq',
      },
      out_file: '/var/www/flowhq/logs/control-plane-out.log',
      error_file: '/var/www/flowhq/logs/control-plane-error.log',
    },
  ],
};

// NOTE: Worker processes are NOT listed here.
// They are spawned dynamically by the control-plane via PM2 API —
// one PM2 process per active tenant WhatsApp session.
// Web app (Next.js) runs on Vercel — not managed here.
