### Follow-Up Task Creation

While implementing, create follow-up tasks for issues outside current scope:

```
task_create:
  title: "[iocp-sim] Add PAIA function type variant for 9175"
  description: "During impl of task <id>, found that 9175 needs PAIA support."
  role: impl
  priority: 2
  files: ["iocp-sim/src/schema/function.rs", "iocp-sim/src/schema/limits.rs"]
  tags: ["iocp-sim", "followup-impl"]
```

### Commit Examples

```
feat(hmc-sim): add adapter and virtual switch support to scenario YAML
fix(hmc-sim): SSE auth recovery on page load and server restart
test(z-tf-expert): add builtin and mock HMC tests, multi-CPC fixture
refactor(hmc-sim): extract generic CRUD helpers for store layer
```

### Monorepo Project Reference

| Project | Dir | Build | Test | Lint |
|---------|-----|-------|------|------|
| hmc-sim | `hmc-sim/` | `just build` | `go test ./...` | `just lint` |
| iocp-sim | `iocp-sim/` | `cargo build` | `cargo test` | `cargo clippy` |
| z-tf-expert | `z-tf-expert/` | `just build` | `go test ./...` | `just lint` |
| z-manuals-kb | `z-manuals-kb/` | `cargo build` | `cargo test` | `cargo clippy` |
| devtools | `devtools/` | `just build` | `go test -race ./...` | `just lint` |
| web | `web/` | `npm run build` | `npm test` | `npm run lint` |

**Cross-project:** `just build`, `just test`, `just lint` from repo root.
