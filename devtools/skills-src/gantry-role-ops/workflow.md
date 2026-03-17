### Check service health

```bash
./up --status
```

### Join as ops

```bash
cd devtools && bin/gantry session join ops --focus "monitoring services"
```

### Watch for broadcasts and task events

Subjects use AGF FQDN format: `agf.{fabric}.{cluster}.{component}.{message_type}`.
Default namespace: `agf.z-local.dev-0`.

```bash
cd devtools && bin/gantry watch "agf.z-local.dev-0.zdev.broadcast.*" "agf.z-local.dev-0.zdev.task.*"
```

### Broadcast service alerts

```bash
cd devtools && bin/gantry broadcast alert --severity critical --message "hmc-sim is down" --source ops-monitor
cd devtools && bin/gantry broadcast alert --severity warning --message "kb response time >2s" --source ops-monitor
```

### Restart a failed service

```bash
./up hmc
./up kb
```

### Create tasks for issues found

Use the `task_create` MCP tool with separate parameters (title, role, priority, description).
Do NOT concatenate flags into the title string.

### Create pipelined task batches

When creating multiple related tasks for the **same role and project** that should be executed sequentially with shared file context, use pipeline metadata to batch them. This lets worker agents chain through tasks without re-reading files or wasting round-trips on `task_list` between each task.

**When to pipeline:**

- Same target role (e.g., all `bugfix`) and same project (e.g., all `z-tf-expert`)
- Tasks build on each other or share file context
- Sequential execution order matters

**Pipeline metadata format** -- append as an HTML comment in the task `description`:

```
<!-- pipeline
group: <project>-<phase>-<role>
sequence: <1-based position>
total: <total tasks in batch>
context: <comma-separated file paths to preserve>
stop_on_fail: true
-->
```

**Step-by-step:**

1. **Plan the batch**: Determine all tasks, their order, and shared files.
2. **Create all tasks**: Create each task with pipeline metadata in the description.
3. **Chain with `blocked_by`**: Use `task_update` with `add_blocked_by` to link each task to its predecessor. This enforces ordering at the system level (prevents claiming blocked tasks).
4. **Embed pipeline metadata**: Include the `<!-- pipeline ... -->` block at the end of each task's description.

**Naming convention for groups:** `<project>-<phase>-<role>` (e.g., `z-tf-expert-phase1-bugfix`, `hmc-sim-auth-impl`)

**Example: 3-task bugfix pipeline**

```
# Step 1: Create all tasks
task_create(
  title="Fix race condition in session manager",
  role="bugfix", priority=2,
  description="Race on SessionMap in pkg/workspace/manager.go:142. Add RWMutex guard.\n<!-- pipeline\ngroup: z-tf-expert-phase1-bugfix\nsequence: 1\ntotal: 3\ncontext: pkg/workspace/manager.go, pkg/workspace/manager_test.go\nstop_on_fail: true\n-->",
  files=["z-tf-expert/pkg/workspace/manager.go"]
)
# Returns task ID "t-abc"

task_create(
  title="Fix nil pointer in executor cleanup",
  role="bugfix", priority=2,
  description="Nil check missing in executor.go:89 Cleanup().\n<!-- pipeline\ngroup: z-tf-expert-phase1-bugfix\nsequence: 2\ntotal: 3\ncontext: pkg/workspace/manager.go, pkg/workspace/executor.go\nstop_on_fail: true\n-->",
  files=["z-tf-expert/pkg/workspace/executor.go"]
)
# Returns task ID "t-def"

task_create(
  title="Add timeout to workspace operations",
  role="bugfix", priority=2,
  description="Workspace ops can hang indefinitely. Add context timeout.\n<!-- pipeline\ngroup: z-tf-expert-phase1-bugfix\nsequence: 3\ntotal: 3\ncontext: pkg/workspace/manager.go, pkg/workspace/executor.go\nstop_on_fail: true\n-->",
  files=["z-tf-expert/pkg/workspace/executor.go"]
)
# Returns task ID "t-ghi"

# Step 2: Chain dependencies using task_update
task_update(task_id="t-def", add_blocked_by=["t-abc"])
task_update(task_id="t-ghi", add_blocked_by=["t-def"])
```

**Rules:**

- All tasks in a pipeline must target the same role and use the same priority
- Use `blocked_by` for hard ordering (enforced by Go code); pipeline metadata is advisory
- The `context` field lists files that should be preserved in memory across tasks
- The system works correctly even if agents ignore the pipeline metadata

### Create workflows for coordinated work

When creating a workflow to track multi-step work across sessions, always provide these fields:

1. **`workstream_id`** (required by convention) — Human-readable slug grouping related workflows and tasks (e.g. `"federation-auth"`, `"hmc-sim-ui"`, `"zdev-tui-fixes"`). Visible in `gantry top` WKSTRM column.
2. **`steps`** (strongly recommended) — Define a DAG of steps so progress bars appear in `gantry top` and per-step status can be tracked via `workflow_step_update`.
3. **`tags`** — Use the `tags` parameter, never put tags in the title.
4. **`title`** — Short descriptive name only. Do NOT include CLI flags like `--tags` or `--role` in the title.

**Example:**

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

After creating the workflow, create tasks under it with matching `workflow_id` and `workstream_id`, then use `workflow_join` and `workflow_step_update` as work progresses.

### Interactive Workflow

1. Check service health via `./up --status`
2. Join as ops, start watching broadcasts
3. Monitor `./up --status` and `.agf-workspace/logs/` periodically
4. When a service fails: broadcast alert, restart service, create bugfix task if needed
5. When lint/test broadcasts report failures: escalate as tasks

## Autonomous Agent Protocol

When running as a spawned autonomous agent, execute these steps in order:

1. **Join session**: Use `session_join` with role `ops` and focus set to the task title.
2. **Claim task**: Use `task_claim` with the assigned task ID. If already claimed, leave session and exit gracefully.
3. **Do the work**: Perform the operational task described. Verify the result and broadcast an alert with status.
4. **Broadcast result**: Use `broadcast_alert` with the appropriate severity and a status message. When creating multiple related tasks for the same role and project, use pipelined batch creation (see "Create pipelined task batches" above).
5. **Complete or fail task**:
   - On success: Use `task_complete` with the task ID, a summary, changed files, and commit SHA.
   - On failure: Use `task_fail` with the task ID and a reason.
6. **Leave session**: Use `session_leave` before exiting.
