### Join as datacenter-ops

```bash
cd devtools && bin/gantry session join datacenter-ops --focus "hardware remediation"
```

### Find sentinel-created tasks

```bash
cd devtools && bin/gantry task list --role datacenter-ops --status pending
```

Tasks tagged `sentinel` were auto-created by the sentinel service. Priority 1 = critical (CPC error), Priority 2 = warning (LPAR exceptions, partition terminated).

### Claim a task

```bash
cd devtools && bin/gantry task claim <task-id>
```

### Check for associated remediation workflows

After claiming a task, check for active workflows that the sentinel created:

```bash
cd devtools && bin/gantry workflow list --status active
```

If a workflow exists for the same hardware incident, join it:

```bash
cd devtools && bin/gantry workflow join <workflow-id>
```

### Drive workflow DAG steps

Remediation workflows have ordered steps. For each step:

1. **Read the step action** (e.g., `hmc.get_cpc_status`, `hmc.deactivate_cpc`)
2. **Execute the action** via the HMC REST API (through hmc-sim)
3. **Update the step** to `succeeded` or `failed`

```bash
cd devtools && bin/gantry workflow step-update <workflow-id> <step-id> --status executing
# ... perform the action ...
cd devtools && bin/gantry workflow step-update <workflow-id> <step-id> --status succeeded --summary "CPC deactivated successfully"
```

### Hardware Remediation via HMC API

All hardware operations go through the hmc-sim REST API at `http://localhost:6794`.

**Check CPC status:**
```bash
curl -s http://localhost:6794/api/cpcs | jq '.cpcs[] | {name, status}'
```

**Deactivate a CPC:**
```bash
curl -s -X POST http://localhost:6794/api/cpcs/<cpc-id>/operations/deactivate
```

**Activate a CPC:**
```bash
curl -s -X POST http://localhost:6794/api/cpcs/<cpc-id>/operations/activate
```

**Check LPAR status:**
```bash
curl -s http://localhost:6794/api/cpcs/<cpc-id>/logical-partitions | jq '.["logical-partitions"][] | {name, status}'
```

**Deactivate an LPAR:**
```bash
curl -s -X POST http://localhost:6794/api/logical-partitions/<lpar-id>/operations/deactivate
```

**Activate an LPAR:**
```bash
curl -s -X POST http://localhost:6794/api/logical-partitions/<lpar-id>/operations/activate
```

**Load an LPAR (Classic mode — required after activate):**
```bash
curl -s -X POST http://localhost:6794/api/logical-partitions/<lpar-id>/operations/load
```

**Stop a partition (DPM):**
```bash
curl -s -X POST http://localhost:6794/api/partitions/<partition-id>/operations/stop
```

**Start a partition (DPM):**
```bash
curl -s -X POST http://localhost:6794/api/partitions/<partition-id>/operations/start
```

### Broadcast results

```bash
cd devtools && bin/gantry broadcast alert --severity info --message "CPC Z16-A recovered to operating state" --source datacenter-ops
```

### Complete the task

```bash
cd devtools && bin/gantry task complete <task-id> "Recovered CPC Z16-A: deactivate → activate cycle, verified operating" --commit verified
```

### Workflow

1. Join as datacenter-ops, list pending tasks
2. Claim highest-priority sentinel task
3. Check for associated remediation workflow
4. If workflow exists: join it and drive DAG steps sequentially
5. If no workflow: perform manual investigation and recovery
6. Verify hardware is in expected state after remediation
7. Broadcast recovery status
8. Complete task, move to next
