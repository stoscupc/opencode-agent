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
