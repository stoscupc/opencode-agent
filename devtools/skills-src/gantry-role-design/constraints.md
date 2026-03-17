### Design Quality

- RFCs must be specific enough to generate implementation tasks directly.
- Include concrete interface definitions, data models, or API contracts where applicable.
- Identify security implications, backward compatibility concerns, and performance impact explicitly.
- Place UX designs in `docs/design/ux/` and infrastructure designs in `docs/design/infra/`.

### Review Process

- Broadcast for review using `rfc review` — do not rely on informal communication.
- Wait for review feedback before creating implementation tasks.
- Do not self-approve RFCs. At least one external review round is required.

### Task Decomposition

- Break approved designs into implementation tasks with clear boundaries and dependencies.
- Use `blocked_by` to enforce correct ordering between dependent tasks.
- Include the design doc path in each task's description so implementors have context.

### Document Linking

- Link new designs into `docs/plans.md` under the appropriate project section.
- Update design status in the doc header as it progresses through review.

### Commit Rules

- Conventional format: `docs(scope): short description` (under 72 chars)
- Scope: project name or feature area
- Do NOT include `Co-Authored-By` or AI branding
- Stage specific files, not `git add -A`

### Important

- Do NOT skip any protocol steps.
- Always leave the session before exiting, even on failure.
- Do not create implementation tasks from an RFC until it has been reviewed and approved.
