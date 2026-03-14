# Gantry Setup for OpenCode Agent

This guide wires `opencode-agent` to a local `gantry` checkout so agents can submit and coordinate work through Gantry MCP.

## Repo layout expected

Assume both repos are sibling directories under the same local parent directory:

```text
./opencode-agent
./gantry
```

If you are currently in `opencode-agent`, `../gantry` should exist.

## 0) Ensure colocated sibling repos

From the parent directory that contains both repos:

```bash
pwd
ls -1
```

You should see both `opencode-agent` and `gantry` in the output.

If `gantry` is missing, clone it into the same parent directory:

```bash
git clone <gantry-repo-url> gantry
```

## Prerequisites

- Go 1.25+
- `just`
- NATS with JetStream enabled
- OpenCode installed and using `~/.config/opencode/`

## 1) Build Gantry

From `opencode-agent`:

```bash
cd ../gantry
go build -o bin/gantry ./cmd/gantry
go build -o bin/sentinel ./cmd/sentinel
```

This produces:

- `bin/gantry`
- `bin/sentinel`

Optional install (if `just` is available):

```bash
just install
```

## 2) Start NATS (if needed)

If you do not already have NATS+JetStream running:

```bash
just up-nats
```

## 3) Run Gantry MCP server

Start MCP mode in a dedicated terminal:

```bash
cd ../gantry
./bin/gantry mcp
```

## 4) Sync OpenCode agents/tools from this repo

From `opencode-agent`:

```bash
cd ../opencode-agent
./sync-agent
```

Then reload OpenCode.

## 5) Register Gantry MCP in OpenCode config

Add a Gantry MCP entry in `~/.config/opencode/opencode.json` (shape may vary by OpenCode version):

```json
{
  "mcp": {
    "gantry": {
      "command": "/absolute/path/to/gantry/bin/gantry",
      "args": ["mcp"]
    }
  }
}
```

Set `command` to the real absolute path of your local `gantry/bin/gantry`.

## 6) Quick verification

- Confirm Gantry process is running in MCP mode.
- Open OpenCode and start the `planner` agent.
- Ask the agent to use Gantry tools (for example, list sessions or tasks).

## Notes

- `config/agents.json` currently contains absolute paths from another machine. If `./sync-agent` fails, update `config_file` and `prompt_file` to paths in your local `./opencode-agent` directory.
- Keep Gantry and OpenCode running in separate terminals during active work submission.
