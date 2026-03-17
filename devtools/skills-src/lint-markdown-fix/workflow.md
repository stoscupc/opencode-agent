## Phase 1: Lint and Analyze

1. Run `just lint-markdown` and capture full output.
2. Parse errors into structured form: `{file, line, rule, message}`.
3. Group files into batches by top-level directory. Target 4-8 batches for parallelism.
   Suggested groupings (adjust based on actual error counts):
   - `isof/docs/archive/` — archived docs (often the largest batch, split if >500 errors)
   - `isof/docs/` (non-archive) — active ISOF docs
   - `z-tf-expert/docs/` — expert workflow docs
   - `docs/design/` — infrastructure and UX design specs
   - `iocp-sim/docs/ + hmc-sim/docs/` — simulator docs
   - `docs/dev/ + docs/* + remaining projects` — dev docs and miscellaneous

## Phase 2: Create Workflow and Artifacts

1. MCP: `session_join` with role="ops", focus="lint-markdown-fix orchestration"
2. MCP: `workflow_create` with title="lint-markdown-fix-YYYY-MM-DD", tags=["lint", "markdown"]
3. For each batch, create an artifact:
   - MCP: `artifact_write` with path="/batches/batch-N.md", content=batch manifest
   - Batch manifest format (markdown):
     ```markdown
     # Batch N: <scope>
     Errors: <count>
     Files: <count>
     ## Error Listing
     <file>:<line> <rule> <message>
     ...
     ## Fix Instructions
     - MD040: Add appropriate language identifier to fenced code blocks
     - MD036: Convert bold-as-heading to proper `##` headings
     - MD025: Ensure single top-level `#` heading per file
     - (rule-specific guidance for each rule in this batch)
     ```
   - MCP: `artifact_publish` to workflow store for durability
4. Store a summary artifact:
   - MCP: `artifact_write` path="/reports/lint-summary.md" with totals and batch index

## Phase 3: Create Parallel Tasks

For each batch, create a gantry task:

- MCP: `task_create` with:
  - title: "fix-md-lint: <scope> (<N> errors)"
  - role: "impl"
  - priority: 3 (medium)
  - description: Full batch manifest (inline) + instructions
  - files: list of affected files in the batch

Task description template:

```
Fix markdown lint errors for batch <N>: <scope>.

Errors: <error_count> across <file_count> files.

## Artifact
Batch manifest: artifact://<workflow_id>/batches/batch-N.md

## Rules to Fix
<per-rule instructions>

## Files
<file list>

## Verification
After fixing, run: markdownlint-cli2 <file1> <file2> ...
All files must pass with 0 errors before completing.
```

Add pipeline metadata to enable sequential agent claiming:
```html
<!-- pipeline group="lint-md-fix" sequence="N" total="T" stop_on_fail="false" -->
```

## Phase 4: Agent Execution (per-task)

Each agent (impl role) claims and executes one batch:

1. Read the task description to get the file list and rules.
2. For each file, fix the lint errors:
   - **MD040**: Inspect code block content, add the correct language (`bash`, `go`, `yaml`, `json`, `text`, `hcl`, `rust`, `sql`, `python`, `toml`, `ini`, `xml`, `console`, `diff`, etc.).
   - **MD036**: Replace `**Bold Heading**` with `## Bold Heading` (or appropriate level).
   - **MD025**: Remove duplicate `#` headings or demote to `##`.
   - **MD051**: Fix fragment links to match actual heading anchors.
   - **MD056**: Fix table column counts to be consistent.
   - **MD028**: Remove blank lines inside blockquotes.
   - **MD046**: Convert indented code blocks to fenced.
   - **MD003**: Convert setext headings to ATX (`#`).
   - **MD041**: Add top-level heading if missing.
   - **MD024**: Rename duplicate sibling headings.
   - **MD001**: Fix heading level increments (no skipping from `#` to `###`).
3. Verify: run `markdownlint-cli2 <files>` and confirm 0 errors.
4. Commit: `docs(<scope>): fix markdown lint errors`
5. Broadcast: `broadcast_result` kind="lint", project="docs", success=true
6. Complete: `task_complete` with summary and commit SHA.

## Phase 5: Verification

After all tasks complete:

1. Run `just lint-markdown` again.
2. Broadcast final result: `broadcast_result` kind="lint", project="monorepo", success=<pass/fail>
3. Complete workflow: `workflow_complete` with status="completed" (or "failed" if residual errors).
