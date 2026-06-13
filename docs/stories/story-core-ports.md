# Story — `story-core-ports`

**Epic:** Epic 2 — Inference adapter + audit log · **Depends on:** `story-monorepo-bootstrap` · **Est:** 30 min

## Why
The ports-and-adapters seam. Defining the interfaces first means every downstream package (agents, rag, mesh, voice, UI server) codes against these types and tests against fakes — the real `@qvac/sdk` is touched only by the adapter (`story-inference-adapter`).

## BDD acceptance criteria
```
Given packages/core/src/ports.ts
Then it exports interfaces LlmPort, SttPort, TtsPort, EmbedPort, RagPort, MeshPort
And each method returns a typed result (no `any`)

Given LlmPort.complete
Then its signature accepts { history, tools?, responseFormat?, modelRef } and returns an async iterable of tokens plus a promise of { toolCalls, text, stats }

Given the domain types
Then ChatTurn, ToolDef, ToolCallResult, Citation, TriageState, Classification, CompletionStats are exported from types.ts and validated by zod schemas where they cross a boundary

Given `pnpm --filter @lifeline/core typecheck`
Then it exits 0 with no `any`
```

## File modification map
- `packages/core/src/ports.ts` — NEW — the six port interfaces (pure types, no impl).
- `packages/core/src/types.ts` — NEW — shared domain types + zod schemas (`ChatTurn`, `ToolDef`, `Citation`, `TriageState`, `Classification`, `EscalationDecision`).
- `packages/core/src/index.ts` — UPDATE — re-export ports + types.

## Shell verification
```bash
pnpm --filter @lifeline/core typecheck   # exit 0
grep -q "no-explicit-any" <(pnpm lint 2>&1) && echo "ok or clean"
```

## Non-goals
- No implementation here — interfaces and types only.
