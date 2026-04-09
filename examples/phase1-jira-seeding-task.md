# Phase 1 Jira Seeding Prompt (Three Workstreams)

Use this with `planner` after Jira credentials are fully configured.

## Prompt

Seed Jira with only Phase 1 productionalization work using three workstreams.

Constraints:

1. Workstreams:
   - core agent contribution loop
   - agent infrastructure and delivery
   - agent hardening and correctness
2. There is already an Epic for "core agent contribution loop" written by Callie.
3. Fetch that Epic and all of its child tickets first.
4. Do not duplicate existing tickets under that Epic.
5. Create only missing Phase 1 stories.
6. Ensure every new story includes explicit Acceptance Criteria.
7. For the other two workstreams, create Epics if missing, then create Phase 1 stories.
8. Include one story under infrastructure/delivery to investigate reuse of Tobias' sandbox deployment work.
9. Keep stories implementation-focused and testable.
10. Show me a proposed create plan first and wait for explicit approval before creating anything.

Acceptance Criteria pattern (required in every story description):

- AC1: measurable output exists
- AC2: validation/check passes
- AC3: handoff/runbook or documentation updated

After creation, return:

- Epic key per workstream
- Created story keys grouped by workstream
- Skipped (already-existing) tickets under core loop Epic
