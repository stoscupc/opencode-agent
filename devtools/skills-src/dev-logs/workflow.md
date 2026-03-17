### Tail a specific service log

```bash
tail -50 .agf-workspace/logs/kb.log
tail -50 .agf-workspace/logs/hmc.log
tail -50 .agf-workspace/logs/expert.log
tail -50 .agf-workspace/logs/iocp.log
tail -50 .agf-workspace/logs/demo.log
```

### Follow logs in real time

```bash
tail -f .agf-workspace/logs/hmc.log
```

### Search logs for errors

```bash
grep -i error .agf-workspace/logs/kb.log | tail -20
grep -i panic .agf-workspace/logs/expert.log | tail -20
```

### Attach to tmux for live output

```bash
tmux attach -t zdev
```

Use Ctrl-B then number keys to switch between windows in tmux.
