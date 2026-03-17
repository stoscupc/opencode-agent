### Example: Charter Gap Closure Planning

**Context**: 17 workstreams identified as charter gaps, each with different priority, effort, and dependency chains. Need to schedule closure work across H1 2026.

**Phase 1 — Frame**:
- Terminal condition: All P1 and P2 workstreams have implementation tasks completed or in progress
- Horizon: 6 major phases (dependency resolution, foundation, parallel build-out, integration, validation, handoff)
- Hard constraints: WS-0 blocks WS-1, WS-2; WS-6 blocks WS-7, WS-14; M1 charter deadline is end of month
- Evaluation signal: Number of charter milestones with GREEN engineering status

**Phase 2 — Trajectories**:

T1 (Priority-first): Execute all P1 workstreams first, then P2, then P3.
- Risk: P1 workstreams may have long dependency chains that block P2 items that are actually easier to close.

T2 (Dependency-first): Resolve the critical dependency chain (WS-0 -> WS-1/WS-2 -> WS-4 -> WS-5/WS-12) first, then fill in independent workstreams in parallel.
- Risk: Blocks all other work until foundation is ready.

T3 (Backward from M1): What must be true for M1 GREEN status? Work backward to identify the minimal set of actions needed by deadline, defer everything else.
- Risk: May leave mid-priority items unstarted, creating a crunch later.

**Phase 3 — Evaluate**: Score each trajectory on charter milestone coverage at each month-end. T3 scores highest for M1 but lowest for M3+. T2 scores highest overall. T1 scores middle.

**Phase 4 — Commit**: Select T2. Committed next action: "Implement WS-0 (conn-iface) — the connection interface abstraction." Replan trigger: WS-0 takes longer than 5 days, or product decision on vault integration resolves.

### Example: Replanning After State Change

**Trigger**: WS-0 completed in 3 days (faster than expected). Product team resolved vault decision as "defer to H2."

**Replan**:
- New state: WS-0 done, WS-8 (conn-vault) deprioritized
- Re-evaluate: T2 still best but WS-8 can be removed from the critical path
- New committed action: "Start WS-1 (conn-zosmf) and WS-2 (conn-hcd) in parallel — both are now unblocked"
- Updated replan trigger: Either WS-1 or WS-2 stalls for 3+ days

### Integration with zdev

When the plan produces committed next actions, create them as gantry tasks:

```
task_create:
  title: "WS-0: Implement conn-iface abstraction layer"
  workflow_id: <active workflow>
  workstream_id: "charter-gap-closure"
  role: impl
  priority: 1
  description: "Create the connection interface abstraction (ConnProvider interface, config types, registry). See docs/dev/workstreams.md WS-0 for spec."
```

When a replan trigger fires, update task priorities and blocked_by relationships to reflect the new trajectory.
