# Story — `story-delegate-helper`

**Epic:** Epic 7 — Mesh + delegation + escalation · **Depends on:** `story-mesh-heartbeat` · **Est:** 25 min

## Why
Wraps delegated `loadModel`/`completion` so the senior 4B is usable transparently with `fallbackToLocal`, generous cold-DHT timeout, and audit tagging — the "remote brain" half of the mesh.

## BDD acceptance criteria
```
Given packages/mesh/src/delegate.ts loadSenior(providerPublicKey)
Then it calls the adapter's loadModel with delegate { providerPublicKey, timeout: TIMEOUTS_MS.DELEGATION_FIRST, fallbackToLocal: true } and returns a delegated model handle

Given a delegated completion
Then audit entries are tagged node="senior-delegated", delegated=true, providerPublicKeyPrefix set

Given the provider is unreachable and fallbackToLocal is true
Then completion still succeeds via the local model and audit records the fallback

Given the first call on a cold DHT
Then the timeout is ≥60s; warm calls use DELEGATION_WARM

Given tests with fakes
Then ≥5 assertions: delegate options correct, audit tagging, fallback path, timeout selection, handle reuse
```

## File modification map
- `packages/mesh/src/delegate.ts` — NEW.
- `packages/mesh/src/delegate.test.ts` — NEW — ≥5 assertions.

## Shell verification
```bash
pnpm --filter @lifeline/mesh test delegate   # ≥5 pass
```
