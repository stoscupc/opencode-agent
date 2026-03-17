### Restart specific services

```bash
./up hmc           # Restart just hmc-sim
./up expert kb     # Restart expert and kb
./up demo          # Restart demo app
```

This sends Ctrl-C to the tmux window, kills it, then starts a fresh window with a new build.

### Restart all services

```bash
./down && ./up
```

### Rebuild without restarting (check compilation)

```bash
cd hmc-sim && go build -buildvcs=false -o bin/hmc-sim ./cmd/hmc-sim
cd z-tf-expert && go build -o bin/z-tf-expert ./cmd/z-tf-expert
cd z-manuals-kb/hmc-chapters-api && cargo build --release
```
