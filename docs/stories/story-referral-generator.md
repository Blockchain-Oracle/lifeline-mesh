# Story — `story-referral-generator`

**Epic:** Epic 6 — Referral note · **Depends on:** `story-referral-schema` · **Est:** 25 min

## Why
Generates the structured referral from the case conversation. Runs on junior first; re-runs on senior if escalation fired (better quality for the hard cases that most need a good handoff).

## BDD acceptance criteria
```
Given packages/agents/src/referral.ts generateReferral(caseState, llm)
Then it issues a json_schema completion (NO tools) and returns a validated ReferralNote

Given escalation fired for the case
Then generation is routed to the senior model via the mesh (delegated llm), tagged in the audit log

Given the generated note
Then every Assessment claim that derives from a KB chunk carries its citationId

Given a malformed model output
Then the grammar constraint prevents it; on validation failure the generator retries once then surfaces a typed error

Given tests with fakes
Then ≥5 assertions: schema-valid output, no-tools invariant, senior routing on escalation, citation propagation, retry-on-invalid
```

## File modification map
- `packages/agents/src/referral.ts` — NEW.
- `packages/agents/src/prompts/referral.ts` — NEW.
- `packages/agents/src/referral.test.ts` — NEW — ≥5 assertions.

## Shell verification
```bash
pnpm --filter @lifeline/agents test referral   # ≥5 pass
```
