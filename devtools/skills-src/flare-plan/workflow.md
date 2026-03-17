## Why Not Just Decompose and Execute?

Step-wise greedy planning fails at long horizons because:

1. **Early myopic commitment** — the first action looks locally good but forecloses better global trajectories
2. **Error irreversibility** — once a wrong step is taken, recovery rate drops below 6%
3. **Long-horizon collapse** — accuracy degrades rapidly as the number of steps increases

The three minimal requirements for coherent long-horizon planning are:
- **Explicit lookahead** — simulate forward trajectories before committing
- **Backward value propagation** — let trajectory-level outcomes revise earlier action quality estimates
- **Limited commitment** — commit only to the next action, then replan from the new state

## Planning Procedure

### Phase 1: Frame the Goal

1. State the **terminal condition** — what does "done" look like? Be specific and verifiable.
2. Identify the **planning horizon** — how many major actions/phases are involved? If fewer than 4, this skill is unnecessary; use simple task decomposition instead.
3. List **hard constraints** — deadlines, dependencies, resource limits, blocked-by relationships, ordering requirements.
4. Identify the **evaluation signal** — how will you judge whether a trajectory is succeeding? This can be imprecise but must be assessable at planning time. Examples: milestone completion count, charter alignment coverage, dependency chain depth, risk exposure score.

### Phase 2: Generate Candidate Trajectories (Lookahead)

Generate **3-5 distinct candidate trajectories** — different orderings, groupings, or strategies for reaching the terminal condition. Each trajectory is a complete sequence from current state to terminal condition.

For each trajectory:
- List the ordered sequence of major actions (not individual tasks — action groups or phases)
- Note key decision points where the trajectory diverges from alternatives
- Identify the **commitment cost** of each early action — what options does it foreclose?
- Flag **reversibility** — which actions are reversible if the trajectory proves wrong?

Do NOT pick a trajectory yet.

Rules for trajectory generation:
- At least one trajectory should work **backward** from the terminal condition (what must be true just before done? what must be true before that?)
- At least one trajectory should be the **obvious greedy** sequence (the first plan you'd generate without this skill) — it serves as a baseline
- Trajectories must be genuinely different, not cosmetic variations

### Phase 3: Evaluate Trajectories (Backward Propagation)

For each candidate trajectory, evaluate **trajectory-level quality** by mentally simulating it to completion:

1. Walk through the full trajectory step by step. At each step, ask:
   - What is the state after this action completes?
   - What information do I have now that I didn't before?
   - What risks have materialized or been eliminated?
   - Are downstream steps still viable given the current state?

2. Score each trajectory on the evaluation signal identified in Phase 1. The score reflects the **complete trajectory outcome**, not individual step quality.

3. **Backward propagation**: For each trajectory, identify which early actions contributed most to the final outcome (positive or negative). Specifically:
   - Which early action created the most value for downstream steps?
   - Which early action created the most risk or constraint for downstream steps?
   - If you could change one early action, which would improve the trajectory most?

4. Write a **comparison matrix** — a table with trajectories as rows and evaluation criteria as columns. Include: estimated total effort, dependency chain depth, reversibility of first 2 actions, risk exposure, and the evaluation signal score.

### Phase 4: Select and Commit (Limited Commitment)

1. Select the trajectory with the best evaluation signal score.
2. **Commit ONLY to the first action** of the selected trajectory. Write it as a concrete, actionable next step with clear completion criteria.
3. Record the selected trajectory and alternatives as context for future replanning. The non-selected trajectories are NOT discarded — they inform replanning when the state changes.
4. Document **replan triggers** — specific conditions that should cause replanning from scratch:
   - A blocked dependency is resolved or a new one appears
   - A hard constraint changes (deadline moved, resource added/removed)
   - The committed action produces an unexpected state
   - 2+ steps complete and the evaluation signal score differs from projection by more than 20%

### Phase 5: Write the Plan Document

Write the plan to the appropriate location (see Output Format below). The plan document is the primary artifact of this skill.

## Output Format

Write the plan as a markdown document. Location depends on context:

- **Project plans**: `docs/dev/<plan-name>.md`
- **Workflow plans**: As an artifact via `artifact_write` attached to the workflow
- **Session plans**: In the conversation context (no file needed for short-lived plans)

### Plan Document Structure

```markdown
# Plan: <Title>

**Goal**: <Terminal condition — what does done look like>
**Horizon**: <N major actions/phases>
**Evaluation signal**: <How trajectory quality is measured>
**Status**: ACTIVE | REPLANNED | COMPLETED | ABANDONED

## Hard Constraints
- <constraint 1>
- <constraint 2>

## Candidate Trajectories

### T1: <Name> (SELECTED | rejected)
1. Action A — <description> [reversible|irreversible]
2. Action B — <description> [reversible|irreversible]
...
**Score**: <evaluation signal score>
**Key risk**: <primary risk>

### T2: <Name> (SELECTED | rejected)
...

### T3: <Name> (SELECTED | rejected)
...

## Comparison Matrix

| Criterion | T1 | T2 | T3 |
|-----------|----|----|-----|
| Effort | ... | ... | ... |
| Dep chain depth | ... | ... | ... |
| First-action reversibility | ... | ... | ... |
| Risk exposure | ... | ... | ... |
| Eval signal score | ... | ... | ... |

## Committed Next Action

**Action**: <The single next action to take>
**Completion criteria**: <How to know it's done>
**Expected state after**: <What the world looks like when this action completes>

## Replan Triggers
- <trigger 1>
- <trigger 2>

## Replan Log
| Date | Trigger | Old trajectory | New trajectory | Reason |
|------|---------|---------------|----------------|--------|
```

## Replanning

When a replan trigger fires:

1. Update the state description — what has changed since the last plan?
2. Re-evaluate remaining trajectories from the NEW current state (not from the original state)
3. Generate replacement trajectories if the old ones are no longer viable
4. Re-score and re-select
5. Commit to the new next action
6. Append an entry to the Replan Log

Replanning is NOT failure — it is the expected behavior. A plan that never replans over a long horizon is likely not being monitored.
