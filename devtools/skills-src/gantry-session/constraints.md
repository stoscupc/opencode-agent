### Session Lifecycle

- Always `session_join` before creating, claiming, or completing tasks.
- Only one role per session — re-joining with a different role leaves the previous session automatically.
- Heartbeat is automatic (2-minute interval). If your session expires, claimed tasks become recoverable by ops via `task_recover`.
- Always `session_leave` when your work is done — do not let sessions expire silently.

### Identity

- Session IDs are stable per-process and auto-generated. Do not fabricate or reuse session IDs.
- The `focus` field should be a concise description of current work (e.g., "fixing lint warnings in hmc-sim"), not a role restatement.

### Role Selection

- Choose the role that matches your intended work: `impl` for code, `test` for tests, `review` for code review, `ops` for coordination, `bugfix` for bug fixes, `design` for RFCs, `scribe` for observation, `datacenter-ops` for hardware remediation, `pr-merge` for PR verification, `sage` for systemic analysis.
- Do not join as `ops` to do implementation work — use the correct role.

### Important

- Do not call `session_list` in a tight loop — it is a coordination query, not a health check.
- If you need to monitor events, use `events_poll` or `gantry watch`, not repeated `session_list` calls.
