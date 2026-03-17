### Run the full workflow

```
/lint-markdown-fix
```

This will:
1. Run `just lint-markdown` and parse all errors
2. Create a gantry workflow with batch artifacts
3. Create parallel tasks for agents to claim

### Typical batch artifact content

```markdown
# Batch 3: z-tf-expert/docs

Errors: 199
Files: 20

## Error Listing

z-tf-expert/docs/design-eval-and-accuracy.md:45 MD040/fenced-code-language Fenced code blocks should have a language specified
z-tf-expert/docs/design-eval-and-accuracy.md:112 MD040/fenced-code-language Fenced code blocks should have a language specified
z-tf-expert/docs/workflows/boot-linux-classic-lpar.md:8 MD036/no-emphasis-as-heading Emphasis used instead of a heading

## Fix Instructions

- MD040: Add language identifier to fenced code blocks (inspect content for correct language)
- MD036: Convert bold-as-heading to proper ## headings at appropriate level
```

### Agent picks up a task

Agent claims "fix-md-lint: z-tf-expert/docs (199 errors)", reads the manifest, fixes each file, verifies with `markdownlint-cli2`, commits, and completes the task.

### Verification command per batch

```bash
markdownlint-cli2 z-tf-expert/docs/design-eval-and-accuracy.md z-tf-expert/docs/workflows/boot-linux-classic-lpar.md ...
```
