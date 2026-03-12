module.exports = {
  apps: [
    {
      name: 'chatisha-control-plane',
      script: './apps/control-plane/dist/server.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
        PORT: 3100,
      },
      log_file: './logs/control-plane.log',
      out_file: './logs/control-plane-out.log',
      error_file: './logs/control-plane-error.log',
    },
    {
      name: 'chatisha-web',
      script: 'node_modules/.bin/next',
      args: 'start -p 3001',
      cwd: './apps/web',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
      },
      log_file: '../../logs/web.log',
      out_file: '../../logs/web-out.log',
      error_file: '../../logs/web-error.log',
    },
  ],
};

// NOTE: Worker processes are NOT listed here.
// They are spawned dynamically by the control-plane via PM2 API —
// one PM2 process per active tenant WhatsApp session.
