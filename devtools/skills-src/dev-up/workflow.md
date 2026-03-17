### Start all services

```bash
./up
```

### Start specific services

```bash
./up hmc expert
```

### Start and attach to tmux

```bash
./up --watch
```

### Verify startup

```bash
./up --status
```

### Check logs if a service failed to start

```bash
tail -20 .agf-workspace/logs/kb.log
tail -20 .agf-workspace/logs/hmc.log
tail -20 .agf-workspace/logs/expert.log
```

Startup order: kb, hmc, iocp, expert, demo.
Config: `.agf-workspace/config.yaml` (edit to change ports or disable services).
