# Story — `story-protocol-step-card`

**Epic:** Epic 9 — Web UI · **Depends on:** `story-case-console-shell` · **Est:** 20 min
**Design note:** behavior/contract only; visual form (card vs full-screen, motion) is the designer's call.

## BDD acceptance criteria
```
Given ProtocolStepCard props { question, options, onAnswer, isWaiting, citation? }
When the user picks an option or submits a number
Then onAnswer fires with the typed answer

Given isWaiting
Then inputs are disabled and a waiting state is exposed (test asserts disabled, not appearance)

Given a citation prop
Then a citation affordance is present and clickable (wiring to the drawer)

Given tests
Then ≥4 assertions: answer callback (option + numeric), disabled while waiting, citation affordance present
```

## File modification map
- `apps/web/src/components/ProtocolStepCard.tsx` — NEW.
- `apps/web/src/components/ProtocolStepCard.test.tsx` — NEW — ≥4 assertions (RTL).

## Shell verification
```bash
pnpm --filter web test ProtocolStepCard   # ≥4 pass
```
