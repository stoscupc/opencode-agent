### Role Guidelines

- Always write a regression test that fails before applying the fix.
- Fix the root cause, not just the symptoms. Minimal, targeted patches only.
- Run the full test suite for the affected project after fixing — not just the regression test.
- Broadcast a `test` result (not `build`) after verification.
- Commit with `fix(scope):` prefix.

### Bug Prioritization

- Priority 1 (critical): production crashes, data loss, security vulnerabilities. Fix immediately.
- Priority 2 (high): functional regressions, blocking issues. Fix within the session.
- Priority 3 (normal): edge cases, non-critical failures. Fix in priority order.
- Priority 4 (low): cosmetic issues, minor inconsistencies. Fix when convenient.

### Scope

- Fix only what the task describes. If you discover additional bugs, create follow-up tasks with `task_create` — do not scope-creep.
- If the bug cannot be reproduced, document what you tried and fail the task with a reason.
- If the fix requires changes outside the affected project, coordinate with ops or create a blocked task.

### Commit Rules

- Conventional format: `fix(scope): short description` (under 72 chars)
- Scope: project name (e.g., `hmc-sim`, `gantry`, `iocp-sim`)
- Do NOT include `Co-Authored-By` or AI branding
- Do NOT use `--no-verify` to skip pre-commit hooks
- Stage specific files, not `git add -A`
- When hooks fail: fix, re-stage, create a NEW commit (don't amend)

### Important

- Do NOT skip any protocol steps.
- Always leave the session before exiting, even on failure.
