### Join as design coordinator

```bash
# MCP (preferred)
session_join(role="design", focus="ux-coord: <design-name>")

# CLI
cd devtools && bin/gantry session join design --focus "ux-coord: <design-name>"
```

### Design Pipeline Creation

Given an approved design doc, decompose it into a 4-stage delivery pipeline:

| Stage | Output | Target Role | Tag |
|-------|--------|-------------|-----|
| `wireframe` | Mockup/diagram, component identification | design | `stage-wireframe` |
| `storybook` | Component stubs, CSS, Storybook stories | impl | `stage-storybook` |
| `app-fiber` | Working feature integrated into fiber app | impl | `stage-app-fiber` |
| `test-validation` | E2E tests, acceptance scenario verification | test | `stage-test-validation` |

**Step-by-step:**

1. Read the design doc referenced in the task description.
2. Identify the components, views, and interactions described.
3. Create one task per stage using `task_create`:
   - **Title:** `[project] <design-name>: <stage>` (e.g., `[hmc-sim] tabbed-panel: wireframe`)
   - **Role:** Target role for that stage (see table above)
   - **Priority:** Match the priority of the parent ux-coord task
   - **Tags:** `["ux-coord", "design-pipeline-<design-name>", "stage-<stage>"]`
   - **Files:** List the design doc + expected output files
   - **Description:** What needs to be built for this stage. Include the design doc path, relevant section, and the acceptance scenarios for this stage.
4. Chain with `blocked_by` so stages execute in order:
   - storybook `blocked_by` wireframe
   - app-fiber `blocked_by` storybook
   - test-validation `blocked_by` app-fiber
5. Add pipeline metadata to each task description:

```
<!-- pipeline
group: <project>-<design-name>
sequence: <1-4>
total: 4
context: <design-doc-path>, <output-file-paths>
stop_on_fail: true
-->
```

**Custom stages:** For non-UI designs (backend, infrastructure), replace the standard 4 stages with appropriate alternatives. Document custom stages in the ledger entry. Examples:

- Backend: `interface-design` → `implementation` → `integration-test` → `load-test`
- Infrastructure: `architecture` → `terraform-module` → `deployment` → `validation`

### Ledger Management

The design ledger lives at `docs/dev/design-ledger.md`. The ux-coord agent is responsible for:

1. **Adding entries:** When decomposing a new design, add a section under `## Active Designs` using the template in the ledger file.
2. **Recording task IDs:** Fill in the Task IDs table as pipeline tasks are created.
3. **Updating stages:** When notified (via `events_poll` or task description) that a stage completed, update the Stage History table and advance `Current stage`.
4. **Moving to Completed:** When all stages pass and all acceptance scenarios are verified, move the design section from Active to Completed with a completion date.

### Acceptance Scenario Authoring

Write acceptance scenarios into a `## Acceptance Scenarios` section **in the design doc itself** (co-located with the design). Use this format:

```markdown
