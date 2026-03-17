### Create PR Verification Workflow

```
workflow_create(
  title="PR #42: Add CAS retry to UpdateWorkflow",
  workstream_id="dev-pr-merge",
  tags=["pr-merge", "pr-42"],
  steps=[
    {step_id: "checkout", label: "Checkout PR into worktree"},
    {step_id: "build", label: "Build verification", depends_on: ["checkout"]},
    {step_id: "test", label: "Test execution", depends_on: ["checkout"]},
    {step_id: "lint", label: "Lint / static analysis", depends_on: ["checkout"]},
    {step_id: "review", label: "Code review", depends_on: ["build", "test", "lint"]},
    {step_id: "autofix", label: "Auto-fix mechanical issues", depends_on: ["review"]},
    {step_id: "gate", label: "Pass/fail decision", depends_on: ["autofix"]},
    {step_id: "merge", label: "Merge PR", depends_on: ["gate"]},
    {step_id: "cleanup", label: "Worktree cleanup", depends_on: ["merge"]}
  ]
)
```

### Create Worktree for PR

```bash
PR_NUM=42
WORKTREE_DIR=".claude/worktrees/pr-${PR_NUM}"
BRANCH=$(gh pr view ${PR_NUM} --json headRefName --jq .headRefName)
git worktree add "${WORKTREE_DIR}" "${BRANCH}"
```

### Review Finding as Bugfix Task

```
task_create(
  title="[pr-review] gantry: potential race in SSE ring buffer push",
  workstream_id="dev-pr-merge",
  role="bugfix",
  priority=1,
  description="PR #42 review: EventBuffer.Push() acquires lock but Drain() reads without sync.Map fence. Potential stale read on ARM.",
  files=["gantry/internal/mcpserver/eventbuf.go"],
  tags=["pr-review", "pr-42"]
)
```

### Cleanup Worktree After Merge

```bash
git worktree remove ".claude/worktrees/pr-42" --force
```
