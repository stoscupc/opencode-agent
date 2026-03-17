**IMPORTANT**: Use the MCP tools with structured parameters — do NOT concatenate
flags into the title string. Each parameter (title, role, priority, description)
is a separate field.

### Create a task (MCP — preferred)

Use the `task_create` MCP tool with separate parameters:

- `title`: Short task title (just the title, no flags)
- `role`: Target role (`ops`, `review`, `design`, `impl`, `test`, `bugfix`, `scribe`)
- `priority`: 1=critical, 2=high, 3=normal, 4=low
- `description`: Detailed description of what needs to be done
- `files`: Array of related file paths

### Create a task (CLI — for human operators)

```bash
cd devtools && bin/gantry task create "Fix lint warnings in hmc-sim" --role bugfix --priority 2 --desc "Run golangci-lint and fix all issues"
```

### List tasks

- MCP: `task_list` with optional `role` and `status` filters
- CLI: `cd devtools && bin/gantry task list --role impl --status pending`

### Claim a task

- MCP: `task_claim` with `task_id`
- CLI: `cd devtools && bin/gantry task claim <task-id>`

Only one session can claim a task (atomic CAS). If someone else claims it first, you get an error.

### Complete a task

- MCP: `task_complete` with `task_id`, `summary`, `commit`, `files`
- CLI: `cd devtools && bin/gantry task complete <task-id> "Fixed all lint warnings" --commit abc123 --files "main.go,util.go"`

### Fail a task

- MCP: `task_fail` with `task_id` and `reason`
- CLI: `cd devtools && bin/gantry task fail <task-id> "compilation error in dependency"`

Task lifecycle: pending -> claimed -> completed/failed
