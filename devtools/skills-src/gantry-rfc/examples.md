### Create an RFC

```bash
# Creates docs/federation-auth/README.md and docs/federation-auth/status.json
bin/gantry rfc create federation-auth
```

### Edit the RFC

Edit `docs/federation-auth/README.md` with:

```markdown
# RFC: Federation Authentication

## Problem
Hub-to-factory authentication uses a shared secret, which doesn't scale.

## Proposal
Add JWT-based human authentication alongside ECDSA machine auth...

## Tradeoffs
- Pro: Standard OIDC integration
- Con: Requires key management infrastructure

## Alternatives
1. mTLS — too complex for initial deployment
2. API keys — no identity attribution

## Open Questions
- Should we support multiple OIDC providers?
```

### Broadcast for Review

```bash
# Increments review round, notifies all watching sessions
bin/gantry rfc review federation-auth
```

### Watch for RFC Feedback

```bash
bin/gantry watch "agf.z-local.dev-0.gantry.rfc.*"
```
