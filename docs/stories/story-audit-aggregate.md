# Story — `story-audit-aggregate`

**Epic:** Epic 11 — Submission artefacts · **Depends on:** `story-bench-pi5`, `story-bench-laptop` · **Est:** 15 min

## Why
Rolls the raw NDJSON audit log into the single structured `audit-log.json` the submission requires.

## BDD acceptance criteria
```
Given scripts/audit/aggregate.mjs over submission/audit-log.ndjson
Then it writes submission/audit-log.json: { session, entries[], summary { totalInferences, modelLoads, delegations, ttftP50, tps } }

Given every entry
Then it has prompt, tokens, TTFT, tok/s (or measured fallback) — satisfying the mandated fields

Given the file
Then it validates against audit-log.schema.json

Given tests
Then ≥4 assertions: aggregation math, schema validity, delegated count, required fields per entry
```

## File modification map
- `scripts/audit/aggregate.mjs` — NEW.
- `packages/core/src/audit-aggregate.test.ts` — NEW — ≥4 assertions over a fixture NDJSON.

## Shell verification
```bash
pnpm --filter @lifeline/core test audit-aggregate   # ≥4 pass
```
