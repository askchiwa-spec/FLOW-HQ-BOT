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
        DATABASE_URL: 'postgresql://flowhq:flowhq2026@localhost:5433/flowhq',
        DIRECT_URL: 'postgresql://flowhq:flowhq2026@localhost:5433/flowhq',
      },
      out_file: '/var/www/flowhq/logs/control-plane-out.log',
      error_file: '/var/www/flowhq/logs/control-plane-error.log',
    },
    {
      name: 'flowhq-web',
      script: '/var/www/flowhq/node_modules/.bin/next',
      args: 'start -p 3001',
      cwd: '/var/www/flowhq/apps/web',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      exp_backoff_restart_delay: 3000,
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
      },
      out_file: '/var/www/flowhq/logs/web-out.log',
      error_file: '/var/www/flowhq/logs/web-error.log',
    },
    {
      name: 'flowhq-scheduler',
      script: './dist/scheduler.js',
      cwd: '/var/www/flowhq/apps/worker',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '256M',
      exp_backoff_restart_delay: 5000,
      env: {
        NODE_ENV: 'production',
        TZ: 'Africa/Nairobi',
      },
      out_file: '/var/www/flowhq/logs/scheduler-out.log',
      error_file: '/var/www/flowhq/logs/scheduler-error.log',
    },
  ],
};

// NOTE: Worker processes are NOT listed here.
// They are spawned dynamically by the control-plane via PM2 API —
// one PM2 process per active tenant WhatsApp session.
