# OpenCode Multi-Agent Skeleton

This repo is a prompt-first skeleton for running OpenCode in a lightweight development workflow. It syncs project-local prompts, agent config, and tools into your OpenCode setup so you can use `planner`, `implementer`, and `reviewer` to plan work, implement approved changes, review them, and then optionally handle Jira and GitHub follow-up tasks.

It includes project-local integrations for:

- Jira issue lookup, creation, and status updates
- Git and GitHub workflows such as commits, draft PR creation, PR edits, and PR comment review/replies

## Prerequisites

Before normal use, complete these one-time setup steps:

1. Make sure Python 3 is available:

   ```sh
   python3 --version
   ```

2. Install OpenCode:

   ```sh
   make install-opencode
   ```

   This Homebrew-based helper installs `opencode` separately from repo setup.

3. Connect OpenCode to a provider once:

   ```sh
   opencode
   ```

   Then run `/connect` inside OpenCode and finish provider setup (GitHub Copilot recommended).

4. Run the repo setup entry point:

   ```sh
   make setup
   ```

   `make setup` is the normal repo setup entry point after OpenCode is already installed and connected. It keeps `python3` as a hard blocker, fails clearly if `opencode` is missing, persists Jira credentials from your shell or this setup repo's local `.env` into `~/.config/opencode/jira.env` when available, warns if Jira environment variables are missing, prints non-blocking GitHub CLI install/auth guidance for PR-related workflows, and runs the lower-level sync step for you.

### One-time setup summary

Run these commands in order:

```sh
python3 --version
make install-opencode
opencode
# run /connect inside OpenCode once
make setup
```

### Optional one-time setup for integrations

- GitHub PR workflows:

  ```sh
  gh auth status
  ```

  If `gh` is not installed yet, install it first (for example with Homebrew: `brew install gh`), then run:

  ```sh
  gh auth login
  gh auth status
  ```

- Jira workflows:

  ```sh
  cp .env.example .env
  ```

  Then set `JIRA_BASE_URL`, `JIRA_EMAIL`, and `JIRA_API_TOKEN` in `.env` or in your shell environment, then run `make setup` to persist them to `~/.config/opencode/jira.env` for the Jira tools.

## Quick start

After the one-time setup above:

1. Open a terminal in the folder for the project you want to work on.
2. Run `make open`.
3. Describe the work you want done, or paste a Jira ticket link.

`make open` runs the repo-local `./start-agent` launcher. It checks whether this clone is behind `origin/main`, prompts you to update, and only auto-runs `git pull --ff-only origin main` when you are already on a clean local `main` branch and the update is fast-forward-safe. If those checks fail, it prints short manual update steps and still launches `opencode`.

`./sync-agent` also includes a non-blocking reminder when this clone is behind `origin/main`, which is useful during setup and repo-local iteration.

## Default workflow

1. `planner` inspects the repo and proposes a plan.
2. You approve the plan.
3. If Jira issue key(s) were part of that approved work, `planner` updates all provided Jira issues to `In Progress` before implementation starts.
4. `planner` delegates to `implementer` and `reviewer`.
5. `implementer` and `reviewer` loop for up to 3 rounds total.
6. After a successful review pass, `planner` returns a final walkthrough summary and asks a numbered next-step prompt with only one option-2 variant based on PR state:
   - if no PR exists yet for the current work: `Next step? Reply with 1, 2, 3, or the words: 1. Commit this locally 2. Commit this and open a PR 3. Request changes`
   - if a PR is already open: `Next step? Reply with 1, 2, 3, or the words: 1. Commit this locally 2. Commit this and update the PR 3. Request changes`
7. If you explicitly request a commit, a PR, or managing an existing PR, `planner` can use the synced Git/GitHub tools when they are available.
8. If you request changes instead, `planner` continues with another implementer/reviewer round.
9. If you ask `planner` to review PR comments, it fetches them first, evaluates which comments are worth acting on, proposes a minimal follow-up plan, and waits for approval before any implementation starts.
10. If that approved follow-up work is later committed and pushed back to the same PR, `planner` can automatically post review-comment replies that reflect the final implemented outcome.

The prompts use explicit output markers to keep that loop reliable:

- `implementer` ends with `STATUS`, `FILES`, `VALIDATION`, and `NOTES`
- `reviewer` ends with `VERDICT`, `ISSUES`, and `RESIDUAL_RISK`
- `planner` tracks iterations and only continues when `reviewer` returns `VERDICT: revise`

The approved `planner` final summary should be robust enough to guide a reviewer and to serve as the default PR body. It should render these as real Markdown heading sections, preferably with explicit `##` headings, in this order:

- `## Summary`
- `## How to review`
- `## File-by-file review notes`
- `## Behavior to verify`
- `## Validation run`
- `## Risks / edge cases`
- `## README / docs updates`

In `## File-by-file review notes`, include changed line numbers or line ranges when practical. Keep that guidance lightweight by preferring the current diff's changed ranges over overly granular references.

## Repository layout

- `prompts/planner.md` - plans changes, asks for missing context, and orchestrates the workflow
- `prompts/implementer.md` - implements an approved plan
- `prompts/reviewer.md` - reviews changes for correctness and scope
- `config/agents.json` - agent manifest; currently sets `planner` as the default agent
- `config/*.json` - per-agent metadata used by the sync script
- `.opencode/tools/` - project-local custom tools for Jira and Git actions
- `Makefile` - includes `make install-opencode` and `make setup` for local setup
- `sync-agent` - lower-level sync script used by `make setup` and by agent/tool authors
- `examples/sample-task.md` - a small example prompt flow for sanity-checking the setup

`src/` and `tests/` exist but are not the center of this skeleton today.

## Contributing to this repo

Most users should complete the one-time setup above, then use `make setup` when needed and `make open` to launch OpenCode for this repo. If you are contributing to this repo itself, a lightweight workflow is:

1. Create a branch.
2. Make your changes.
3. Run `./sync-agent`, then rerun `make open` to test your changes.
4. Open a PR.

`./sync-agent` is the lower-level sync step behind `make setup`. Use it directly when you are iterating on prompts, agent config, or files under `.opencode/tools/`. It also prints a non-blocking reminder when this repo clone is behind `origin/main`.

The script:

- writes generated agent markdown files to `~/.config/opencode/agents/`
- copies project-local tools from `.opencode/tools/` to `~/.config/opencode/tools/`
- updates `default_agent` in `~/.config/opencode/opencode.json`

If `~/.config/opencode/opencode.json` already exists, the script preserves other settings and only updates `default_agent`.

## Jira tools

This repo includes project-local Jira tools in `.opencode/tools/`:

- `jira` at `.opencode/tools/jira.ts` to fetch a Jira issue by key
- `jira-create` at `.opencode/tools/jira-create.ts` to create a Jira issue in a project, optionally under an epic
- `jira-update-status` at `.opencode/tools/jira-update-status.ts` to move a Jira issue to a requested status by applying a matching Jira transition, defaulting to `In Progress`

The repo's only declared dependency is `@opencode-ai/plugin`, which the custom tools use.

### Jira environment variables

Set these values using your normal environment-loading workflow before running `make setup`:

- `JIRA_BASE_URL` - for example `https://your-domain.atlassian.net`
- `JIRA_EMAIL` - the email address used for Jira API-token auth
- `JIRA_API_TOKEN` - the Jira API token paired with that email

`.env.example` shows the expected variable names. During `make setup`, this setup repo can read Jira values from your current shell first, then from this repo's local `.env`, and persist them to `~/.config/opencode/jira.env` for the Jira tools.

When the Jira tools run, they:

1. check `process.env` first
2. fall back to `~/.config/opencode/jira.env`

If a Jira variable is present in `process.env` but blank, the tool treats it as invalid and does not fall back to the persisted Jira env file for that variable.

### Jira usage

Example request:

- `Use the jira tool to fetch PROJ-123`
- `Use the jira-create tool to create a Task in PROJ with summary "Follow up docs" and description "Document the new workflow."`
- `Use the jira-create tool to create a Task in PROJ under epic PROJ-123 with summary "Follow up docs" and description "Document the new workflow."`
- `Use the jira-update-status tool to move PROJ-123 to In Progress`
- `Use the jira-update-status tool to move PROJ-123 to Done`

If you include Jira issue keys in a planning request, `planner` should fetch them first, summarize the requirements, flag conflicts, ask only when critical details are missing, and pass that Jira context into `implementer` and `reviewer`.

After you approve a plan that included Jira issue key(s), `planner` should update all provided Jira issues to `In Progress` with `jira-update-status` before it starts implementation. If a provided issue does not have a matching `In Progress` transition available, `planner` should stop and report that blocker instead of proceeding.

`planner` should only create a Jira issue with `jira-create` when the user explicitly asks.

## Git tools

This repo also includes project-local Git and GitHub tools in `.opencode/tools/`:

- `git-add` - stages current-directory changes with `git add .`
- `git-commit` - creates a commit with a required `message`
- `git-push` - pushes the current branch to its configured remote
- `gh-pr-create` - pushes the current branch if needed and creates a GitHub draft PR, or returns the existing open PR for that branch instead of creating a duplicate
- `gh-pr-edit` - updates an existing GitHub pull request title and/or body by PR URL or PR number
- `gh-pr-comments` - fetches all PR review comments, review summaries, and top-level PR conversation comments for planner-side evaluation
- `gh-pr-reply` - posts a reply to a GitHub PR review comment thread by PR URL/number and review comment id

These tools are only available after you run `make setup` (or `./sync-agent` directly) and reload OpenCode.

They should only be used after the implementer/reviewer workflow is complete and the user explicitly asks to commit, open a PR, or manage an existing PR. If the synced tools are not available in the runtime, `planner` should say so and ask the user to sync/reload rather than pretending it can commit or open/manage a PR.

### PR comment review workflow

When you ask `planner` to review or read comments on a GitHub pull request, it should:

1. use `gh-pr-comments` first to fetch all relevant PR comments
2. assess each comment as accepted, rejected, or needing clarification
3. explain each assessment briefly and call out conflicts between comments
4. propose a small implementation plan only for accepted items
5. ask for approval before sending any follow-up work to `implementer`

This keeps `planner` as the gatekeeper instead of automatically doing whatever PR comments request.

If the user later approves that follow-up work and explicitly asks to commit it in a way that updates and pushes the existing PR, `planner` should automatically post concise replies for all previously assessed `review_comment` items.

Those replies should:

- be posted only after the implementation is approved and the PR update is actually pushed
- reflect the final implemented outcome, not stale proposal text
- mention scope changes when the implemented result differs from the original follow-up plan
- stay limited to PR `review_comment` threads only, not top-level conversation comments

If the user chooses a local-only commit, `planner` should not post any PR comment replies.

### Draft PR behavior

`gh-pr-create` is intentionally draft-only. It focuses on opening a draft PR now; a separate ready-for-review tool can be added later.

When `planner` opens a PR, it should first create a commit with `git-add` and `git-commit`, then call `gh-pr-create` only if the user explicitly asked for a PR.

By default, `planner` should pass its full approved walkthrough as the PR body when opening a PR, and should use the same walkthrough when updating an existing PR body.

If approved follow-up changes materially change the scope of an already open PR and it is unambiguous that the existing PR should be updated, `planner` may use `gh-pr-edit` to update that PR's title and/or body instead of creating a duplicate. If that is ambiguous, it should ask the user first.

If the current local branch is `main`, `planner` must not push directly to `main`. For commit pushes, it should create or check out `opencode/pr-<short-head-sha>` first. For draft PR creation, `gh-pr-create` applies the same safety rule automatically before pushing.

`gh-pr-create` also:

- generates an automatic draft PR title from the branch commits
- prefixes that title with the first detected Jira key from the branch/commit context for Jira-linked work, unless the title already starts with that key
- accepts optional `title` and `body` overrides from `planner`
- keeps its fallback draft PR body intentionally minimal
- checks for an existing open PR for the current branch and returns that PR instead of creating a duplicate

Robust reviewer guidance belongs in `planner`, not in `gh-pr-create`. If the PR body is missing the fuller walkthrough, that should be treated as a planner/workflow issue rather than something the tool silently expands into a richer autogenerated review guide.

### Authentication requirements

To use the PR flow successfully:

- `gh` must already be installed and available on `PATH`
- `gh` must already be authenticated for the target GitHub host (`gh auth status` should succeed)
- normal git push authentication must already work for the repository remote

The same `gh` installation and authentication requirements also apply to `gh-pr-comments`, `gh-pr-edit`, and `gh-pr-reply`.

## Example prompt flow

See `examples/sample-task.md` for a compact sanity-check flow.

Examples:

- `Use PROJ-123 to plan this change. Fetch the Jira ticket first, summarize the requirements, inspect the repo, and propose a minimal implementation plan.`
- `Use PROJ-123 and PROJ-456 to plan this change. Fetch both Jira tickets first, reconcile any conflicts, summarize the combined requirements, and ask only if something critical is missing.`
- `Review the comments on https://github.com/example/repo/pull/123. Fetch all PR comments first, assess which suggestions are worth taking, propose a minimal follow-up plan for accepted items, and ask for approval before implementing anything.`
