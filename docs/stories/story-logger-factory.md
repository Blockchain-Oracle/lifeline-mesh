# Story — `story-logger-factory`

**Epic:** Epic 2 — Inference adapter + audit log · **Depends on:** `story-core-ports` · **Est:** 20 min

## Why
A single namespaced logger so no component uses `console` (banned) and so the audit log can be a dedicated, separate stream from app logs.

## BDD acceptance criteria
```
Given packages/core/src/logger.ts
Then it exports getAppLogger(component: string) returning a pino child with { component } bound
And getAuditLogger() returning a separate pino instance writing NDJSON to the audit sink

Given LOG_LEVEL=debug in env
When getAppLogger("x").debug(...) is called
Then the line is emitted; at LOG_LEVEL=info it is suppressed

Given production mode
Then console transport is off for the audit logger (file/stream only)

Given `pnpm test`
Then a test asserts two getAppLogger calls with different components tag lines differently, and audit logger writes parseable JSON
```

## File modification map
- `packages/core/src/logger.ts` — NEW — pino factories (app + audit), level from env.
- `packages/core/src/logger.test.ts` — NEW — ≥4 assertions (namespacing, level gating, audit JSON validity).
- `packages/core/package.json` — UPDATE — add `pino` dep.

## Shell verification
```bash
pnpm --filter @lifeline/core test logger   # ≥4 pass
```

## Note
The SDK also ships `getLogger`/`loggingStream`; the adapter (`story-inference-adapter`) bridges SDK logs into our pino app logger. This story is our own logger only.
