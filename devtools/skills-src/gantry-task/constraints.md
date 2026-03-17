### Task Lifecycle

- Tasks follow: `pending` -> `claimed` -> `completed` / `failed`.
- Only one session can claim a task (atomic CAS). If the claim fails, pick a different task.
- Always broadcast a result (`broadcast_result`) before calling `task_complete`.
- If you changed files, you MUST have a commit SHA. Never call `task_complete` with files but no commit.

### Task Creation

- Use structured MCP parameters — do NOT concatenate flags into the title string.
- Title must be under 200 characters and describe the work, not the metadata.
- Always set `workflow_id` and `workstream_id` — orphaned tasks are hard to track.
- Use `blocked_by` for dependency ordering. Do not create circular dependencies.
- Tags are for filtering and grouping — use consistent tags across related tasks.

### Priority Levels

- Priority 1 = critical (production outages, security issues). Fix immediately.
- Priority 2 = high (blocking work, important features). Fix soon.
- Priority 3 = normal (planned work, improvements). Fix in order.
- Priority 4 = low (cosmetic, nice-to-have). Fix when convenient.

### Claiming

- Claim one task at a time. Complete it before claiming the next.
- If a claimed task becomes blocked, fail it with a reason rather than holding it indefinitely.
- Claim expiry is enforced — if your session dies, `task_recover` resets stale claims.

### Important

- Do not modify completed or failed tasks — they are immutable.
- Use `task_update` to change priority, title, or dependencies on pending/claimed tasks only.
- Use `add_blocked_by` / `remove_blocked_by` on `task_update` for dependency changes — `blocked_by` is not a direct field on update.
