### Commit Examples

```
chore(devtools): update service health check thresholds
docs(devtools): add session recovery runbook
fix(devtools): correct NATS reconnect backoff config
```

### Workflow Creation Example

```
workflow_create(
  title="Fix LPAR Lifecycle Race Conditions",
  workstream_id="hmc-sim-lpar",
  description="Fix 3 race conditions in LPAR state transitions",
  tags=["hmc-sim", "bugfix", "phase-1"],
  steps=[
    {step_id: "diagnose", label: "Diagnose race conditions"},
    {step_id: "fix", label: "Implement fixes", depends_on: ["diagnose"]},
    {step_id: "test", label: "Run tests", depends_on: ["fix"]}
  ]
)
```
