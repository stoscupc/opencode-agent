### Create a 4-Stage Pipeline

```
# Stage 1: Wireframe
task_create(
  title="[hmc-sim] tabbed-panel: wireframe",
  workflow_id="wf-abc123",
  workstream_id="hmc-sim",
  role="design",
  priority=2,
  description="Create wireframe mockup per docs/design/ux/cpc-lpar/tabbed-panel.md.\n\n<!-- pipeline\ngroup: hmc-sim-tabbed-panel\nsequence: 1\ntotal: 4\ncontext: docs/design/ux/cpc-lpar/tabbed-panel.md\nstop_on_fail: true\n-->",
  tags=["ux-coord", "design-pipeline-tabbed-panel", "stage-wireframe"]
)

# Stage 2: Storybook (blocked by wireframe)
task_create(
  title="[hmc-sim] tabbed-panel: storybook",
  workflow_id="wf-abc123",
  workstream_id="hmc-sim",
  role="impl",
  priority=2,
  blocked_by=["<wireframe-task-id>"],
  description="Build Storybook component stubs per wireframe output.\n\n<!-- pipeline\ngroup: hmc-sim-tabbed-panel\nsequence: 2\ntotal: 4\ncontext: docs/design/ux/cpc-lpar/tabbed-panel.md\nstop_on_fail: true\n-->",
  tags=["ux-coord", "design-pipeline-tabbed-panel", "stage-storybook"]
)
```

### Ledger Entry

```markdown
### tabbed-panel (hmc-sim)

- **Design doc**: docs/design/ux/cpc-lpar/tabbed-panel.md
- **Current stage**: storybook
- **Status**: In progress

| Stage | Task ID | Status |
|-------|---------|--------|
| wireframe | abc123 | completed |
| storybook | def456 | claimed |
| app-fiber | — | pending |
| test-validation | — | pending |
```

### Acceptance Scenario Format

```markdown
## Acceptance Scenarios

### SC-1: Tab switching preserves content
**Given** the tabbed panel is rendered with 3 tabs
**When** the user clicks tab 2, then tab 1
**Then** tab 1 content is restored without re-fetching
```
