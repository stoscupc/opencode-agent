### Example: Review Backlog Pattern

From scribe log analysis, the sage notices review tasks accumulating:

```
## Pattern Analysis

### Workflow Health
- **Review backlog growing**: 5 pending review tasks across 2 workstreams (devtools, web),
  but only 2 review sessions active. Neither has claimed any tasks in the last 2 hours.
  Evidence: scribe-2026-03-01.md "Areas of Attention" section, task IDs fa43abd2, 1f0203ef,
  1697085285, 77537b94, fce16a02.
  - Recommendation: Ops should check if review sessions are stalled or need restart.
  - Urgency: important (blocks merge pipeline)
```

### Example: Plan Alignment Check

```
## Plan Alignment

- **On track**: hmc-sim snapshot persistence (docs/plans.md Q1 milestone) — workflow
  16c3fc37 active with integration tests in progress.
- **Drifting**: OpenCode SDK phases 5-6 have been pending since Feb 28 with no session
  claiming them. docs/plans.md lists this as Q1 priority.
  - Suggestion: Create impl task with higher priority or discuss deprioritization.
- **Missing**: No tasks or workflows exist for the "IOCP compiler improvements" item
  listed in docs/plans.md as Q1.
```

### Example: Follow-up Task Creation

```python
task_create(
  title="Investigate stale review backlog — 5 tasks unclaimed for >24h",
  role="ops",
  priority=2,
  workflow_id="<current-sage-workflow>",
  workstream_id="devtools",
  description="Sage analysis found 5 review tasks pending with no claims despite "
    "2 active review sessions. Investigate whether sessions are stuck, tasks are "
    "unclear, or review capacity needs scaling. Task IDs: fa43abd2, 1f0203ef, "
    "1697085285, 77537b94, fce16a02.",
  tags=["sage-recommended", "review-backlog"]
)
```
