### Join a Session

```
# MCP (preferred)
session_join(role="impl", focus="implementing NATS KV store")

# CLI
bin/gantry session join impl --focus "implementing NATS KV store"
```

### List Active Sessions

```
# MCP
session_list()

# CLI
bin/gantry session list
```

### Leave a Session

```
# MCP
session_leave()

# CLI
bin/gantry session leave
```

### Quick Start (auto-select role from task demand)

```
# MCP — joins session and claims highest-priority task in one call
session_start(focus="working on gantry federation")
```

### Team Status Overview

```
# MCP — shows sessions, tasks, recent completions, alerts
team_status()
```
