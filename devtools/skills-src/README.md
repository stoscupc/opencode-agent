# Canonical Skill Sources

This directory is the single source of truth for shared skill content used by multiple harnesses.

## Layout

```
devtools/skills-src/
  <skill-id>/
    metadata.yaml       # Skill identity, classification, triggers
    intent.md           # What the skill does and when to use it
    workflow.md          # Step-by-step execution procedure
    constraints.md      # Rules and guardrails
    examples.md         # Usage examples
```

## Frontmatter Standard

Generated `SKILL.md` files conform to the [Agent Skills standard](https://agentskills.io/specification). All three harness targets (Claude, Codex, OpenCode) use the same frontmatter format:

```yaml
---
name: build-all                        # Required. Lowercase + hyphens, max 64 chars.
description: Build all projects.       # Required. Max 1024 chars.
metadata:                              # Optional. Harness-specific key-value pairs.
    harness: claude
    skill_class: edit
    source: devtools/skills-src/build-all
---
```

The `name` and `description` fields are mapped from `id` and `summary` in the canonical `metadata.yaml`. The `metadata` map carries harness-specific information that doesn't belong in the standard fields.

### Canonical `metadata.yaml` Format

```yaml
id: build-all                      # Skill identifier (becomes frontmatter "name")
title: "Build All Projects"        # Human-readable title (becomes markdown heading)
summary: "Build all projects."     # Short description (becomes frontmatter "description")
owners:
  - unassigned                     # Team or person responsible
version: 1                        # Schema version
triggers:                          # Optional. When the skill should activate.
  - User asks to build the project
required_sections:                 # Which .md files must exist
  - intent
  - workflow
  - constraints
  - examples
skill_class: edit                  # Routing class (see Skill Class below)
```

## Build Outputs

Generate harness-specific skill artifacts with:

```bash
cd devtools
go run ./cmd/gantry skill build
```

Validate canonical sources:

```bash
cd devtools
go run ./cmd/gantry skill validate
```

Validate generated files are current (CI-friendly):

```bash
cd devtools
go run ./cmd/gantry skill validate --check-generated
```

Default targets:

1. Claude: `.claude/skills/<skill-id>/SKILL.md`
2. Codex: `.codex/skills/<skill-id>/SKILL.md`
3. OpenCode: `.opencode/skills/<skill-id>/SKILL.md`

Use flags to override:

```bash
go run ./cmd/gantry skill build --targets claude,codex --claude-dir ../.claude/skills --codex-dir ../.codex/skills
```

Import existing Claude skills into canonical sources:

```bash
cd devtools
go run ./cmd/gantry skill import --source-dir ../.claude/skills
```

Notes:

1. Import is non-destructive by default (existing canonical folders are skipped).
2. Use `--overwrite` only when intentionally replacing imported canonical content.

## Authoring Rules

1. **Edit canonical files in `devtools/skills-src/` only.** Never hand-edit generated `SKILL.md` files in `.claude/skills/`, `.codex/skills/`, or `.opencode/skills/`. All generated files contain a `<!-- GENERATED FILE -->` header marking them as machine-managed.
2. **Run `gantry skill build` after any change.** This regenerates all harness-specific outputs. In CI, `gantry skill validate --check-generated` catches drift between source and generated files.
3. **Keep harness-specific differences minimal.** Harness notes are injected automatically during build. Do not fork content per harness — use the same canonical sections for all targets.

## Skill Class

Each skill's `metadata.yaml` includes a `skill_class` field that controls which harnesses can execute it:

| Class | Harnesses | Use When |
|-------|-----------|----------|
| `readonly` | All (including bobby) | Skill only reads/queries — no file edits |
| `edit` | claude-code, opencode, codex, codex-sdk | Skill writes files or runs git |
| `browser` | claude-code | Skill needs browser access |
| `interactive` | claude-code | Skill invokes other MCP skills |

## Workflow: Adding or Modifying a Skill

```
1. Create or edit files in devtools/skills-src/<skill-id>/
2. Set skill_class in metadata.yaml
3. Run: gantry skill build
4. Run: gantry skill validate --check-generated
5. Commit both devtools/skills-src/ and generated directories together
```

## Workflow: Creating a New Skill

```
1. mkdir devtools/skills-src/<skill-id>
2. Create metadata.yaml with id, title, summary, skill_class, required_sections
3. Create intent.md, workflow.md, constraints.md, examples.md
4. Run: gantry skill build
5. Run: gantry skill validate --check-generated
6. Verify generated files in .claude/skills/, .codex/skills/, .opencode/skills/
7. Commit source + generated files together
```

## Testing

The skill system has three test layers:

- **Golden tests** — verify exact rendered output for each harness target (`skill_golden_test.go`)
- **Build tests** — verify frontmatter fields are correct for all targets (`skill_build_test.go`)
- **Smoke tests** — verify on-disk generated files match what `skill build` would produce, cross-harness completeness, section ordering, and skill class consistency (`skill_smoke_test.go`)

Run all skill tests:

```bash
cd devtools
go test -race -run 'TestGolden|TestRenderSkill_Frontmatter|TestLoadSkillSource|TestRenderAndWrite|TestValidateSkills|TestSmoke' ./cmd/zdev/ -v
```

## Deprecation: Manual Skill Editing

Generated files under `.claude/skills/`, `.codex/skills/`, and `.opencode/skills/` are **no longer manually editable**. Any hand-edits will be overwritten on the next `gantry skill build`. If you need to change a skill:

- Modify the canonical source in `devtools/skills-src/<skill-id>/`
- Rebuild and re-validate
- Commit the source and generated files together
