### Join as test

```bash
cd devtools && bin/gantry session join test --focus "testing <project>"
```

### Find test tasks

```bash
cd devtools && bin/gantry task list --role test --status pending
```

### Claim and work on test tasks

```bash
cd devtools && bin/gantry task claim <task-id>
```

### Run tests and broadcast results

```bash
just test 2>&1
cd devtools && bin/gantry broadcast test --project <project> --success --summary "85 tests passed, 2 skipped"
```

### Report test failures as bugfix tasks

Use the `task_create` MCP tool with separate parameters (title, role, priority, description).
Do NOT concatenate flags into the title string.

### Complete the test task

Use the `task_complete` MCP tool with `task_id`, `summary`, `commit`, and `files` parameters.

### Interactive Workflow

1. Join as test, check for test tasks or watch for task.completed events
2. After impl tasks complete, write tests for the new code
3. Run full test suite, broadcast results
4. Create bugfix tasks for any failures discovered
5. Report coverage gaps as new test tasks

## Autonomous Agent Protocol

When running as a spawned autonomous agent, execute these steps in order:

1. **Join session**: Use `session_join` with role `test` and focus set to the area of work.
2. **Select task by priority**: Use `task_list` with role="test" and status="pending". Select the task with the **lowest priority number** (1=critical). If multiple tasks share the same priority, pick the first one returned. If no pending tasks exist, leave session and exit gracefully.
3. **Claim task**: Use `task_claim` with the selected task ID. If already claimed (race with another agent), go back to step 2 and pick the next task. If no tasks remain, leave session and exit.
4. **Do the work**: Write or update tests as described in the task. Follow existing test patterns and naming conventions in the project.
5. **Run tests**: Execute the full test suite for the affected project. Record pass/fail counts and any failures.
6. **Broadcast result**: Use `broadcast_result` with kind="test", the project name, and success/failure status.
7. **Create bugfix tasks**: If tests reveal bugs not described in the original task, create new tasks via `task_create` with role="bugfix" and appropriate priority.
8. **Commit changes**: Stage only the files changed by this task. Create one commit using conventional format: `test(scope): short description` (under 72 chars). Scope: project name (e.g. `hmc-sim`, `devtools`). Never use `git add -A`. No `Co-Authored-By` or AI branding. If pre-commit hooks fail: fix the issue, re-stage, create a NEW commit (don't amend). Record the commit SHA.
9. **Complete or fail task**:
    - On success: Use `task_complete` with the task ID, a summary, changed files, and commit SHA.
    - On failure: Use `task_fail` with the task ID and a reason.
10. **Next task or leave**: Go back to step 2 to process the next highest-priority task. If no tasks remain, use `session_leave` before exiting.
