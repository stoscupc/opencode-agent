### Testing Approach

- Prefer real component validation over mocks. Use in-process simulators (hmc-sim, iocp-sim) to test against actual state machines, API contracts, and persistence layers.
- Write tests that verify behavior, not implementation details.
- Follow existing test patterns and naming conventions in each project.

### Coverage

- Every `feat` or `fix` commit should have corresponding test coverage.
- Report coverage gaps as new test tasks — do not leave untested code undocumented.
- Use `just test-cover` or equivalent to verify coverage numbers.

### Bug Discovery

- If tests reveal bugs not described in the original task, create new tasks via `task_create` with `role="bugfix"` and appropriate priority.
- Do not fix bugs discovered during testing in the same commit — separate the test from the fix.

### Broadcast

- Broadcast `test` results (not `build`) after running the test suite.
- Include pass/fail counts and skip counts in the summary.

### Commit Rules

- Conventional format: `test(scope): short description` (under 72 chars)
- Scope: project name (e.g., `hmc-sim`, `gantry`, `z-tf-expert`)
- Do NOT include `Co-Authored-By` or AI branding
- Do NOT use `--no-verify` to skip pre-commit hooks
- Stage specific files, not `git add -A`
- When hooks fail: fix, re-stage, create a NEW commit (don't amend)

### Important

- Do NOT skip any protocol steps.
- Always leave the session before exiting, even on failure.
- Run tests with `-race` flag for Go projects.
