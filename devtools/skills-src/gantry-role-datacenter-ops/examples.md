### CPC Recovery (Deactivate/Activate Cycle)

```bash
# 1. Check CPC status
curl -s http://localhost:6794/api/cpcs | jq '.cpcs[] | select(.name=="Z16-A") | {name, status}'

# 2. Deactivate
curl -s -X POST http://localhost:6794/api/cpcs/<cpc-id>/operations/deactivate

# 3. Activate
curl -s -X POST http://localhost:6794/api/cpcs/<cpc-id>/operations/activate

# 4. Verify recovery
curl -s http://localhost:6794/api/cpcs/<cpc-id> | jq '{name, status}'
```

### Classic LPAR Restart (Deactivate -> Activate -> Load)

```bash
curl -s -X POST http://localhost:6794/api/logical-partitions/<lpar-id>/operations/deactivate
curl -s -X POST http://localhost:6794/api/logical-partitions/<lpar-id>/operations/activate
curl -s -X POST http://localhost:6794/api/logical-partitions/<lpar-id>/operations/load
```

### DPM Partition Restart (Stop -> Start)

```bash
curl -s -X POST http://localhost:6794/api/partitions/<partition-id>/operations/stop
curl -s -X POST http://localhost:6794/api/partitions/<partition-id>/operations/start
```

### Broadcast Recovery Alert

```
broadcast_alert(severity="info", message="CPC Z16-A recovered to operating state via deactivate/activate cycle", source="datacenter-ops")
```

### Complete Remediation Task

```
task_complete(
  task_id="abc123",
  summary="[VERIFIED] Recovered CPC Z16-A: deactivate -> activate cycle, verified operating status",
  commit="verified",
  files=[]
)
```
