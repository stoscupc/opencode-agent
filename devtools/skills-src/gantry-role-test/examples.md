### Test Commit

```
test(hmc-sim): add LPAR state transition integration tests
test(gantry): add CAS conflict retry coverage for UpdateWorkflow
test(iocp-sim): add z17 PAIA function type parsing tests
```

### Bug Discovery Task

```
task_create(
  title="[hmc-sim] LPAR activate returns 200 when already active",
  workflow_id="wf-abc123",
  workstream_id="hmc-sim",
  role="bugfix",
  priority=3,
  description="During testing of LPAR state transitions, found that POST /operations/activate returns 200 OK when LPAR is already in 'operating' state. Should return 409 Conflict per HMC API spec.",
  files=["hmc-sim/handlers/lpar_operations.go"],
  tags=["hmc-sim", "test-discovered", "api-compliance"]
)
```

### Run Tests Per Project

```bash
# Go projects (with race detector)
cd hmc-sim && go test -race ./...
cd gantry && go test -race ./...
cd z-tf-expert && go test -race ./...

# Rust projects
cd iocp-sim && cargo test
cd z-manuals-kb && cargo test

# Web
cd web && npm test
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
