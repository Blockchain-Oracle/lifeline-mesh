# Story — `story-walkthrough-agent`

**Epic:** Epic 5 — Agents + tools · **Depends on:** `story-triage-agent` · **Est:** 40 min

## Why
The heart of the UX: steps the CHW through the matched IMCI protocol one question at a time, each grounded in a cited chunk, until a classification + treatment is reached.

## BDD acceptance criteria
```
Given packages/agents/src/walkthrough.ts runWalkthrough(triageState, llm, rag, tools)
Then it emits a stream of ProtocolStep events { question, options, citation } one at a time
And consumes the CHW answer between steps

Given the protocol completes
Then it returns a Classification with treatment + danger-sign flags + citations

Given reasoning_budget is set to 0 on the junior model (latency)
Then the call passes it through the LlmPort options

Given tool-call adherence is poor (simulated)
Then the agent supports a json_schema routing fallback path (ADR-013) selectable by config

Given tests with fakes
Then ≥7 assertions: one-step-at-a-time emission, citation per step, terminal classification, danger-sign surfaced, fallback path invoked when configured
```

## File modification map
- `packages/agents/src/walkthrough.ts` — NEW — step loop + fallback routing.
- `packages/agents/src/prompts/walkthrough.ts` — NEW.
- `packages/agents/src/walkthrough.test.ts` — NEW — ≥7 assertions.

## Shell verification
```bash
pnpm --filter @lifeline/agents test walkthrough   # ≥7 pass
```

## Risk
1.7B tool adherence — fallback to `LLAMA_TOOL_CALLING_1B_INST_Q4_K` or json_schema routing if eval <80% (ADR-013).
