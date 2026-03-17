### Restart Behavior

- `./up <service>` sends Ctrl-C to the tmux window, kills it, then starts a fresh window with a new build.
- This is a full restart — the service is rebuilt from source before starting.
- Data in `.agf-workspace/` persists across restarts.

### When to Restart

- After changing source code in a service.
- After a service crashes or enters an error state.
- After updating configuration in `.agf-workspace/config.yaml`.

### Important

- Do not restart services during active coordination sessions unless necessary — other sessions may lose connectivity.
- If restarting `nats`, all NATS-dependent services (hmc, expert, hub) will need to reconnect.
- Broadcast an alert before restarting shared services so other sessions are aware.
