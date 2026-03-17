### Role Guidelines

- Perform the operational task described.
- Verify the result and broadcast an alert with status.
- Route tasks to the correct roles using the routing table in the workflow.

### Commit Guidance

- Conventional format: `type(scope): short description`
- Types: `chore`, `docs`, `fix`
- Scope: project name or `devtools` for coordination changes
- Keep subject line under 72 characters
- Do NOT include `Co-Authored-By` or other branding
- Do NOT use `--no-verify` to skip pre-commit hooks
- Stage specific files, not `git add -A`
- When hooks fail: fix, re-stage, create a NEW commit (don't amend)

### Important

- Do NOT skip any protocol steps.
- Always leave the session before exiting, even on failure.
- Keep the work focused on the task — do not take on additional work.
