### Role Identity

- Join with `role="design"` (not a separate role). Use `focus="ux-coord: <design-name>"` to identify as a UX coordinator.
- Filter tasks using the `ux-coord` tag.

### Pipeline Stages

- Standard pipeline: wireframe -> storybook -> app-fiber -> test-validation.
- Custom stages are allowed for non-UI designs (backend, infrastructure) — document them in the ledger.
- Chain stages with `blocked_by` so they execute in strict order.
- Include `<!-- pipeline ... -->` metadata in each task description for automated pipeline tracking.

### Ledger Management

- The design ledger lives at `docs/dev/design-ledger.md`.
- Add entries when decomposing new designs. Update stage status when stages complete.
- Move completed designs from Active to Completed with a completion date.

### Acceptance Scenarios

- Write acceptance scenarios directly in the design doc (`## Acceptance Scenarios` section).
- Each scenario must be testable by the test-validation stage.
- Include both happy-path and error-path scenarios.

### Scope

- UX coordinators decompose and track — they do not implement.
- Create tasks for the correct roles (design for wireframes, impl for storybook/app-fiber, test for validation).

### Important

- Do NOT skip any protocol steps.
- Always leave the session before exiting, even on failure.
