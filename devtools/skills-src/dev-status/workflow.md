### Quick status table

```bash
./up --status
```

This shows for each service: tmux window state, port listening state, and PID.

### Check individual service health endpoints

```bash
curl -s http://localhost:8400/health | head -5   # kb
curl -s http://localhost:6794/api/version         # hmc
curl -s http://localhost:8090/health              # expert
curl -s http://localhost:3100/health              # iocp
curl -s http://localhost:3000 | head -5           # demo
```

### View service logs

```bash
tail -30 .agf-workspace/logs/kb.log
tail -30 .agf-workspace/logs/hmc.log
tail -30 .agf-workspace/logs/expert.log
tail -30 .agf-workspace/logs/iocp.log
tail -30 .agf-workspace/logs/demo.log
```

### Attach to tmux to see live output

```bash
tmux attach -t zdev
```
