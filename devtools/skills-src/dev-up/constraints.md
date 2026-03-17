### Startup Order

- Services start in dependency order: nats -> kb -> hmc -> expert -> web.
- Do not start downstream services before their dependencies are ready.

### Configuration

- Config lives at `.agf-workspace/config.yaml` (auto-generated, user-editable).
- Logs go to `.agf-workspace/logs/<service>.log`.
- PID files go to `.agf-workspace/pids/<service>.pid`.

### Tmux Session

- All services run in a tmux session named `zdev`.
- Each service gets its own tmux window.
- Use `tmux attach -t zdev` to see live output.

### Important

- If services fail to start, check the log files before retrying.
- The `--watch` flag attaches to tmux after startup — useful for debugging startup issues.
- Port conflicts will cause startup failures — verify no other processes are using the service ports.
