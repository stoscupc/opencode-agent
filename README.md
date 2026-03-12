# OpenCode Multi-Agent Skeleton

This project stores a prompt-first three-agent OpenCode setup you can edit in VS Code and keep in git.

The intended workflow is:

1. `planner` inspects the repo and proposes a plan.
2. You approve the plan.
3. `planner` automatically delegates to `implementer` and `reviewer`.
4. `implementer` and `reviewer` loop up to 3 times total.
5. `planner` returns the final summary.

If you include one or more Jira issue keys in the request, `planner` should fetch them first with the `jira` tool, summarize the ticket requirements, flag conflicts across tickets, ask concise follow-up questions when details are missing, and pass that Jira context into `implementer` and `reviewer`.

The orchestration is prompt-driven, so the prompts now use stricter output markers to make the loop more reliable:

- `implementer` ends with `STATUS`, `FILES`, `VALIDATION`, and `NOTES`
- `reviewer` ends with `VERDICT`, `ISSUES`, and `RESIDUAL_RISK`
- `planner` tracks iterations explicitly and only continues when reviewer returns `VERDICT: revise`

## Layout

- `prompts/planner.md` - plans code changes, asks for missing context, and orchestrates the workflow
- `prompts/implementer.md` - implements an approved plan
- `prompts/reviewer.md` - reviews changes for correctness and scope
- `config/agents.json` - manifest that tells the sync script which agents to install
- `config/*.json` - per-agent metadata used by the sync script
- `sync-agent` - installs all configured agents and project-local tools into your OpenCode config
- `examples/sample-task.md` - a quick test flow you can use while iterating

## How to use it

1. Edit the prompts in `prompts/` for planner, implementer, and reviewer behavior.
2. Adjust the matching files in `config/` if you want different ids, temperatures, or tool permissions.
3. Update `config/agents.json` if you add, remove, or reorder agents.
4. Run `./sync-agent`.
5. Reload OpenCode.

## Custom Jira tool

This repo now includes a project-local OpenCode custom tool at `.opencode/tools/jira.ts`.
OpenCode loads it as the `jira` tool, which fetches a Jira issue by key from the Jira Cloud REST API.
The tool uses `@opencode-ai/plugin`, which is declared in this repo's `package.json`.

### Required environment variables

- `JIRA_BASE_URL` - your Jira base URL, for example `https://your-domain.atlassian.net`
- `JIRA_EMAIL` - the email address for Jira API-token auth
- `JIRA_API_TOKEN` - the Jira API token paired with that email

Copy the values from `.env.example` into whatever environment-loading workflow you use.
When the Jira tool runs, it checks `process.env` first and only falls back to the nearest ancestor `.env` file by searching upward from the current working directory to filesystem root.
For this fallback, it reads only `.env` (not `.env.local` or other variants).
If your shell or OpenCode setup already exports these variables, those values take precedence. Exported Jira variables must be non-empty; if a variable is present in `process.env` but blank, the tool treats that as invalid and does not fall back to `.env` for that variable.

### Example usage

Ask OpenCode to call the tool with an issue key, for example:

- `Use the jira tool to fetch PROJ-123`

The tool returns a concise result with the issue key, summary, status, assignee, Jira URL, and a short description when available.

## Jira-driven workflow examples

- Single ticket:
  - `Use PROJ-123 to plan this change, summarize the Jira requirements, inspect the repo, and propose a minimal implementation plan.`
- Multiple tickets:
  - `Use PROJ-123 and PROJ-456 to plan this change. Fetch both Jira tickets first, reconcile any conflicts, summarize the combined requirements, and ask only if something critical is missing.`

After approval, `planner` should carry the Jira-derived requirements into the implementation and review loop so both agents check against the same ticket context.

## Notes

- `./sync-agent` writes generated markdown agents to `~/.config/opencode/agents/`, copies project-local tools from `.opencode/tools/` to `~/.config/opencode/tools/`, and sets `default_agent` in `~/.config/opencode/opencode.json`.
- If `~/.config/opencode/opencode.json` already exists, the script preserves its other settings and only updates `default_agent`.
- `config/agents.json` currently makes `planner` the default agent.
- `implementer` and `reviewer` are configured as subagents so `planner` can invoke them automatically.
- The implement/review loop limit is prompt-driven: the planner is instructed to stop after 3 implementation rounds.
