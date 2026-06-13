# Story — `story-self-assessment-probe`

**Epic:** Epic 5 — Agents + tools · **Depends on:** `story-walkthrough-agent` · **Est:** 20 min

## Why
No logprobs in the SDK, so confidence comes from a grammar-constrained self-assessment call (`responseFormat: json_schema`) — reliable even on 1.7B. Feeds the escalation policy.

## BDD acceptance criteria
```
Given packages/agents/src/self-assessment.ts assess(caseState, llm)
Then it issues a json_schema completion returning { confidence: 0..1, uncertainFactors: string[], escalate: boolean }

Given json_schema and tools are mutually exclusive (validated SDK constraint)
Then this call passes NO tools

Given a confident case (scripted)
Then confidence is high and escalate=false

Given the result
Then it is written into TriageState for the escalation policy to read

Given tests with fakes
Then ≥4 assertions: schema-constrained shape, no-tools invariant, value range, written to state
```

## File modification map
- `packages/agents/src/self-assessment.ts` — NEW.
- `packages/agents/src/prompts/self-assessment.ts` — NEW.
- `packages/agents/src/self-assessment.test.ts` — NEW — ≥4 assertions.

## Shell verification
```bash
pnpm --filter @lifeline/agents test self-assessment   # ≥4 pass
```
