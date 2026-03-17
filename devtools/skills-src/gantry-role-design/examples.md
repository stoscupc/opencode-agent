### Design Doc Commit

```
docs(hmc-sim): add RFC for ISOF state snapshot format
```

### Task Decomposition from Approved Design

```
task_create(
  title="Implement ISOF snapshot encoder",
  workflow_id="wf-isof-rfc",
  workstream_id="hmc-sim",
  role="impl",
  priority=2,
  description="Implement the ISOF encoder per docs/design/infra/hmc-sim/isof-snapshots.md section 3. Encode CPC+LPAR state into binary diff format.",
  files=["hmc-sim/store/isof_encoder.go"],
  tags=["hmc-sim", "isof", "phase-1"]
)

task_create(
  title="Add ISOF snapshot tests",
  workflow_id="wf-isof-rfc",
  workstream_id="hmc-sim",
  role="test",
  priority=2,
  description="Write round-trip tests for ISOF encoder/decoder. Verify diff correctness across state mutations.",
  blocked_by=["<encoder-task-id>"],
  tags=["hmc-sim", "isof", "phase-1"]
)
```

### Workflow Creation for Multi-Step Design

```
workflow_create(
  title="ISOF State Snapshot Format",
  workstream_id="hmc-sim",
  description="Implement ISOF binary snapshot format for CPC/LPAR state diffs",
  tags=["hmc-sim", "isof"],
  steps=[
    {step_id: "design", label: "RFC review and approval"},
    {step_id: "encoder", label: "Implement encoder", depends_on: ["design"]},
    {step_id: "decoder", label: "Implement decoder", depends_on: ["design"]},
    {step_id: "tests", label: "Round-trip tests", depends_on: ["encoder", "decoder"]}
  ]
)
```
