### Watch all cluster events

Subjects use AGF FQDN format: `agf.{fabric}.{cluster}.{component}.{message_type}`.
Default namespace: `agf.z-local.dev-0`. The watch command defaults to the cluster-wide wildcard.

```bash
cd devtools && bin/gantry watch
```

### Watch specific subjects

```bash
# All broadcasts
cd devtools && bin/gantry watch "agf.z-local.dev-0.zdev.broadcast.>"

# Task lifecycle events
cd devtools && bin/gantry watch agf.z-local.dev-0.zdev.task.created agf.z-local.dev-0.zdev.task.completed agf.z-local.dev-0.zdev.task.failed

# Session announcements
cd devtools && bin/gantry watch agf.z-local.dev-0.zdev.session.announce

# Build and test results
cd devtools && bin/gantry watch agf.z-local.dev-0.zdev.broadcast.build agf.z-local.dev-0.zdev.broadcast.test
```

Press Ctrl+C to stop watching. Events are printed as formatted JSON with timestamps.
