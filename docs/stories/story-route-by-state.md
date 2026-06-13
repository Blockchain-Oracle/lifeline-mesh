# Story — `story-route-by-state`

**Epic:** Epic 7 — Mesh + delegation + escalation · **Depends on:** `story-escalation-policy` · **Est:** 20 min

## Why
Ties escalation + mesh together: given a case state and live mesh state, decide which model runs the next step (junior local, or senior delegated), with graceful fallback.

## BDD acceptance criteria
```
Given packages/mesh/src/route.ts pickModel(caseState, meshState)
When escalation policy says escalate AND mesh is reachable
Then it returns the senior delegated handle

When escalation says escalate but mesh is unreachable
Then it returns the local junior with a flag escalatedButLocal=true (surfaced to UI)

When escalation says no
Then it returns the local junior

Given the demo flow
Then a danger-sign case with a reachable senior routes to senior and the decision reason is recorded

Given tests with fakes
Then ≥6 assertions: escalate+reachable→senior, escalate+unreachable→local flagged, no-escalate→local, reason recorded, deterministic
```

## File modification map
- `packages/mesh/src/route.ts` — NEW.
- `packages/mesh/src/route.test.ts` — NEW — ≥6 assertions.

## Shell verification
```bash
pnpm --filter @lifeline/mesh test route   # ≥6 pass
```
