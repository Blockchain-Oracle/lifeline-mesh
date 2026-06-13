# Story — `story-mesh-status-pill`

**Epic:** Epic 9 — Web UI · **Depends on:** `story-case-console-shell`, `story-mesh-heartbeat` · **Est:** 15 min
**Design note:** behavior/contract only. Critical UX rule (DESIGN_BRIEF §7): "working alone" is NORMAL, never styled as an error.

## BDD acceptance criteria
```
Given MeshStatusPill props { status: "local"|"linked"|"offline", latencyMs? }
When status is "linked"
Then it shows reachable + latency

When status is "local" (no senior)
Then it shows a calm "working alone" state — asserted as non-error semantics (role/aria, not an alert)

Given heartbeat updates over time
Then the pill reflects the latest state without flicker

Given tests
Then ≥4 assertions: linked shows latency, local is non-error, offline distinct, updates on new heartbeat
```

## File modification map
- `apps/web/src/components/MeshStatusPill.tsx` — NEW.
- `apps/web/src/components/MeshStatusPill.test.tsx` — NEW — ≥4 assertions.

## Shell verification
```bash
pnpm --filter web test MeshStatusPill   # ≥4 pass
```
