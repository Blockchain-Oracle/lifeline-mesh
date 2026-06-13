# Story — `story-escalation-banner`

**Epic:** Epic 9 — Web UI · **Depends on:** `story-case-console-shell` · **Est:** 20 min
**Design note:** behavior/contract only. The dramatization of the mesh moment is the designer's signature decision (see DESIGN_BRIEF §9).

## BDD acceptance criteria
```
Given EscalationBanner props { peerName, elapsedMs, thinking? }
When an escalation frame arrives
Then the banner appears and shows an elapsing timer

Given the senior answer arrives with a thinking trace
Then the trace is available (e.g. expandable) without blocking the verdict

Given escalation resolves
Then the banner transitions to a resolved state and both answers can be compared

Given tests
Then ≥4 assertions: appears on escalation, timer updates, thinking trace accessible, resolved state
```

## File modification map
- `apps/web/src/components/EscalationBanner.tsx` — NEW.
- `apps/web/src/components/EscalationBanner.test.tsx` — NEW — ≥4 assertions.

## Shell verification
```bash
pnpm --filter web test EscalationBanner   # ≥4 pass
```
