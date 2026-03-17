### Restart Specific Services

```bash
./up hmc           # Restart just hmc-sim
./up expert kb     # Restart expert and kb
./up web           # Restart web UI
```

### Restart All Services

```bash
./down && ./up
```

### Rebuild Without Restarting

```bash
cd hmc-sim && go build -buildvcs=false -o bin/hmc-sim ./cmd/hmc-sim
cd z-tf-expert && go build -o bin/z-tf-expert ./cmd/z-tf-expert
cd gantry && go build -o bin/gantry ./cmd/gantry
```
