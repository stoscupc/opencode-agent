Orchestrate parallel markdown lint fixes across the monorepo. Runs `just lint-markdown`, parses errors into directory-grouped batches, stores each batch as a zdev artifact, and creates one task per batch for parallel agent execution.

Use this skill when:

- `just lint-markdown` reports errors that need fixing across many files
- You want to parallelize markdown cleanup across multiple agents
- You need a structured, auditable lint-fix workflow with artifact tracking
