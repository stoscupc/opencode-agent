### Event Subjects

- Subjects use AGF FQDN format: `agf.{fabric}.{cluster}.{component}.{message_type}`.
- Default namespace: `agf.z-local.dev-0`.
- Use wildcards (`>` for multi-level, `*` for single-level) to match event categories.

### Usage

- `gantry watch` is a blocking command — it runs until interrupted with Ctrl+C.
- For non-blocking event consumption in MCP sessions, use `events_poll` instead.
- Events are printed as formatted JSON with timestamps.

### Event Types

- `gantry.task.*` — task lifecycle: created, claimed, completed, failed
- `gantry.broadcast.*` — build/test/lint results and alerts
- `gantry.session.*` — session announce, heartbeat, leave
- `gantry.rfc.*` — RFC creation and review broadcasts
- `gantry.workflow.*` — workflow lifecycle and step updates

### Important

- Watch is read-only — it does not acknowledge or consume events from the buffer.
- For programmatic event processing, use `events_poll` which performs a destructive read.
