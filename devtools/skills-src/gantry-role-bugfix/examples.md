### Regression Test + Fix Commit

```
fix(hmc-sim): prevent nil pointer in SSE auth recovery

- Added regression test TestSSEAuthRecoveryNilSession
- Root cause: session pointer not checked after reconnect timeout
```

### Follow-Up Task for Related Bug

```
task_create(
  title="[hmc-sim] SSE reconnect drops buffered events on timeout",
  workflow_id="wf-abc123",
  workstream_id="hmc-sim",
  role="bugfix",
  priority=2,
  description="During fix of task <id>, found that SSE reconnect discards ring buffer on timeout. Events between disconnect and reconnect are lost.",
  files=["hmc-sim/cmd/hmc-sim/sse.go"],
  tags=["hmc-sim", "followup-bugfix", "sse"]
)
```

### Monorepo Project Reference

| Project | Dir | Build | Test | Lint |
|---------|-----|-------|------|------|
| hmc-sim | `hmc-sim/` | `just build` | `go test ./...` | `just lint` |
| iocp-sim | `iocp-sim/` | `cargo build` | `cargo test` | `cargo clippy` |
| z-tf-expert | `z-tf-expert/` | `just build` | `go test ./...` | `just lint` |
| z-manuals-kb | `z-manuals-kb/` | `cargo build` | `cargo test` | `cargo clippy` |
| gantry | `gantry/` | `just build` | `go test -race ./...` | `just lint` |
| web | `web/` | `npm run build` | `npm test` | `npm run lint` |
