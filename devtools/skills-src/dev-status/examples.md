### Quick Status Table

```bash
./up --status
```

### Check Individual Health Endpoints

```bash
curl -s http://localhost:8400/health | head -5   # kb
curl -s http://localhost:6794/api/version         # hmc
curl -s http://localhost:8090/health              # expert
curl -s http://localhost:5173                     # web
```

### Service Ports Reference

| Service | Port | Type |
|---------|------|------|
| nats | 4222 | nats-server |
| kb | 8400 | rust |
| hmc | 6794 | go |
| memory | 8410 | rust |
| hub | 8450 | go |
| expert | 8090 | go |
| web | 5173 | node |
| storybook | 6006 | node |
