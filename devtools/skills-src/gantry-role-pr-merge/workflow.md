### Join as pr-merge

Use MCP `session_join` with role `pr-merge`, or CLI:

```bash
bin/gantry session join pr-merge --focus "PR verification and merge"
```

### Overview

This role implements a **gated merge workflow** backed by MCP workflow orchestration. Every PR goes through a tracked pipeline:

```
workflow_create
  │
  ├─ Step 1: checkout    — PR into clean git worktree
  ├─ Step 2: build       — just build (affected projects)
  ├─ Step 3: test        — just test (affected projects)
  ├─ Step 4: lint        — just lint (affected projects)
  ├─ Step 5: review      — code review against checklist
  ├─ Step 6: autofix     — fix mechanical issues (lint, format, dead code)
  ├─ Step 7: pr-quality  — PR title/body formatting
  ├─ Step 8: gate        — pass/fail decision
  ├─ Step 9: merge       — auto-merge if gate passed (squash + delete branch)
  ├─ Step 10: tasks      — create bugfix tasks for P3 cleanup items
  └─ Step 11: cleanup    — worktree removal
workflow_complete
```

Each step is tracked via `workflow_step_update`, results stored via `artifact_write`, and outcomes broadcast via `broadcast_result`.

---

### Phase 1: Checkout PR into Worktree

#### Identify the PR

```bash
# By number
gh pr view <number> --json number,title,headRefName,baseRefName,url,additions,deletions,changedFiles

# Or current branch
gh pr view --json number,title,headRefName,baseRefName,url,additions,deletions,changedFiles
```

#### Create MCP workflow

Use `workflow_create` to establish the tracking pipeline:

- **title**: `PR #<number>: <pr-title>`
- **workstream_id**: `dev-pr-merge`
- **tags**: `["pr-merge", "pr-<number>"]`
- **metadata**: `{"pr_number": "<number>", "pr_url": "<url>", "head_ref": "<branch>"}`

Then link the PR as a resource:

```
workflow_resource(workflow_id, action="link", system="github", external_id="PR#<number>", kind="pull-request", label="<pr-title>", url="<pr-url>")
```

#### Create worktree

```bash
PR_NUM=<number>
WORKTREE_DIR=".claude/worktrees/pr-${PR_NUM}"
gh pr checkout ${PR_NUM} --detach
BRANCH=$(gh pr view ${PR_NUM} --json headRefName --jq .headRefName)
git worktree add "${WORKTREE_DIR}" "${BRANCH}"
```

Update step:
```
workflow_step_update(workflow_id, step_id="checkout", status="completed", output="Worktree at ${WORKTREE_DIR}")
```

#### Detect affected projects

From the worktree, determine which monorepo projects have changes:

```bash
cd "${WORKTREE_DIR}"
git diff main...HEAD --name-only | cut -d/ -f1 | sort -u
```

Map directory prefixes to project names for targeted build/test/lint.

---

### Phase 2: Build Verification

Run builds for affected projects only:

```bash
cd "${WORKTREE_DIR}"

# Per-project (preferred — faster, targeted)
cd hmc-sim && just build && cd ..
cd z-tf-expert && just build && cd ..

# Or full monorepo
just build
```

Record result:
```
workflow_step_update(workflow_id, step_id="build", status="completed"|"failed", output="<summary>")
broadcast_result(kind="build", project="<project>", success=true|false, summary="PR #N build: <result>")
```

If build fails, store output:
```
artifact_write(path="pr-<number>/build-output.txt", content="<build stderr/stdout>", tags=["pr-merge", "build"])
```

**Gate rule:** Build failure = workflow fails. Skip remaining steps, go to Phase 8 (gate).

---

### Phase 3: Test Execution

Run tests for affected projects:

```bash
cd "${WORKTREE_DIR}"

# Per-project
cd hmc-sim && just test && cd ..
cd z-tf-expert && just test && cd ..

# Or full
just test
```

Record result:
```
workflow_step_update(workflow_id, step_id="test", status="completed"|"failed", output="<summary>")
broadcast_result(kind="test", project="<project>", success=true|false, summary="PR #N tests: <result>")
artifact_write(path="pr-<number>/test-output.txt", content="<test output>", tags=["pr-merge", "test"])
```

**Gate rule:** Test failure = workflow fails.

---

### Phase 4: Lint / Static Analysis

```bash
cd "${WORKTREE_DIR}"
just lint
```

Record result:
```
workflow_step_update(workflow_id, step_id="lint", status="completed"|"failed", output="<summary>")
broadcast_result(kind="lint", project="<project>", success=true|false, summary="PR #N lint: <result>")
```

**Gate rule:** Lint failure = workflow fails.

---

### Phase 5: Code Review

Review changed files against the review checklist. Work from the worktree.

#### Inspect changes

```bash
cd "${WORKTREE_DIR}"
git log main..HEAD --oneline
git diff main..HEAD --stat
git diff main..HEAD              # full diff for review
```

#### Review checklist (per file/commit)

1. **Correctness**: Any obvious bugs, off-by-one, nil dereferences, race conditions?
2. **Security**: Command injection, SQL injection, path traversal, hardcoded secrets?
3. **Test coverage**: Did feat/fix changes come with tests?
4. **Error handling**: Are errors checked and propagated correctly?
5. **Naming**: Clear, consistent symbol names?
6. **Dead code**: Unused imports, commented-out code, TODO placeholders?
7. **API contracts**: Do interface changes maintain backward compatibility?
8. **Concurrency**: Proper locking, no shared mutable state without guards?

#### Create tasks for issues

Use `task_create` for each issue found:
- **title**: `[pr-review] <project>: <issue description>`
- **role**: `bugfix` for bugs/security, `impl` for missing tests, `refactor` for quality
- **workstream_id**: `dev-pr-merge`
- **priority**: 1 for security/correctness, 2 for missing tests, 3 for style
- **description**: What's wrong, which file/line, suggested fix
- **tags**: `["pr-review", "pr-<number>"]`

Record result:
```
workflow_step_update(workflow_id, step_id="review", status="completed"|"failed", output="<issues found or 'clean'>")
artifact_write(path="pr-<number>/review-findings.md", content="<markdown report>", tags=["pr-merge", "review"])
```

**Gate rule:** P1 issues found = workflow fails. P2/P3 issues = workflow passes with warnings.

---

### Phase 6: Auto-Fix Mechanical Issues

After the review identifies issues, automatically fix **mechanical/cosmetic problems** that don't change the PR's proposal, logic, or intent. Work from the worktree on the PR branch.

#### What IS auto-fixable (mechanical — no proposal change)

- **Lint/format fixes**: `gofmt`, `goimports`, `eslint --fix`, `cargo fmt`, `prettier`
- **Unused imports**: Remove imports flagged by lint
- **Dead code**: Remove commented-out code blocks, unused local variables
- **Trailing whitespace / EOF newlines**
- **Typos in comments and docs** (not in user-facing strings or API names)
- **Missing deferred Close/cleanup** on io.ReadCloser, os.File, etc.
- **Simple lint suppressions**: Add `//nolint` with justification where lint is a false positive
- **go.sum / lock file drift**: `go mod tidy`, `npm install` to sync

#### What is NOT auto-fixable (changes the proposal)

- **Logic changes** — any modification to control flow, algorithms, or behavior
- **API/interface changes** — signatures, field names, return types
- **New code** — adding tests, features, error handling that didn't exist
- **Security fixes** — may alter runtime behavior
- **Architecture changes** — moving code between packages, restructuring
- **Renaming exported symbols** — part of the public API contract
- **Dependency upgrades** — changing versions in go.mod, package.json

#### Auto-fix procedure

1. Collect fixable items from the review findings (P3 mechanical only)
2. Apply fixes in the worktree:

```bash
cd "${WORKTREE_DIR}"

# Go projects
gofmt -w .
goimports -w .
go mod tidy

# Rust projects
cargo fmt

# Web projects
cd web && npx prettier --write . && cd ..

# Manual fixes for dead code, typos, unused vars
# (edit specific files directly)
```

3. Verify fixes don't break anything:

```bash
# Re-run build + test + lint for affected projects
cd <project> && just build && just test && just lint
```

4. If build/test/lint pass after fixes, commit and push:

```bash
cd "${WORKTREE_DIR}"
git add -A
git commit -m "$(cat <<'EOF'
chore: auto-fix lint and formatting issues

Applied mechanical fixes during PR review:
- <list each fix applied>
EOF
)"
git push origin HEAD
```

5. If re-verification fails, revert all auto-fix changes and proceed without them:

```bash
git checkout -- .
git clean -fd
```

Record result:
```
workflow_step_update(workflow_id, step_id="autofix", status="succeeded"|"skipped", summary="<N fixes applied and pushed>" | "No mechanical issues found" | "Fixes reverted — broke build/test")
artifact_write(path="pr-<number>/autofix-changes.md", content="<list of fixes applied>", tags=["pr-merge", "autofix"])
```

**This step never fails the gate.** If auto-fix can't be applied cleanly, it is skipped and the items remain as P3 findings for bugfix tasks.

---

### Phase 7: PR Description Quality

Check and fix the PR title and body.

#### Title rules

- Format: `<Action>: <subject>` (Add, Update, Fix, Refactor, Remove, Optimize, Document)
- Maximum 72 characters, imperative mood, no trailing period
- NO emojis, NO marketing language
- Be specific and technical

#### Body rules — Why/How/What structure

```markdown
