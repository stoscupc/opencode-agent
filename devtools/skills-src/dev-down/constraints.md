### Shutdown

- Always use `./down` to stop services cleanly — do not kill processes manually unless `./down` fails.
- If `./down` hangs, use `tmux kill-session -t zdev` as a fallback.
- Verify shutdown with `./up --status` after stopping.

### Data Preservation

- Stopping services does not delete data in `.agf-workspace/`.
- NATS JetStream data persists across restarts (stored in `.agf-workspace/nats/`).
- hmc-sim SQLite data persists at the configured path.
