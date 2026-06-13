# Story — `story-senior-provider`

**Epic:** Epic 7 — Mesh + delegation + escalation · **Depends on:** `story-inference-adapter` · **Est:** 30 min

## Why
The laptop "senior brain." Starts the QVAC provider (deterministic key from seed) and PRE-WARMS MedPsy-4B so the demo's first delegated call isn't a multi-GB download (ADR-015 — verified: providers serve models on demand).

## BDD acceptance criteria
```
Given apps/senior-node/src/provider.ts
When started with QVAC_HYPERSWARM_SEED set
Then startQVACProvider returns a deterministic publicKey (same seed → same key)

Given boot
Then MedPsy-4B is pre-loaded (loadModel with tools:true) before the provider accepts requests, so the first delegated completion has no cold download

Given a firewall arg (allowed consumer key)
Then the provider restricts to that consumer

Given a delegated completion request
Then it serves tokens + completionStats and the senior's own audit log records node="senior-local"

Given tests (mesh + adapter mocked)
Then ≥5 assertions: deterministic key, pre-warm before serving, firewall restriction, stats served, SIGINT clean shutdown
```

## File modification map
- `apps/senior-node/src/provider.ts` — NEW — provider lifecycle + pre-warm.
- `apps/senior-node/src/index.ts` — NEW — entry (env, dashboard mount optional).
- `apps/senior-node/src/provider.test.ts` — NEW — ≥5 assertions.
- `apps/senior-node/{package.json,tsconfig.json}` — NEW.

## Shell verification
```bash
pnpm --filter senior-node test provider   # ≥5 pass
```
