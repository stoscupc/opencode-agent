### Lint a single Go project and fix auto-fixable issues

```bash
cd hmc-sim && golangci-lint run --fix ./...
```

### Lint and format Rust code

```bash
cd iocp-sim && cargo clippy --fix --allow-dirty -- -D warnings && cargo fmt
```

### Run the full lint pipeline

```bash
just lint
```

Output shows per-project pass/fail status:
```
=== Linting hmc-sim ===
✓ hmc-sim: no issues
=== Linting z-pkg ===
✓ z-pkg: no issues
=== Linting z-manuals-kb (Rust) ===
=== Linting iocp-sim (Rust) ===
✓ Rust linting complete
=== Linting web (ESLint) ===
✓ web: no issues
=== Linting Markdown ===
✓ Markdown: no issues
=== Linting LaTeX ===
✓ LaTeX linting complete
All linting complete
```

### Lint only Go or only Rust

```bash
just lint-go     # All 8 Go projects
just lint-rust   # All 4 Rust projects
```
