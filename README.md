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
5. After a successful review pass, `planner` returns a final summary and asks whether you want to commit, open a PR, or request changes.
6. If you explicitly request a commit, a PR, or managing an existing PR, `planner` can use the synced Git/GitHub tools when they are available.
7. If you request changes instead, `planner` continues with another implementer/reviewer round.
8. If you ask `planner` to review PR comments, it fetches them first, evaluates which comments are worth acting on, proposes a minimal follow-up plan, and waits for approval before any implementation starts.

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

This repo also includes project-local Git and GitHub tools in `.opencode/tools/`:

- `git-add` - stages current-directory changes with `git add .`
- `git-commit` - creates a commit with a required `message`
- `git-push` - pushes the current branch to its configured remote
- `gh-pr-create` - pushes the current branch if needed and creates a GitHub draft PR, or returns the existing open PR for that branch instead of creating a duplicate
- `gh-pr-edit` - updates an existing GitHub pull request title and/or body by PR URL or PR number
- `gh-pr-comments` - fetches all PR review comments, review summaries, and top-level PR conversation comments for planner-side evaluation

These tools are only available after you run `./sync-agent` and reload OpenCode.

They should only be used after the implementer/reviewer workflow is complete and the user explicitly asks to commit, open a PR, or manage an existing PR. If the synced tools are not available in the runtime, `planner` should say so and ask the user to sync/reload rather than pretending it can commit or open/manage a PR.

### PR comment review workflow

When you ask `planner` to review or read comments on a GitHub pull request, it should:

1. use `gh-pr-comments` first to fetch all relevant PR comments
2. assess each comment as accepted, rejected, or needing clarification
3. explain each assessment briefly and call out conflicts between comments
4. propose a small implementation plan only for accepted items
5. ask for approval before sending any follow-up work to `implementer`

This keeps `planner` as the gatekeeper instead of automatically doing whatever PR comments request.

### Draft PR behavior

`gh-pr-create` is intentionally draft-only. It focuses on opening a draft PR now; a separate ready-for-review tool can be added later.

When `planner` opens a PR, it should first create a commit with `git-add` and `git-commit`, then call `gh-pr-create` only if the user explicitly asked for a PR.

If approved follow-up changes materially change the scope of an already open PR and it is unambiguous that the existing PR should be updated, `planner` may use `gh-pr-edit` to update that PR's title and/or body instead of creating a duplicate. If that is ambiguous, it should ask the user first.

If the current local branch is `main`, `planner` must not push directly to `main`. For commit pushes, it should create or check out `opencode/pr-<short-head-sha>` first. For draft PR creation, `gh-pr-create` applies the same safety rule automatically before pushing.

`gh-pr-create` also:

- generates an automatic draft PR title from the branch commits
- generates an automatic draft PR body with summary/testing sections
- checks for an existing open PR for the current branch and returns that PR instead of creating a duplicate

### Authentication requirements

To use the PR flow successfully:

- `gh` must already be installed and available on `PATH`
- `gh` must already be authenticated for the target GitHub host (`gh auth status` should succeed)
- normal git push authentication must already work for the repository remote

The same `gh` installation and authentication requirements also apply to `gh-pr-comments` and `gh-pr-edit`.

## Example prompt flow

See `examples/sample-task.md` for a compact sanity-check flow.

Examples:

- `Use PROJ-123 to plan this change. Fetch the Jira ticket first, summarize the requirements, inspect the repo, and propose a minimal implementation plan.`
- `Use PROJ-123 and PROJ-456 to plan this change. Fetch both Jira tickets first, reconcile any conflicts, summarize the combined requirements, and ask only if something critical is missing.`
- `Review the comments on https://github.com/example/repo/pull/123. Fetch all PR comments first, assess which suggestions are worth taking, propose a minimal follow-up plan for accepted items, and ask for approval before implementing anything.`
