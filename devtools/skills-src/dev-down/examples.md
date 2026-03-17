### Stop All Services

```bash
./down
```

### Stop Specific Services

```bash
./down hmc         # Stop only hmc-sim
./down expert kb   # Stop expert and kb
```

### Verify Shutdown

```bash
./up --status
```

### Force Cleanup (If ./down Fails)

```bash
tmux kill-session -t zdev
```
