# Story — `story-audit-writer`

**Epic:** Epic 2 — Inference adapter + audit log · **Depends on:** `story-logger-factory`, `story-constants-and-env` · **Est:** 30 min

## Why
The submission MANDATES a structured inference log (model loads/unloads, prompt, tokens, TTFT, tok/s). This writer is the single sink; because every SDK call flows through the adapter, the log is complete by construction.

## BDD acceptance criteria
```
Given packages/core/src/audit.ts AuditWriter
When .record(entry) is called
Then a single NDJSON line is appended to submission/audit-log.ndjson matching audit-log.schema.json

Given an entry for a delegated completion
Then fields node="senior-delegated", delegated=true, providerPublicKeyPrefix are present

Given an entry missing ttftMs (SDK omitted stats)
Then the schema still validates (ttftMs nullable) and a `ttftSource: "measured"|"sdk"` field records provenance

Given submission/audit-log.schema.json
When validated against 3 sample entries (load, local completion, delegated completion)
Then all pass

Given `pnpm test`
Then ≥6 assertions: line-per-record, schema-valid, required fields, delegated fields, nullable ttft, monotonic ts within a session
```

## File modification map
- `packages/core/src/audit.ts` — NEW — `AuditWriter` (append NDJSON), `AuditEntry` zod schema, helper `toAggregate()`.
- `submission/audit-log.schema.json` — NEW — JSON Schema for one entry.
- `packages/core/src/audit.test.ts` — NEW — ≥6 assertions using a temp file sink.

## Shell verification
```bash
pnpm --filter @lifeline/core test audit   # ≥6 pass
```

## Fields (locked)
`ts, op, modelRef, requestId, node, promptTokens, generatedTokens, cacheTokens, ttftMs, totalMs, tps, backendDevice, stopReason, toolCallsCount, delegated, providerPublicKeyPrefix, sessionId, caseId, ttftSource`.
