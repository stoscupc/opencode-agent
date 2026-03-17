### Join as design

```bash
cd devtools && bin/gantry session join design --focus "designing <feature>"
```

### Create an RFC

```bash
cd devtools && bin/gantry rfc create <feature-name>
```

Edit `docs/<feature-name>/README.md` with the problem statement, proposal, tradeoffs, and alternatives.

### Request review

```bash
cd devtools && bin/gantry rfc review <feature-name>
```

This broadcasts an alert so review sessions know to look at the RFC.

### Watch for feedback

Subjects use AGF FQDN format: `agf.{fabric}.{cluster}.{component}.{message_type}`.
Default namespace: `agf.z-local.dev-0`.

```bash
cd devtools && bin/gantry watch "agf.z-local.dev-0.zdev.rfc.*"
```

### Create implementation tasks from approved design

Use the `task_create` MCP tool with separate parameters (title, role, priority, description).
Do NOT concatenate flags into the title string.

### Interactive Workflow

1. Join as design, create RFC scaffold
2. Write the design document in `docs/design/ux/<feature>.md` (frontend/UX) or `docs/design/infra/<feature>.md` (backend/services) (or `docs/<feature>/README.md` for RFCs)
3. **Link the new design into `docs/plans.md`** under the appropriate project section
4. Broadcast for review, iterate based on feedback
5. Update design status in both the doc header and `docs/plans.md` as it progresses
6. Once approved, break design into implementation tasks
7. Create tasks for impl and test roles

## Autonomous Agent Protocol

When running as a spawned autonomous agent, execute these steps in order:

1. **Join session**: Use `session_join` with role `design` and focus set to the feature or area being designed.
2. **Claim task**: Use `task_claim` with the assigned task ID. If already claimed, leave session and exit gracefully.
3. **Do the work**: Write or update the design document as described in the task. Place UX designs in `docs/design/ux/` and infrastructure designs in `docs/design/infra/`. Link the document in `docs/plans.md`.
4. **Break down into tasks**: If the design is approved or the task calls for it, create implementation tasks via `task_create` with role="impl" and test tasks with role="test".
5. **Broadcast result**: Use `broadcast_result` with kind="build", the project name, and success status.
6. **Commit changes**: Stage only the files changed by this task. Create one commit using conventional format: `docs(scope): short description` (under 72 chars). Never use `git add -A`. No `Co-Authored-By` or AI branding. If pre-commit hooks fail: fix the issue, re-stage, create a NEW commit (don't amend). Record the commit SHA.
7. **Complete or fail task**:
    - On success: Use `task_complete` with the task ID, a summary, changed files, and commit SHA.
    - On failure: Use `task_fail` with the task ID and a reason.
8. **Leave session**: Use `session_leave` before exiting.
