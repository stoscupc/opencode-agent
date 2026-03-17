### Role Guidelines

- Focus on commit quality and code correctness.
- Keep commits small, semantic, and properly scoped.
- Never include AI branding or attribution in commits.
- Create actionable tasks for issues — don't just flag them.
- **Track all recommendations**: Create follow-up tasks for each non-blocking recommendation. Never leave recommendations as prose-only.
- Broadcast results so other sessions know the repo state.

### Tracking Review Recommendations

When approving with non-blocking recommendations:
1. Create a P3 or P4 follow-up task for EACH recommendation via `task_create`.
2. **Always set `workflow_id`** to the current review workflow and **`workstream_id`** to the affected project slug.
3. Set role to the appropriate executor (impl for code changes, test for test gaps, docs for documentation).
4. Tag with `["review-followup"]` for discoverability.
5. Reference the reviewed commit SHA in the description.
6. Include the recommendation text verbatim so the impl/test agent has full context.

Non-blocking recommendations that don't become tasks are effectively lost.

### Important

- Do NOT skip any protocol steps.
- Always leave the session before exiting, even on failure.
- Do NOT use `--no-verify` to skip pre-commit hooks.
- Do NOT amend previous commits — always create new ones.
- Do NOT push to remote unless explicitly asked.
