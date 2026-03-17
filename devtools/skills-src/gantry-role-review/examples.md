### Review Task Creation

```
task_create:
  title: "[review] hmc-sim: missing error handling in SSE handler"
  workflow_id: <review-workflow-id>
  workstream_id: hmc-sim
  role: bugfix
  priority: 2
  description: "Commit abc1234 adds SSE handler without error return check at line 42."
  files: ["hmc-sim/pkg/api/handlers/sse.go"]
  tags: ["review-followup"]
```

### Monorepo Project Reference

| Project | Dir | Lint | Test |
|---------|-----|------|------|
| hmc-sim | `hmc-sim/` | `just lint` | `go test -race ./...` |
| iocp-sim | `iocp-sim/` | `cargo clippy` | `cargo test` |
| z-tf-expert | `z-tf-expert/` | `just lint` | `go test -race ./...` |
| z-memory | `z-memory/` | `cargo clippy` | `cargo test` |
| z-manuals-kb | `z-manuals-kb/` | `cargo clippy` | `cargo test` |
| devtools | `devtools/` | `just lint` | `go test -race ./...` |
| web | `web/` | `npm run lint` | `npm test` |

**Cross-project:** `just lint` and `just test` from repo root.
