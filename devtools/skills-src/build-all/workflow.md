### Build everything (root justfile)

```bash
just build
```

This builds: hmc-sim, terraform-provider-hmc, zdnn-sim, benchmarks, z-tf-expert, z-manuals-kb, and the demo app.

### Build individual projects

```bash
cd hmc-sim && just build          # Go binary
cd z-tf-expert && just build      # Go binary
cd z-manuals-kb && just build-server-release  # Rust binary
cd iocp-sim && just build-release             # Rust binary
cd z-workflows/demo-app && just build         # Node app
```

### Quick compile check (no output binary)

```bash
cd hmc-sim && go build ./...
cd z-tf-expert && go build ./...
cd z-manuals-kb/hmc-chapters-api && cargo check
cd iocp-sim && cargo check
```
