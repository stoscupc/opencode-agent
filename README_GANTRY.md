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

Initialize Gantry workspace metadata in `opencode-agent` once:

```bash
cd ./opencode-agent
../gantry/bin/gantry init
```

This creates local workspace metadata used for stable session identity. Without this, `task claim` and `task complete` can run under different session IDs.

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

If `nats-server` is not installed yet, install it first.

macOS (Homebrew):

```bash
brew install nats-server
```

Linux (Debian/Ubuntu package flow):

```bash
sudo apt-get update
sudo apt-get install -y nats-server
```

Then start NATS with JetStream enabled (manual fallback when not using `just`):

```bash
mkdir -p ../gantry/.agf-workspace/nats-data
nats-server -js -p 4222 -sd ../gantry/.agf-workspace/nats-data
```

Keep this process running in a dedicated terminal while using Gantry.

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
- Confirm NATS is running; `gantry task list --json` should not return a connection error.
- Open OpenCode and start the `ops` agent.
- Ask the agent to use Gantry tools (for example, list tasks, create tasks, claim, complete).

## 7) Ops-agent produce/consume flow

Use this sequence for local work submission:

1. Start NATS.
2. Start Gantry MCP (`gantry mcp`).
3. In `opencode-agent`, run `./sync-agent` and reload OpenCode.
4. Give `ops` a work request and ask it to decompose into Gantry tasks.
5. `ops` creates tasks for `impl`, `test`, and `review` roles.
6. Workers (or delegated agents) claim tasks and complete them with summaries.

Example prompt for `ops`:

```text
Take this request, create a Gantry workflow/workstream, decompose into impl/test/review tasks, submit tasks, and track status until review is complete.
```

## Notes

- `config/agents.json` uses repo-relative paths and works with `./sync-agent` from this repo.
- Keep Gantry and OpenCode running in separate terminals during active work submission.
