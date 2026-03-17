### RFC Structure

- Every RFC must have a clear problem statement, proposed solution, tradeoffs, alternatives considered, and open questions.
- Place RFC documents in `docs/<feature-name>/README.md` with a companion `status.json`.
- Link RFCs in `docs/plans.md` under the appropriate project section.

### Review Process

- Use `rfc review <feature-name>` to broadcast for review — do not rely on informal communication.
- Each `rfc review` call increments the review round counter. Track which round addressed which feedback.
- Wait for review feedback before iterating. Do not self-approve RFCs.

### Design Quality

- RFCs should be specific enough to generate implementation tasks directly.
- Include concrete interface definitions, data models, or API contracts where applicable.
- Identify security implications and backward compatibility concerns explicitly.

### Important

- Do not create implementation tasks from an RFC until it has been reviewed and approved.
- Keep RFC scope focused — split large designs into separate RFCs with clear boundaries.
