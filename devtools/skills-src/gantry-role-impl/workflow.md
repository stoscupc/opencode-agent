If the `zdev` MCP server is connected, use MCP tools directly (preferred). Otherwise use CLI commands below.

### Join as impl

- MCP: `session_join` with role="impl", focus="implementing <feature>"
- CLI: `cd devtools && bin/gantry session join impl --focus "implementing <feature>"`

### Find available tasks

- MCP: `task_list` with role="impl", status="pending"
- CLI: `cd devtools && bin/gantry task list --role impl --status pending`

### Claim a task

- MCP: `task_claim` with task_id
- CLI: `cd devtools && bin/gantry task claim <task-id>`

### Work on the task

Write code in small, testable increments. Commit frequently.

### Broadcast build results

- MCP: `broadcast_result` with kind="build", project=<project>, success=true
- CLI: `cd devtools && bin/gantry broadcast build --project <project> --success --summary "added error handling"`

### Complete the task

- MCP: `task_complete` with task_id, summary, commit, files
- CLI: `cd devtools && bin/gantry task complete <task-id> "Implemented feature X" --commit <sha> --files "file1.go,file2.go"`

### If blocked, fail the task with reason

- MCP: `task_fail` with task_id, reason
- CLI: `cd devtools && bin/gantry task fail <task-id> "blocked on missing API endpoint"`

### Interactive Workflow

1. Join as impl, list pending tasks for your role
2. Claim one task at a time
3. Implement in small commits, run lint and tests locally
4. Broadcast build results after each commit
5. Complete the task with a summary of changes
6. Check for next available task

## Autonomous Agent Protocol

When running as a spawned autonomous agent, execute these steps in order:

1. **Join session**: Use `session_join` with role `impl` and focus set to the area of work.
2. **Select task by priority**: Use `task_list` with role="impl" and status="pending". From the results, select the task with the **lowest priority number** (1=critical, 2=high, 3=medium, 4=low). If multiple tasks share the same priority, pick the first one returned. If no pending tasks exist, leave session and exit gracefully.
3. **Claim task**: Use `task_claim` with the selected task ID. If already claimed (race with another agent), go back to step 2 and pick the next task. If no tasks remain, leave session and exit.
4. **Do the work**: Implement the feature or change described in the task. Write clean, tested code following existing patterns. Run relevant tests before completing.
5. **Broadcast result**: Use `broadcast_result` with kind="build", the project name, and success/failure status.
6. **Commit changes**: Stage only the files changed by this task — use the `files` list from the task or your working set. Create one commit using conventional format: `type(scope): short description` (under 72 chars). Types: `feat`, `fix`, `test`, `refactor`, `docs`, `chore`. Scope: project name (e.g. `hmc-sim`, `demo-app`). Never use `git add -A`. No `Co-Authored-By` or AI branding. If pre-commit hooks fail: fix the issue, re-stage, create a NEW commit (don't amend). Record the commit SHA for the next step.
7. **Verify commit**: Before calling `task_complete`, confirm:
   - If you changed files, you MUST have a non-empty commit SHA. If you don't, go back to step 6 and commit now.
   - If you changed no files (verification-only task), pass commit="verified" and prefix the summary with "[VERIFIED] ".
   - NEVER call task_complete with files populated but commit empty.
8. **Complete or fail task**:
   - On success: Use `task_complete` with the task ID, a summary, changed files, and commit SHA from step 6.
   - On failure: Use `task_fail` with the task ID and a reason.
9. **Next task or leave**: After completing a task, check if the task description contains pipeline metadata (`<!-- pipeline ... -->`). If it does:
   - Parse `group`, `sequence`, `total`, `context`, and `stop_on_fail` from the metadata.
   - If `sequence < total`: use `task_list` with role="impl" and status="pending", find the task with the same `group` and `sequence + 1` in its pipeline metadata, and claim it with `task_claim`.
   - If claim succeeds: go to step 4, preserving any files listed in `context` that are already loaded (do not re-read them).
   - If claim fails (another agent took it) or no matching successor is found: fall through to the generic path below.
   - If no pipeline metadata is present: go back to step 2 to process the next highest-priority task. If no tasks remain, use `session_leave` before exiting.
