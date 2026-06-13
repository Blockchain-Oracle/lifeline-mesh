# Story — `story-inference-adapter`

**Epic:** Epic 2 — Inference adapter + audit log · **Depends on:** `story-audit-writer` · **Est:** 45 min

## Why
The ONLY file allowed to import `@qvac/sdk`. Implements the ports against the real SDK, captures `completionStats` into the audit log on every call, and computes a consumer-side TTFT fallback when the SDK omits stats (confirmed: all `CompletionStats` fields are optional, esp. on delegated calls).

## BDD acceptance criteria
```
Given packages/core/src/inference.ts
Then it implements LlmPort/SttPort/TtsPort/EmbedPort/RagPort/MeshPort against @qvac/sdk
And it is the only file matching `import .* from "@qvac/sdk"` (verified by grep)

Given a completion call
When it streams tokens
Then it yields tokens, resolves toolCalls (Zod-validated via the SDK toolCallStream), and writes ONE audit entry with TTFT/tok-s from await result.stats

Given result.stats resolves with timeToFirstToken undefined
Then the adapter computes ttftMs from (firstTokenTimestamp - callStart) and sets ttftSource="measured"

Given a delegated completion (delegate option present)
Then the audit entry has node="senior-delegated" and delegated=true

Given the tool loop
Then it follows the verified shape: load with modelConfig.tools=true → completion({history,tools,stream}) → consume tokenStream+toolCallStream → await result.toolCalls → caller pushes {role:"assistant"} + {role:"tool"} → re-call

Given tests with @qvac/sdk import-mocked
Then ≥8 assertions cover: token streaming, toolCall surfacing, audit entry written per call, TTFT fallback path, delegated tagging, unload recorded
```

## File modification map
- `packages/core/src/inference.ts` — NEW — adapter; wraps `loadModel/completion/unloadModel/transcribe/textToSpeech/embed/heartbeat/startQVACProvider`; bridges SDK `getLogger`/`loggingStream` into our app logger; writes audit entries.
- `packages/core/src/inference.test.ts` — NEW — vitest with `vi.mock("@qvac/sdk")`, ≥8 assertions.
- `packages/core/package.json` — UPDATE — add `@qvac/sdk@0.12.2` (exact pin).

## Shell verification
```bash
test "$(grep -rl 'from \"@qvac/sdk\"' packages apps | grep -v 'inference')" = "" && echo "seam OK"
pnpm --filter @lifeline/core test inference   # ≥8 pass
```

## Risks
- SDK stream object shape: `result.{tokenStream,toolCallStream,toolCalls,text,stats}` (verified against shipped example). If a method differs on real hardware, fix here only — nothing else imports the SDK.
