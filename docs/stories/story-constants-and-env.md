# Story — `story-constants-and-env`

**Epic:** Epic 2 — Inference adapter + audit log · **Depends on:** `story-core-ports` · **Est:** 20 min
**Status note:** `constants.ts` largely DONE in scaffold; this adds env validation + tests.

## Why
The single home for magic values (the `no-magic-numbers` rule depends on it) and a zod-validated boundary for `process.env` (the `no raw process.env` rule depends on it).

## BDD acceptance criteria
```
Given packages/core/src/constants.ts
Then MODELS, CTX, TIMEOUTS_MS, PORTS, ESCALATE, RAG, AUDIO, KB_VERSION, PROVIDER_SEED_ENV, AP are exported as const

Given packages/core/src/env.ts with a zod schema
When QVAC_HYPERSWARM_SEED is absent on the junior node
Then env parsing still succeeds (seed optional on consumer) 

When QVAC_HYPERSWARM_SEED is present but not 64-hex
Then env parsing throws a clear error naming the variable

Given LOG_LEVEL is an invalid value
Then env parsing throws

Given `pnpm test`
Then ≥5 behavioral assertions cover valid/invalid env + constants invariants (EMBED_DIM===768, thresholds in range)
```

## File modification map
- `packages/core/src/env.ts` — NEW — `loadEnv()` zod-validated; no other module reads `process.env`.
- `packages/core/src/constants.ts` — UPDATE (if needed) — confirm all keys present.
- `packages/core/src/env.test.ts` + `constants.test.ts` — NEW/UPDATE — ≥5 assertions.

## Shell verification
```bash
pnpm --filter @lifeline/core test env constants   # ≥5 pass
```
