### Build Everything

```bash
just build
```

### Build Individual Projects

```bash
cd hmc-sim && just build
cd z-tf-expert && just build
cd z-manuals-kb && just build-server-release
cd iocp-sim && just build-release
cd gantry && just build
cd web && npm run build
```

### Quick Compile Check (No Output Binary)

```bash
cd hmc-sim && go build ./...
cd z-tf-expert && go build ./...
cd iocp-sim && cargo check
cd z-manuals-kb/hmc-chapters-api && cargo check
```

### Broadcast Build Result

```
broadcast_result(kind="build", project="hmc-sim", success=true, summary="Build succeeded, binary at bin/hmc-sim")
```
