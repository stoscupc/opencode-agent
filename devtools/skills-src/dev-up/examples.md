### Start All Services

```bash
./up
```

### Start Specific Services

```bash
./up hmc expert    # Start only hmc and expert
```

### Start and Attach to Tmux

```bash
./up --watch
```

### Verify Startup

```bash
./up --status
```

### Check Logs If Startup Fails

```bash
tail -20 .agf-workspace/logs/kb.log
tail -20 .agf-workspace/logs/hmc.log
tail -20 .agf-workspace/logs/expert.log
```
