### Role Guidelines

- Implement the feature or change described in the task.
- Write clean, tested code following existing patterns.
- Run relevant tests before completing.
- Broadcast a `build` result after implementation.
- **Commit after completing each task**, before calling `task_complete`.
- **Self-check before completing**: Verify you have a commit SHA if you changed files.

### Verification-Only Tasks

If you claim a task and find the work is already complete:

1. Verify the prior work satisfies the task requirements (run tests, check code).
2. Complete with `commit: "verified"` (not empty string).
3. Prefix the summary with `[VERIFIED]`.
4. Set `files` to the files you verified (even though you didn't change them).

### Commit Rules

- Conventional format: `type(scope): short description` (under 72 chars)
- Types: `feat`, `fix`, `test`, `docs`, `refactor`, `chore`
- Do NOT include `Co-Authored-By` or AI branding
- Do NOT use `--no-verify` to skip pre-commit hooks
- Stage specific files, not `git add -A`
- When hooks fail: fix, re-stage, create a NEW commit (don't amend)

### Pipeline Task Handling

When a task has `<!-- pipeline ... -->` metadata:
- Preserve files listed in `context` across tasks
- On `stop_on_fail: true` failure: broadcast alert, do NOT claim next task
- On `stop_on_fail: false` failure: proceed to next pipeline task
- On malformed metadata: fall through to generic path

### Important

- Do NOT skip any protocol steps.
- Always leave the session before exiting, even on failure.
- Keep the work focused on the task — do not take on additional work.
