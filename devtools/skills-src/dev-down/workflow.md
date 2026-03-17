### Stop everything

```bash
./down
```

### Stop specific services

```bash
./down hmc
./down expert kb
```

### Verify stopped

```bash
./up --status
```

### Force cleanup if ./down fails

```bash
tmux kill-session -t zdev
```
