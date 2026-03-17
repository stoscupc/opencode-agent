### Join as bugfix

```bash
cd devtools && bin/gantry session join bugfix --focus "fixing bugs"
```

### Find bugfix tasks (sorted by priority)

```bash
cd devtools && bin/gantry task list --role bugfix --status pending
```

Priority 1 = critical, fix immediately. Priority 2 = high, fix soon.

### Claim a bug

```bash
cd devtools && bin/gantry task claim <task-id>
```

### Fix and verify

1. Reproduce the bug
2. Write a regression test that fails
3. Fix the code
4. Verify the regression test passes
5. Run full lint and test suite

### Broadcast results

```bash
cd devtools && bin/gantry broadcast test --project <project> --success --summary "regression test added and passing"
```

### Complete the fix

```bash
cd devtools && bin/gantry task complete <task-id> "Fixed nil pointer in auth handler, added regression test" --commit <sha>
```

### Interactive Workflow

1. Join as bugfix, list pending bugfix tasks
2. Claim highest-priority bug first
3. Write regression test before fixing
4. Fix, verify, commit
5. Broadcast test results
6. Complete task, move to next bug

## Autonomous Agent Protocol

When running as a spawned autonomous agent, execute these steps in order:

1. **Join session**: Use `session_join` with role `bugfix` and focus set to the area of work.
2. **Select task by priority**: Use `task_list` with role="bugfix" and status="pending". Select the task with the **lowest priority number** (1=critical). If multiple tasks share the same priority, pick the first one returned. If no pending tasks exist, leave session and exit gracefully.
3. **Claim task**: Use `task_claim` with the selected task ID. If already claimed (race with another agent), go back to step 2 and pick the next task. If no tasks remain, leave session and exit.
4. **Reproduce the bug**: Understand the issue described in the task, identify the root cause.
5. **Write a regression test**: Create a test that demonstrates the failure before fixing.
6. **Fix the code**: Apply the minimal fix that resolves the issue without introducing regressions.
7. **Verify**: Run the regression test and full test suite to confirm the fix.
8. **Broadcast result**: Use `broadcast_result` with kind="test", the project name, and success/failure status.
9. **Commit changes**: Stage only the files changed by this task. Create one commit using conventional format: `fix(scope): short description` (under 72 chars). Scope: project name (e.g. `hmc-sim`, `devtools`). Never use `git add -A`. No `Co-Authored-By` or AI branding. If pre-commit hooks fail: fix the issue, re-stage, create a NEW commit (don't amend). Record the commit SHA.
10. **Complete or fail task**:
    - On success: Use `task_complete` with the task ID, a summary, changed files, and commit SHA.
    - On failure: Use `task_fail` with the task ID and a reason.
11. **Next task or leave**: Go back to step 2 to process the next highest-priority task. If no tasks remain, use `session_leave` before exiting.
