module.exports = {
  apps: [
    {
      name: 'job-board',
      script: 'node_modules/next/dist/bin/next',
      args: 'start',
      cwd: '/home/home/.openclaw/workspace/job-board-nextjs',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      watch: false,
      max_memory_restart: '512M',
      restart_delay: 3000,
      min_uptime: '10s',
      max_restarts: 5,
    },
  ],
}
