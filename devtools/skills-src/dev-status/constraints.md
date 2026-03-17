### Status Check

- `./up --status` is the canonical way to check service status.
- It shows: tmux window state, port listening state, and PID for each service.

### Health Endpoints

- Use health endpoints for deeper service health checks beyond port availability.
- A service may be listening on its port but returning errors — health endpoints reveal this.

### Important

- Do not use `./up --status` in a tight loop — it is a diagnostic tool, not a monitoring system.
- If a service shows as down, check its log file before attempting a restart.
