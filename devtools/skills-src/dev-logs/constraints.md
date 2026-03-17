### Log Location

- All service logs are in `.agf-workspace/logs/<service>.log`.
- Available services: `kb`, `hmc`, `expert`, `iocp`, `demo`, `nats`, `hub`, `memory`, `web`.

### Reading Logs

- Use `tail` with a line count to get recent output. Avoid `cat` on large log files.
- Use `grep` to search for specific errors or patterns.
- For real-time monitoring, use `tail -f` or attach to the tmux session.

### Important

- Do not truncate or delete log files while services are running — they may lose their file handles.
- Log files are rotated automatically on service restart.
