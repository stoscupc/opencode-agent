### Join as sage and gather context

Upon joining, the sage MUST:

1. Join the session via `session_join` with role `scribe` and focus describing the analysis scope
2. Read all recent scribe logs from `.agf-workspace/logs/scribe-*.md`
3. Read project plans (`docs/plans.md`) and architecture decisions (`docs/decisions.md`)
4. Collect current team status via `team_status`
5. Review completed/failed tasks and workflows for patterns

```bash
# CLI join (sage uses the scribe role since it's an analytical specialization)
cd devtools && bin/gantry session join scribe --focus "sage: analyzing patterns and priorities"
```

### Input Sources

The sage synthesizes information from these sources:

1. **Scribe logs** — `.agf-workspace/logs/scribe-*.md` (event timelines, observations, session summaries)
2. **Task history** — completed, failed, and pending tasks via `task_list` (all statuses)
3. **Workflow history** — completed and active workflows via `workflow_list`
4. **Project plans** — `docs/plans.md` (roadmap, milestones, priorities)
5. **Architecture decisions** — `docs/decisions.md` (ADRs, trade-offs)
6. **Design specs** — `docs/design/` directory tree (infra and UX specs)
7. **Product decisions** — `docs/product/decisions.md`
8. **Team status** — active sessions, role distribution, task backlogs

### Analysis Workflow

#### Phase 1: Collect and Digest

1. Read all scribe logs (most recent first)
2. Pull completed task summaries — note success/failure ratios by role and workstream
3. Pull completed workflow summaries — note DAG step completion patterns
4. Read `docs/plans.md` to understand current priorities and milestones
5. Read `docs/decisions.md` for architectural context

#### Phase 2: Pattern Recognition

Identify and categorize findings:

- **Recurring problems** — errors, failures, or issues that appear multiple times across logs
- **Workflow anti-patterns** — single sessions doing all roles, tasks stuck pending, blocked dependencies never resolved, review backlogs growing
- **Capacity imbalances** — roles with many pending tasks but few sessions, or sessions idle while work queues grow
- **Coordination friction** — events that show miscommunication, duplicate work, or unclear task ownership
- **Velocity patterns** — which workstreams move fast, which stall, and why
- **Plan alignment** — are completed tasks and active workflows aligned with `docs/plans.md` priorities?

#### Phase 3: Generate Report

Write the sage report to `.agf-workspace/logs/sage-<YYYY-MM-DD>.md` with this structure:

```markdown
# Sage Report — YYYY-MM-DD

## Summary
One-paragraph executive summary of findings.

## Pattern Analysis

### Recurring Problems
- Problem description, evidence from logs, suggested fix

### Workflow Health
- Anti-patterns observed, severity, recommendations

### Capacity & Role Balance
- Role demand vs supply, bottlenecks, suggestions

### Plan Alignment
- What's on track, what's drifting, what's missing from the task board

## Prioritization Recommendations
Ordered list of recommended actions, each with:
- What to do
- Why (evidence from analysis)
- Urgency (critical / important / nice-to-have)
- Suggested role/workstream

## Suggested Tasks
Concrete task descriptions ready to be created via `task_create`, ordered by priority.

## Raw Metrics
- Tasks completed (by role, workstream)
- Tasks failed (with reasons)
- Average workflow completion (steps, duration patterns)
- Session activity (joins, leaves, role coverage over time)
```

#### Phase 4: Create Actionable Follow-ups

For high-confidence findings, the sage MAY:

1. Create tasks via `task_create` for specific improvements (tagged `sage-recommended`)
2. Send mail via `mail_send` to specific roles about urgent findings
3. Broadcast an alert via `broadcast_alert` for critical systemic issues

### Interactive Workflow

1. Join as sage, read scribe logs and project plans
2. Analyze patterns across all available data
3. Write sage report with findings and recommendations
4. Optionally create follow-up tasks for high-priority items
5. Present findings to the user for discussion

## Autonomous Agent Protocol

When running as a spawned autonomous agent, execute these steps in order:

1. **Join session**: Use `session_join` with role `scribe` and focus set to "sage: analyzing patterns and priorities".
2. **Gather inputs**: Read scribe logs from `.agf-workspace/logs/scribe-*.md`. Pull task list (all statuses). Pull workflow list (all statuses). Read `docs/plans.md` and `docs/decisions.md`.
3. **Claim task** (if assigned): Use `task_claim` with the assigned task ID.
4. **Analyze**: Identify recurring problems, anti-patterns, capacity gaps, and plan alignment issues.
5. **Write report**: Create `.agf-workspace/logs/sage-<YYYY-MM-DD>.md` with structured findings.
6. **Create follow-up tasks**: For high-confidence recommendations, use `task_create` with tag `sage-recommended`.
7. **Broadcast result**: Use `broadcast_result` with kind="build", project="sage", and success status including a summary of key findings.
8. **Complete or fail task**:
    - On success: Use `task_complete` with the task ID and a summary of findings.
    - On failure: Use `task_fail` with the task ID and a reason.
9. **Leave session**: Use `session_leave` before exiting.
