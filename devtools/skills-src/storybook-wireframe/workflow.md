### When to use

Use this template when a design task has a `stage-wireframe` tag, or when creating any new UI component/view wireframe. The wireframe is the **primary deliverable** of the design role for UX work.

### Output location

```
web/storybook/stories/wireframes/<FeatureName>.stories.tsx
```

### File structure

Every wireframe story follows this structure:

```tsx
/* eslint-disable i18next/no-literal-string */
/**
 * <Feature Name> Wireframe
 *
 * <1-2 sentence description of the component/view>
 *
 * <Interaction model — how users interact with this component>
 *
 * Stories:
 * 1. <StoryName> — <what it demonstrates>
 * 2. <StoryName> — <what it demonstrates>
 * ...
 *
 * Design ref: <path to design doc>
 * Existing: <path to existing component if any>
 */
import type { Meta, StoryObj } from '@storybook/react';

/* -- Types ----------------------------------------------------------------- */

// Local interfaces for mock data (not imported from stores)
interface Mock<Entity> {
  // ...
}

/* -- Fixture data ---------------------------------------------------------- */

const fixtures: Mock<Entity>[] = [
  // Realistic mock data matching production shapes
];

/* -- Role colors (shared across wireframes) -------------------------------- */

const roleColors: Record<string, string> = {
  ops: '#be95ff',
  impl: '#78a9ff',
  test: '#42be65',
  design: '#ff832b',
  review: '#08bdba',
  bugfix: '#fa4d56',
  scribe: '#d4bbff',
};

/* -- Severity colors (shared across wireframes) ---------------------------- */

const severityColors: Record<string, { bg: string; text: string; border: string; glow?: string }> = {
  success: { bg: '#0e2e1a', text: '#42be65', border: '#198038' },
  info:    { bg: '#0c1f3e', text: '#78a9ff', border: '#0043ce' },
  warning: { bg: '#3e2800', text: '#f1c21b', border: '#8a6d3b', glow: '0 0 8px rgba(241,194,27,0.15)' },
  critical:{ bg: '#3e0c0c', text: '#fa4d56', border: '#da1e28', glow: '0 0 8px rgba(250,77,86,0.2)' },
};

/* -- Helper components ----------------------------------------------------- */

// Small inline components for badges, indicators, progress bars, etc.
// Keep these in the story file — they are wireframe-only, not production code.

/* -- Main wireframe component ---------------------------------------------- */

function FeatureWireframe(props: { /* story args */ }) {
  return (
    <div style={{
      background: 'var(--z-bg, #161616)',
      color: 'var(--z-text-primary, #f4f4f4)',
      fontFamily: "'IBM Plex Sans', system-ui, sans-serif",
      // Use --z-space-* tokens via CSS custom properties
    }}>
      {/* Layout using flex/grid with gap: var(--z-space-05) */}
    </div>
  );
}

/* -- Storybook meta -------------------------------------------------------- */

const meta: Meta<typeof FeatureWireframe> = {
  title: 'Wireframes/<FeatureName>',
  component: FeatureWireframe,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: '<ASCII art layout diagram or description>',
      },
    },
  },
};
export default meta;

type Story = StoryObj<typeof FeatureWireframe>;

/* -- Stories --------------------------------------------------------------- */

export const Default: Story = { args: { /* ... */ } };
export const Empty: Story = { args: { /* ... */ } };
// Add 2-6 stories covering: populated, empty, loading, error, edge cases
```

### Design tokens

Use CSS custom properties from the design system tokens:

| Token | Usage |
|-------|-------|
| `--z-space-01` through `--z-space-12` | Spacing (IBM 2x Grid) |
| `--z-bg` / `--z-bg-hover` | Background colors |
| `--z-text-primary` / `--z-text-secondary` | Text colors |
| `--z-border-subtle` / `--z-border-strong` | Border colors |
| `--z-layer-01` / `--z-layer-02` | Surface layers |

When tokens aren't available via CSS vars in Storybook, use fallback hex values:
- Background: `#161616` (gray-100)
- Surface: `#262626` (gray-90)
- Text primary: `#f4f4f4` (gray-10)
- Text secondary: `#c6c6c6` (gray-30)
- Border subtle: `#393939` (gray-80)
- Border strong: `#525252` (gray-70)

### Conventions

1. **`eslint-disable i18next/no-literal-string`** — Always add as the first line. Wireframes use literal strings, not i18n keys.

2. **No external imports beyond Storybook** — Wireframes are self-contained. Define mock types, fixtures, and helper components inline. Do not import from stores or production components.

3. **Exception: real components for fidelity** — When a wireframe replaces an existing view (like DatacenterZoom), it MAY import real components (TanstackGrid, Breadcrumb, EmptyState) to demonstrate actual interaction fidelity. Document imports in the file header.

4. **Role colors** — Use the canonical roleColors map. Every role-tagged element should use the role's hex color.

5. **Severity styling** — Use the severityColors map with gradients for warning/critical states. Add `boxShadow` glow for critical/warning severity.

6. **Story count** — Minimum 2 stories (populated + empty). Target 4-6 stories covering the primary states.

7. **InShellContext story** — When the component lives within the shell layout, add a final story showing it in context with a simplified shell chrome wrapper.

8. **Type-check** — Run `npx tsc --noEmit --pretty <file>` before completing. Only upstream `node_modules` errors are acceptable.

9. **File header** — Always include: component description, interaction model, story list, design doc reference, and path to existing implementation (if any).

### Existing wireframes (reference)

| Wireframe | Stories | Pattern |
|-----------|---------|---------|
| `ShellLayout` | Shell chrome + fiber panels | Layout composition |
| `ExoPanel` | Coordinator sidebar | Entity focus, sparklines, workflow preview |
| `SessionsSlideout` | Session list slideout | Role badges, progress bars, event counts |
| `SessionsGrid` | Full-tab TanstackGrid | Spreadsheet columns, footer summary |
| `DatacenterZoom` | 3-level drill-down | Real components, breadcrumb navigation |
| `SessionDetailView` | Session detail + takeover | Sections: header, pipeline, resources, events, actions |
| `FabricEventTicker` | Horizontal bubble feed | Severity bubbles, AHFR pinned right, overflow |
| `SessionEventInteraction` | Per-session event panel | Type-specific actions, AHFR expand/confirm |
| `ExoPanelEventFeed` | Conversation-style event stream | Filter pills, AHFR blocking/advisory, option select |

### Workflow integration

```
Design doc (docs/design/ux/*.md)
  ↓
Wireframe story (web/storybook/stories/wireframes/*.stories.tsx)  ← YOU ARE HERE
  ↓
Review approval (zdev review task)
  ↓
Implementation (impl role updates story with real components)
  ↓
E2E validation (test role writes playwright specs)
```

### Checklist before completing a wireframe task

- [ ] File at `web/storybook/stories/wireframes/<Name>.stories.tsx`
- [ ] `eslint-disable i18next/no-literal-string` on line 1
- [ ] File header with description, interaction model, story list, design ref
- [ ] Types and fixtures defined inline (no store imports)
- [ ] Role colors and severity colors match canonical values
- [ ] 2-6 stories covering populated, empty, and edge cases
- [ ] `meta.title` starts with `Wireframes/`
- [ ] Type-check passes (only upstream node_modules errors)
- [ ] `broadcast_result` with kind=build after type-check
- [ ] `task_complete` with file list
