# OpenCode Multi-Agent Skeleton

This repo is a prompt-first skeleton for a three-agent OpenCode workflow. It is centered on editable prompts, agent config, and project-local tools rather than application code.

## Quick start

1. Edit the prompts in `prompts/` and agent settings in `config/` as needed.
2. Run `./sync-agent`.
3. Reload OpenCode.
4. Start with `planner` (the current default agent).
5. Ask `planner` to inspect the repo and propose a plan.

## Default workflow

1. `planner` inspects the repo and proposes a plan.
2. You approve the plan.
3. `planner` delegates to `implementer` and `reviewer`.
4. `implementer` and `reviewer` loop for up to 3 rounds total.
5. After a successful review pass, `planner` returns a final summary and asks whether you want to commit or request changes.
6. If you explicitly request a commit, `planner` can use the synced Git tools when they are available.
7. If you request changes instead, `planner` continues with another implementer/reviewer round.

The prompts use explicit output markers to keep that loop reliable:

- `implementer` ends with `STATUS`, `FILES`, `VALIDATION`, and `NOTES`
- `reviewer` ends with `VERDICT`, `ISSUES`, and `RESIDUAL_RISK`
- `planner` tracks iterations and only continues when `reviewer` returns `VERDICT: revise`

## Repository layout

- `prompts/planner.md` - plans changes, asks for missing context, and orchestrates the workflow
- `prompts/implementer.md` - implements an approved plan
- `prompts/reviewer.md` - reviews changes for correctness and scope
- `config/agents.json` - agent manifest; currently sets `planner` as the default agent
- `config/*.json` - per-agent metadata used by the sync script
- `.opencode/tools/` - project-local custom tools for Jira and Git actions
- `sync-agent` - installs configured agents and copies project-local tools into your OpenCode config
- `examples/sample-task.md` - a small example prompt flow for sanity-checking the setup

`src/` and `tests/` exist but are not the center of this skeleton today.

## Syncing agents and tools

Run `./sync-agent` whenever you update prompts, agent config, or files under `.opencode/tools/`.

The script:

- writes generated agent markdown files to `~/.config/opencode/agents/`
- copies project-local tools from `.opencode/tools/` to `~/.config/opencode/tools/`
- updates `default_agent` in `~/.config/opencode/opencode.json`

If `~/.config/opencode/opencode.json` already exists, the script preserves other settings and only updates `default_agent`.

After syncing, reload OpenCode so the updated agents and custom tools are available.

## Jira tool

This repo includes a project-local `jira` tool at `.opencode/tools/jira.ts`. It fetches a Jira issue by key using the Jira Cloud REST API.

The repo's only declared dependency is `@opencode-ai/plugin`, which the custom tools use.

### Jira environment variables

Set these values using your normal environment-loading workflow:

- `JIRA_BASE_URL` - for example `https://your-domain.atlassian.net`
- `JIRA_EMAIL` - the email address used for Jira API-token auth
- `JIRA_API_TOKEN` - the Jira API token paired with that email

`.env.example` shows the expected variable names.

When the Jira tool runs, it:

1. checks `process.env` first
2. falls back to the nearest ancestor `.env` file

Fallback is only for `.env` files, not `.env.local` or other variants. If a Jira variable is present in `process.env` but blank, the tool treats it as invalid and does not fall back to `.env` for that variable.

### Jira usage

Example request:

- `Use the jira tool to fetch PROJ-123`

If you include Jira issue keys in a planning request, `planner` should fetch them first, summarize the requirements, flag conflicts, ask only when critical details are missing, and pass that Jira context into `implementer` and `reviewer`.

## Git tools

This repo also includes project-local Git tools in `.opencode/tools/`:

- `git-add` - stages current-directory changes with `git add .`
- `git-commit` - creates a commit with a required `message`
- `git-push` - pushes the current branch to its configured remote

These tools are only available after you run `./sync-agent` and reload OpenCode.

They should only be used after the implementer/reviewer workflow is complete and the user explicitly asks to commit. If the synced tools are not available in the runtime, `planner` should say so and ask the user to sync/reload rather than pretending it can commit.

## Example prompt flow

See `examples/sample-task.md` for a compact sanity-check flow.

Examples:

- `Use PROJ-123 to plan this change. Fetch the Jira ticket first, summarize the requirements, inspect the repo, and propose a minimal implementation plan.`
- `Use PROJ-123 and PROJ-456 to plan this change. Fetch both Jira tickets first, reconcile any conflicts, summarize the combined requirements, and ask only if something critical is missing.`
