### View Recent Log Output

```bash
tail -50 .agf-workspace/logs/hmc.log
tail -50 .agf-workspace/logs/expert.log
tail -50 .agf-workspace/logs/kb.log
```

### Follow Logs in Real Time

```bash
tail -f .agf-workspace/logs/hmc.log
```

### Search for Errors

```bash
grep -i error .agf-workspace/logs/kb.log | tail -20
grep -i panic .agf-workspace/logs/expert.log | tail -20
```

### Attach to Tmux for Live Output

```bash
tmux attach -t zdev
# Ctrl-B then number keys to switch windows
```
