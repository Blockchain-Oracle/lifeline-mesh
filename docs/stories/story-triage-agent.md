# Story — `story-triage-agent`

**Epic:** Epic 5 — Agents + tools · **Depends on:** `story-clinical-tools`, `story-citation-resolver` · **Est:** 40 min

## Why
First agent in the case loop: takes the CHW's utterance + age/sex, uses tools to gather structured findings and propose an initial classification. Runs on the junior 1.7B with hermes tools, static mode.

## BDD acceptance criteria
```
Given packages/agents/src/triage.ts runTriage(input, llm, rag, tools)
When given a scripted FakeLlmPort that emits tool calls
Then it executes the tools, threads results back per the verified tool loop, and returns a TriageState { findings, proposedClassification, citations, turns }

Given a danger-sign utterance
Then evaluateDangerSigns is invoked and the danger sign is recorded in TriageState

Given a tool-call that fails validation
Then the failure is counted (feeds escalation mechanical signals) and the loop continues

Given the agent uses the LlmPort only (never imports @qvac/sdk)
Then grep confirms no direct SDK import

Given tests with fakes
Then ≥7 assertions: tool loop executes, findings recorded, danger sign path, citation attached, tool-error counted, deterministic with scripted llm
```

## File modification map
- `packages/agents/src/triage.ts` — NEW.
- `packages/agents/src/prompts/triage.ts` — NEW — prompt template (string only).
- `packages/agents/src/triage.test.ts` — NEW — ≥7 assertions using fakes.
- `packages/agents/{package.json,tsconfig.json}` — NEW.

## Shell verification
```bash
pnpm --filter @lifeline/agents test triage   # ≥7 pass
```
