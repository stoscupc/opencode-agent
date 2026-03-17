# Sample Task

Use this to sanity-check the automated three-agent flow after registration.

Suggested flow:

1. Ask `planner`:
   - `Use PROJ-123 to plan this change. Fetch the Jira ticket first, summarize the requirements, inspect the repo, and propose a small safe implementation plan. Ask only if critical detail is missing.`
   - or `Use PROJ-123 and PROJ-456 to plan this change. Fetch both tickets first, reconcile any conflicts, summarize the combined requirements, and propose a minimal plan.`
2. Approve the plan when it looks right.
3. Let `planner` orchestrate `implementer` and `reviewer` automatically.
4. Expect compact status updates such as `Iteration 1/3` during the loop.
5. Review the final summary from `planner`, including workflow result and iterations used.
6. If the workflow is approved, tell `planner` whether you want to commit, open a draft PR, or request changes.

PR comment follow-up example:

- Ask `planner`: `Review the comments on https://github.com/example/repo/pull/123. Fetch all review comments, review summaries, and top-level PR comments first. Reject scope-creep suggestions by default, reject bad ideas explicitly when they should not be implemented, draft Jira follow-up tickets for scope-creep items, propose a minimal implementation plan for accepted items only, and ask whether to post the Jira tickets plus approve any implementation before doing anything.`
