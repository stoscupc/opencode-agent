### Watch All Events

```bash
bin/gantry watch
```

### Watch Specific Event Categories

```bash
# Task lifecycle only
bin/gantry watch agf.z-local.dev-0.gantry.task.created agf.z-local.dev-0.gantry.task.completed

# All broadcasts (build, test, alert)
bin/gantry watch "agf.z-local.dev-0.gantry.broadcast.>"

# Session activity
bin/gantry watch agf.z-local.dev-0.gantry.session.announce

# Workflow step updates
bin/gantry watch "agf.z-local.dev-0.gantry.workflow.>"
```

### Poll Events in MCP (Non-Blocking)

```
# Get buffered events (destructive read)
events_poll(max_events=50)

# Filter to specific types
events_poll(event_types=["task.completed", "broadcast.result"])

# Get only task events
events_poll(event_types=["task"])
```
