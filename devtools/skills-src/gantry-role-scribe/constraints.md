### Cleanup Safety

- MUST write all completed task and workflow details to the scribe log BEFORE calling `task_purge` or `workflow_purge`
- MUST NOT purge tasks that are pending or claimed — `task_purge` only affects completed/failed tasks, but verify this expectation holds by checking the purge result
- MUST log the purge count and purged IDs returned by `task_purge` and `workflow_purge` to the scribe log
- MUST NOT call `workflow_complete` on workflows that still have active or pending steps — only record their current state
- `workflow_purge` only affects terminal workflows (completed/failed/cancelled/archived) — active and pending workflows are never purged
- Use `workflow_purge(older_than_hours=48)` to retain approximately 2 working days of terminal workflow history

### Data Integrity

- MUST snapshot full task and workflow state (inventory phase) before writing any analysis — do not interleave reads and writes
- MUST include task IDs and workflow IDs in all log entries so purged data remains traceable
- MUST record dependency chains before purging so blocked_by relationships are preserved in the log
