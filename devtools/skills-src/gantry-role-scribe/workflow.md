### Join as scribe and start logging

Upon joining, the scribe MUST immediately:

1. Join the session via `session_join` (MCP) or CLI
2. Create a scribe log file at `.agf-workspace/logs/scribe-<YYYY-MM-DD>.md`
3. Start polling events and recording to the log

```bash
# CLI join
cd devtools && bin/gantry session join scribe --focus "observing and logging"
```

### Scribe log file

The scribe maintains a running log at `.agf-workspace/logs/scribe-<YYYY-MM-DD>.md`. This is the primary artifact. Format:

```markdown
# Scribe Log — YYYY-MM-DD
```

### Task & Workflow Inventory

After joining, the scribe takes a full snapshot of the coordination state:

1. Call `task_list(status="")` to get ALL tasks (pending, claimed, completed, failed)
2. Call `workflow_list(status="")` to get ALL workflows
3. For each task, inspect `blocked_by` to build dependency chains
4. For each active workflow with steps, note DAG progress (completed/total steps)

### Dependency Chain Analysis

Build dependency chains from the task inventory:

- Walk each task's `blocked_by` list to find the **head task** (unblocked root)
- Compute **depth** (number of tasks in the chain)
- Identify the **bottleneck** (first incomplete task in the chain)
- Classify chain status: `flowing` (bottleneck is claimed), `stalled` (bottleneck is pending with no claimer), `blocked` (bottleneck is blocked by another incomplete task)

Write to the scribe log:

```markdown
## Task Dependency Chains
| Chain | Head Task | Depth | Bottleneck | Status |
|-------|-----------|-------|------------|--------|
```

### Workflow Progress Analysis

For each workflow returned by `workflow_list`:

- Count completed vs total steps in the DAG
- Flag workflows with no activity (stalled)
- Flag orphaned workflows (no active sessions, no recent step updates)

Write to the scribe log:

```markdown
## Workflow Progress
| Workflow | Workstream | Steps | Progress | Status |
|----------|-----------|-------|----------|--------|
```

### Interactive Workflow

1. Join as scribe, create or append to scribe log
2. Run task & workflow inventory, write structured summaries
3. Poll events continuously, record summaries
4. Track task completions, broadcasts, session joins/leaves
5. Maintain a timeline of significant events
6. Run cleanup phase before leaving

### Cleanup Phase

After all completed/failed tasks and terminal workflows have been recorded in the scribe log:

1. Call `task_purge(older_than_hours=0)` to remove completed/failed tasks that were just logged
2. Log the purge result (count of purged tasks) to the scribe log
3. Call `workflow_purge(older_than_hours=48)` to remove terminal workflows older than 2 working days
4. Log the workflow purge result (count and IDs of purged workflows) to the scribe log

## Autonomous Agent Protocol

When running as a spawned autonomous agent, execute these steps in order:

1. **Join session**: Use `session_join` with role `scribe` and focus set to "observing and logging".
2. **Create log file**: Create or append to `.agf-workspace/logs/scribe-<YYYY-MM-DD>.md`.
3. **Claim task** (if assigned): Use `task_claim` with the assigned task ID. If no task, proceed with default observation duties.
4. **Inventory**: Call `task_list(status="")` and `workflow_list(status="")` to snapshot all coordination state.
5. **Analyze dependencies**: Walk `blocked_by` chains to build dependency graph. Identify head tasks, chain depth, bottlenecks, and classify each chain as flowing/stalled/blocked.
6. **Analyze workflows**: For each workflow, compute DAG progress (completed/total steps). Flag stalled or orphaned workflows.
7. **Write structured summary**: Write dependency chain table, workflow progress table, and priority analysis to the scribe log.
8. **Poll and record**: Use `events_poll` to collect events. Record significant events (task completions, broadcasts, alerts, session changes) to the log file with timestamps.
9. **Summarize**: Write summary sections covering active sessions, task progress, and notable events.
10. **Cleanup**: Call `task_purge(older_than_hours=0)` to clear completed/failed tasks after logging. Call `workflow_purge(older_than_hours=48)` to trim terminal workflows older than 2 working days. Record purge counts in the log.
11. **Broadcast result**: Use `broadcast_result` with kind="build", project="scribe", and success status.
12. **Complete or fail task**:
    - On success: Use `task_complete` with the task ID and a summary of observations recorded.
    - On failure: Use `task_fail` with the task ID and a reason.
13. **Leave session**: Use `session_leave` before exiting.
