### When to Use This Skill

- DO use for work spanning 4+ major actions, multiple workstreams, or multiple milestones
- DO use when ordering of work matters and dependencies exist between steps
- DO NOT use for single-step or trivially sequential tasks — use simple TodoWrite decomposition instead
- DO NOT use for tasks where all steps are independent and can be parallelized with no ordering constraints

### Planning Discipline

- NEVER skip trajectory generation. Even when one approach seems obvious, generate alternatives — the "obvious" greedy trajectory is a required baseline, not the default selection.
- NEVER commit to more than one action at a time. The entire value of this skill comes from limited commitment + replanning. Committing to a full sequence up front degrades to greedy planning.
- ALWAYS include at least one backward-chained trajectory (work backward from the goal).
- ALWAYS write the comparison matrix. Qualitative hand-waving about which trajectory is better defeats the purpose.
- ALWAYS document replan triggers. A plan without replan triggers is a waterfall plan and will fail at long horizons.

### Evaluation Signal Quality

- The evaluation signal does NOT need to be precise — noisy estimates are fine because replanning provides robustness
- The evaluation signal MUST be trajectory-level, not step-level — "this step looks good" is not a valid signal; "this complete path reaches the goal with these characteristics" is
- When multiple evaluation criteria exist, make the tradeoff explicit in the comparison matrix rather than collapsing to a single number

### Scope Control

- The plan document is the primary artifact. Do not let plan-writing consume more time than executing the first action.
- For plans with 4-6 actions, spend ~10 minutes on the planning procedure. For 7-12 actions, ~20 minutes. For 12+, consider decomposing into sub-plans with their own planning cycles.
- Trajectories should describe action groups or phases, not individual tasks. Individual task breakdown happens AFTER trajectory selection, when creating tasks for the committed next action only.

### Commit Guidance

- Conventional format: `docs(scope): short description`
- Keep subject line under 72 characters
- Do NOT include `Co-Authored-By` or other branding
