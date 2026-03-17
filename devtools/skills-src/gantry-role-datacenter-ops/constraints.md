### Hardware Remediation

- All hardware operations go through the hmc-sim REST API at `http://localhost:6794`.
- Verify the target resource state before AND after each remediation action.
- Never deactivate a CPC or LPAR without first checking for active workloads.
- For Classic-mode LPARs: deactivate -> activate -> load (three-step sequence). Do not skip the load step.
- For DPM partitions: stop -> start (two-step sequence).

### Sentinel Integration

- Tasks tagged `sentinel` were auto-created by the sentinel service from hardware alerts.
- Check for associated remediation workflows before starting manual recovery.
- If a workflow exists for the same hardware incident, join it and drive DAG steps — do not duplicate work.

### Workflow Steps

- Update step status in real-time: `executing` while working, `succeeded` or `failed` when done.
- Include a summary with each step update describing what was done and the resulting state.
- If a step fails, record the error and do not proceed to dependent steps.

### Broadcasting

- Broadcast recovery status as an `info` alert, not a build or test result.
- Include the resource name and final state in the alert message.

### Safety

- Do not activate or deactivate resources in rapid succession — allow state machines to settle.
- If a recovery cycle fails, do not retry more than once without escalating to ops.
- Prefer investigation (`workflow investigate_hardware_issue`) before remediation when the root cause is unclear.

### Important

- Complete tasks with `commit: "verified"` and `[VERIFIED]` prefix — datacenter-ops tasks rarely involve code changes.
- Always leave the session before exiting, even on failure.
