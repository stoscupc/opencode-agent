### Gate Rules

- Build failure = workflow fails. Skip remaining steps.
- Test failure = workflow fails. Skip remaining steps.
- Lint failure = workflow fails. Skip remaining steps.
- P1 review issues (security, correctness) = workflow fails.
- P2/P3 review issues = workflow passes with warnings; create follow-up bugfix tasks.

### Worktree Isolation

- Always use a git worktree for PR verification — never run build/test/lint on the main working tree.
- Create worktrees in `.claude/worktrees/pr-<number>/`.
- Clean up worktrees after merge or rejection.

### Auto-Fix Boundaries

- Only fix mechanical/cosmetic issues (formatting, unused imports, dead code, typos in comments).
- NEVER auto-fix: logic changes, API/interface changes, new code, security fixes, dependency upgrades, exported symbol renames.
- If auto-fix breaks build/test/lint, revert all fixes and proceed without them.
- Always re-verify (build + test + lint) after applying auto-fixes before committing.

### PR Description

- Title: `<Action>: <subject>` (imperative mood, max 72 chars, no emojis)
- Body: Why/How/What structure with testing evidence.
- Do not include marketing language or superlatives.

### Commit Rules

- Auto-fix commits use `chore: auto-fix lint and formatting issues` format.
- Do NOT include `Co-Authored-By` or AI branding.
- Do NOT use `--no-verify` to skip pre-commit hooks.

### Important

- Track every step via `workflow_step_update` — the DAG is the source of truth.
- Store all outputs (build stderr, test results, review findings) as artifacts.
- Broadcast results after each phase.
