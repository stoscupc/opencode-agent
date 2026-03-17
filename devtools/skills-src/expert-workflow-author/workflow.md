### Creating a New Workflow

1. Create a new `.md` file in `z-tf-expert/docs/workflows/`
2. Start with the standard header (title, outcome, grounding, parameters)
3. Add a `params` scripted block defining all inputs
4. Write each step as a markdown section with narrative + scripted block
5. Common pattern: authenticate first, then iterate over resources, cleanup last
6. Test by parsing: the parser extracts all ` ```scripted ` blocks to build the workflow definition

### Editing an Existing Workflow

1. Read the existing file to understand its structure
2. Preserve ALL existing narrative content — do not strip documentation
3. Add/modify ` ```scripted ` blocks alongside the narrative
4. Ensure step IDs are unique across the file
5. Verify `{{var}}` references point to params or prior step outputs

### Best Practices

- **Keep step IDs short and descriptive**: `auth`, `list_cpcs`, `get_cpc_detail`
- **Always authenticate before API calls**: first step should be `hmc.authenticate`
- **Always cleanup**: last step should be `hmc.logout`
- **Use `on_error: retry(3)`** for network-dependent steps
- **Use `on_error: skip`** for optional information gathering
- **Use `validate`** after critical steps to fail fast on broken invariants
- **Use `register`** when you need the full raw result for later processing
- **Write narrative between steps** explaining the "why" — the scripted block handles the "what"
- **Reference the HMC docs MCP** (`mcp__z-manuals-kb__search`) to find correct API paths and property names

### Example: Minimal Probing Workflow

```markdown
# Workflow: Quick HMC Probe

**Outcome**: Verify HMC connectivity and enumerate CPCs.
