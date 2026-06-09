// PM2 process definition for the 24jobs FastAPI backend.
//
// Pins the three things that were breaking the process on the server:
//   - cwd: uvicorn must run from backend/ so `app.main:app` imports cleanly
//          (otherwise: ModuleNotFoundError: No module named 'app')
//   - watch: false: prevents the restart loop where regenerated .pyc/log files
//            re-trigger PM2 and the process flaps Started -> Shutting down forever
//   - interpreter: "none": exec the uvicorn binary directly, not via Node
//
// Deploy/manage with:
//   pm2 startOrReload ecosystem.config.js
//   pm2 save
module.exports = {
  apps: [
    {
      name: "24jobs-backend",
      cwd: "/var/www/24jobsalerts/backend",
      script: "/var/www/24jobsalerts/backend/.venv/bin/uvicorn",
      args: "app.main:app --host 127.0.0.1 --port 8000",
      interpreter: "none",
      watch: false,
      autorestart: true,
      max_restarts: 10,
      min_uptime: "10s",
    },
  ],
};
