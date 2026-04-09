# Productionalization Jira Seeding Prompt

Use this prompt with the `planner` agent after OpenCode is installed and Jira credentials are configured.

## Prompt

Create a productionalization Jira backlog from the RFC-005 planning docs in this workspace.

Requirements:

1. Read planning index and RFC-005 phase docs first.
2. Propose one Epic per RFC-005 phase (Phase 1 through Phase 6).
3. Propose 3-6 Stories under each Epic.
4. For Phase 1-3 stories, explicitly reflect these milestones:
   - Day 30: coding agent runs
   - Day 60: correctness validations pass at 90% and merged PR rate is 90%
   - Day 90: coding agent deployed to cloud
5. Include a dedicated investigation story for deployment strategy evaluating reuse of Tobias' sandbox work.
6. Keep story summaries concise and implementation-focused.
7. Ask me to approve the backlog plan before creating any Jira issues.
8. After approval, use `jira-create` to create Epics first, then Stories linked to each Epic.
9. Add labels: `rfc005`, `productionalization`, and phase-specific labels like `phase1`.
10. Return a final mapping table: Epic key -> created Story keys.

If Jira transitions are needed for created issues, ask before changing status.
