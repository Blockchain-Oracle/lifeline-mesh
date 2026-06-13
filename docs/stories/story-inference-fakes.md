# Story — `story-inference-fakes`

**Epic:** Epic 2 — Inference adapter + audit log · **Depends on:** `story-inference-adapter` · **Est:** 25 min

## Why
Deterministic in-memory implementations of every port so all downstream tests (agents, mesh, rag, server) run fast, offline, with no native deps. This is what makes the whole codebase testable in CI.

## BDD acceptance criteria
```
Given packages/core/src/inference.fakes.ts
Then it exports FakeLlmPort, FakeSttPort, FakeTtsPort, FakeEmbedPort, FakeRagPort, FakeMeshPort

Given FakeLlmPort configured with a scripted response (tokens + toolCalls)
When complete() is called
Then it yields exactly the scripted tokens and resolves the scripted toolCalls and stats deterministically

Given FakeMeshPort configured offline
Then heartbeat() returns unreachable and delegated completions fall back per caller policy

Given FakeRagPort seeded with chunks
Then search() returns ranked hits WITH metadata (source/section/page)

Given `pnpm test`
Then ≥5 assertions confirm determinism (same input → same output) and scriptability
```

## File modification map
- `packages/core/src/inference.fakes.ts` — NEW — fakes implementing the ports; builder helpers (`fakeLlmReturning(...)`, `fakeMeshOffline()`).
- `packages/core/src/inference.fakes.test.ts` — NEW — ≥5 assertions.

## Shell verification
```bash
pnpm --filter @lifeline/core test fakes   # ≥5 pass
```

## Non-goals
- No `@qvac/sdk` import here — fakes are pure TS.
