# Story — `story-escalation-policy`

**Epic:** Epic 7 — Mesh + delegation + escalation
**Depends on:** `story-self-assessment-probe`, `story-delegate-helper`
**Estimated coding time:** 40 min

## Why
The mesh moment in the demo IS this function deciding to escalate, and the judges' "production-grade" bar specifically demands the decision is defensible. The escalation policy is deterministic on purpose (medicine prefers rules over vibes); the LLM informs the policy but the policy decides. ADR-008.

## BDD acceptance criteria

```
Given a TriageState with `dangerSigns = ["chest_indrawing"]`
When `evaluate(state)` is called
Then it returns `{ escalate: true, reason: "danger-sign:chest_indrawing", layer: "deterministic" }`

Given a TriageState with no danger signs and a self-assessment `{ confidence: 0.85 }`
When `evaluate(state)` is called
Then it returns `{ escalate: false }`

Given a TriageState with no danger signs and a self-assessment `{ confidence: 0.55 }`
And ESCALATE.CONFIDENCE_THRESHOLD = 0.7
When `evaluate(state)` is called
Then it returns `{ escalate: true, reason: "confidence:0.55<0.7", layer: "self-assessment" }`

Given a TriageState whose walkthrough has produced 7 turns
And ESCALATE.MAX_TURNS_BEFORE_ESCALATE = 6
When `evaluate(state)` is called
Then it returns `{ escalate: true, reason: "turns:7>6", layer: "mechanical" }`

Given a TriageState with a tool-call error count of 3 in the last 5 turns
When `evaluate(state)` is called
Then it returns `{ escalate: true, reason: "toolErrors:3", layer: "mechanical" }`

Given a TriageState with no danger signs, confidence 0.95, 4 turns, and zero tool errors
When `evaluate(state)` is called
Then it returns `{ escalate: false }`

Given multiple trigger layers fire simultaneously (danger sign AND low confidence)
When `evaluate(state)` is called
Then the returned `reason` prefers `"deterministic"` over `"self-assessment"` over `"mechanical"`
And `escalate` is true

Given a state with `stopReason: "length"` from the walkthrough completion
When `evaluate(state)` is called
Then it returns `{ escalate: true, reason: "stopReason:length", layer: "mechanical" }`

Given the escalation policy module
When the file is measured with `grep -cvE '^\s*(//|$)' packages/mesh/src/escalate.ts`
Then the count is ≤ 200 (well under the 400 cap, hard ceiling for this story)

Given `pnpm test packages/mesh` runs
Then ≥ 12 behavioural test cases pass (one per BDD bullet above, plus boundary cases)
And coverage on `packages/mesh/src/escalate.ts` is 100% statements
```

## File modification map
- `packages/mesh/src/escalate.ts` — NEW — exports `evaluate(state: TriageState): EscalationDecision`.
- `packages/mesh/src/types.ts` — UPDATE — `EscalationDecision`, `EscalationReason`, `EscalationLayer` types.
- `packages/mesh/src/escalate.test.ts` — NEW — vitest suite with the 12+ behavioural cases.
- `packages/core/src/constants.ts` — UPDATE — `ESCALATE.CONFIDENCE_THRESHOLD`, `ESCALATE.MAX_TURNS_BEFORE_ESCALATE`, `ESCALATE.TOOL_ERROR_WINDOW`, `ESCALATE.TOOL_ERROR_THRESHOLD` confirmed present.
- `packages/mesh/package.json` — UPDATE — wires `vitest` script + workspace deps on `@lifeline/core`.

## Shell verification
```bash
pnpm --filter @lifeline/mesh test --coverage
# expect: ≥ 12 passed, statements 100% on packages/mesh/src/escalate.ts
test "$(grep -cvE '^\s*(//|$)' packages/mesh/src/escalate.ts)" -le 200 && echo "size OK"
```

## Non-goals
- This story does NOT call the LLM. It only consumes already-recorded state (set by `story-self-assessment-probe` and the walkthrough agent).
- This story does NOT route to a specific model — that's `story-route-by-state`. The decision object is enough.

## Risks
- Boundary handling of `confidence` exactly equal to threshold (use `<` not `<=` to avoid edge-case flap; covered by a dedicated test).
- Tool-error window definition (rolling vs absolute) — locked here as **last 5 turns**, configurable via constants.
