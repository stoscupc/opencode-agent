User: "Create a wireframe for the session detail view"

1. Check for a design doc at `docs/design/ux/session/` to understand requirements
2. Create `web/storybook/stories/wireframes/SessionDetailView.stories.tsx`
3. Add `eslint-disable i18next/no-literal-string` on line 1
4. Write file header:
   ```tsx
   /**
    * Session Detail View Wireframe
    *
    * Full-page view for a single coordination session showing header,
    * task pipeline, linked resources, event stream, and actions.
    *
    * Interaction: click session from grid -> detail view with breadcrumb back.
    *
    * Stories:
    * 1. Default — active session with tasks and events
    * 2. Empty — new session with no activity
    * 3. WithErrors — session with failed tasks
    * 4. Completed — archived session
    *
    * Design ref: docs/design/ux/session/session-detail.md
    * Existing: none (new component)
    */
   ```
5. Define inline types (`MockSession`, `MockTask`, `MockEvent`) and fixture data
6. Use `roleColors` for the session's role badge, `severityColors` for event severity
7. Create the `SessionDetailWireframe` component with sections: header, pipeline, resources, events
8. Set `meta.title = 'Wireframes/SessionDetailView'`
9. Add 4 stories: `Default`, `Empty`, `WithErrors`, `Completed`
10. Type-check: `npx tsc --noEmit --pretty web/storybook/stories/wireframes/SessionDetailView.stories.tsx`
11. `broadcast_result(kind="build", project="web", success=true)`
12. `task_complete` with the file path

---

User: "Add an InShellContext story to the ExoPanel wireframe"

1. Read the existing `web/storybook/stories/wireframes/ExoPanel.stories.tsx`
2. Add a new story at the bottom:
   ```tsx
   export const InShellContext: Story = {
     args: { /* same args as Default */ },
     decorators: [
       (Story) => (
         <div style={{
           display: 'grid',
           gridTemplateColumns: '280px 1fr',
           height: '100vh',
           background: '#161616',
         }}>
           <Story />
           <div style={{ background: '#262626', padding: 16 }}>
             {/* Placeholder main content area */}
           </div>
         </div>
       ),
     ],
   };
   ```
3. This shows the ExoPanel sidebar in context with the shell layout
4. Type-check the file to verify no errors introduced

---

User: "Create a wireframe for the fabric event ticker"

1. Read design doc at `docs/design/ux/fibers/fabric-event-ticker.md`
2. Create `web/storybook/stories/wireframes/FabricEventTicker.stories.tsx`
3. Define inline types for events with severity levels
4. Use `severityColors` with `boxShadow` glow for critical/warning events
5. Layout as horizontal bubble feed with CSS `display: flex; overflow-x: auto`
6. Stories: `Default` (mixed events), `Empty`, `AllCritical`, `Overflow` (20+ events)
7. Type-check and complete the task
