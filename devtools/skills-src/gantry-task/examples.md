### Create a Task

```
task_create(
  title="Add CAS retry loop to UpdateWorkflow",
  workflow_id="wf-abc123",
  workstream_id="gantry",
  role="impl",
  priority=2,
  description="UpdateWorkflow uses CAS but doesn't retry on conflict. Add 3-attempt retry with jittered backoff.",
  files=["gantry/coordinator/workflows.go"],
  tags=["gantry", "review-followup"]
)
```

### Create a Task with Dependencies

```
task_create(
  title="Integration tests for NATS federation store",
  workflow_id="wf-abc123",
  workstream_id="gantry-hub-federation",
  role="test",
  priority=2,
  description="Write integration tests for NATSFederationStore against embedded NATS server.",
  blocked_by=["task-id-for-nats-store-impl"],
  tags=["gantry", "federation", "nats"]
)
```

### List Claimable Tasks

```
# Only pending tasks with no unresolved dependencies
task_list(claimable=true, role="impl")
```

### Claim, Work, Complete

```
# 1. Claim
task_claim(task_id="abc123")

# 2. Do the work, then broadcast
broadcast_result(kind="build", project="gantry", success=true, summary="Added CAS retry loop")

# 3. Complete with commit info
task_complete(
  task_id="abc123",
  summary="Added 3-attempt CAS retry with jittered backoff to UpdateWorkflow",
  commit="df53a5c3",
  files=["gantry/coordinator/workflows.go"]
)
```

### Fail a Task

```
task_fail(
  task_id="abc123",
  reason="Blocked on missing FederationStore interface — dependency not yet implemented"
)
```
