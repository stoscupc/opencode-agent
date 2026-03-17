### Lint everything (root justfile)

```bash
just lint
```

This runs all lint targets: `lint-go`, `lint-rust`, `lint-web`, `lint-markdown`, `lint-latex`.

### Go projects (8 targets)

```bash
just lint-go                          # All Go projects
just lint-hmc-sim                     # hmc-sim (GOFLAGS="-buildvcs=false")
just lint-terraform-provider          # terraform-provider-hmc
just lint-z-tf-expert                 # z-tf-expert
just lint-hmc-codegen                 # hmc-codegen
just lint-zdev                        # devtools (GOFLAGS="-buildvcs=false")
just lint-z-pkg                       # z-pkg (GOFLAGS="-buildvcs=false")
just lint-iocds-terraform-provider    # iocds-terraform-provider
just lint-isof                        # isof/sdks/go
```

### Rust projects (4 targets)

```bash
just lint-rust     # z-manuals-kb, z-service-base, z-memory, iocp-sim
```

All Rust targets use `cargo clippy -- -D warnings`.

### Web (ESLint)

```bash
just lint-web      # ESLint on web/packages/ and web/apps/
```

Currently lints `.js/.mjs/.cjs` only (no `@typescript-eslint` parser installed).

### Markdown

```bash
just lint-markdown   # markdownlint-cli2 on docs/ and project READMEs
```

Skips gracefully if `markdownlint-cli2` is not installed.

### LaTeX

```bash
just lint-latex    # chktex across all tex/ books
```

### Per-project lint (local justfiles)

```bash
cd hmc-sim && just lint               # golangci-lint
cd z-tf-expert && just lint           # golangci-lint
cd iocp-sim && just lint              # cargo clippy
cd z-manuals-kb && just lint-markdown # markdownlint
```

### Auto-fix lint issues

```bash
cd hmc-sim && just lint-fix
cd hmc-sim && just fmt
cd z-tf-expert && just fmt
cd iocp-sim && just fmt
```

### Full CI check

```bash
just ci
```
