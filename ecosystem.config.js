module.exports = {
  apps: [
    {
      name: 'control-plane',
      script: './apps/control-plane/dist/server.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production'
      },
      log_file: './logs/control-plane.log',
      out_file: './logs/control-plane-out.log',
      error_file: './logs/control-plane-error.log'
    }
  ]
};
