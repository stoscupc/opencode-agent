### Create a new RFC

```bash
cd devtools && bin/gantry rfc create <feature-name>
```

Creates `docs/<feature-name>/README.md` (template) and `docs/<feature-name>/status.json`.

### Broadcast RFC for review

```bash
cd devtools && bin/gantry rfc review <feature-name>
```

Increments the review round counter and broadcasts an alert to all watching sessions.

### RFC structure

```
docs/<feature>/
  README.md      # Problem, proposal, tradeoffs, alternatives, open questions
  status.json    # { status, rounds, reviewers }
```

Edit the README.md directly. Use `rfc review` each time a new round of feedback is needed.
