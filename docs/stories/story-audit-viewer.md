# Story — `story-audit-viewer`

**Epic:** Epic 9 — Web UI · **Depends on:** `story-case-console-shell` · **Est:** 25 min
**Design note:** behavior/contract only; visual treatment of the dashboard is the designer's.

## Why
The `/audit` "receipts" view — the judging artifact made visible: live telemetry of every inference, which device ran it, TTFT/tok-s.

## BDD acceptance criteria
```
Given /audit streaming audit entries over WS (or polling /audit/recent)
Then a table renders rows: ts, op, node, model, prompt/gen tokens, TTFT ms, tok/s, delegated

Given three KPI tiles
Then they show TTFT p50/p95 (junior vs senior), tok/s (junior vs senior), and delegation count + success ratio, updating live

Given an "Export submission JSON" action
Then it triggers server aggregation and downloads audit-log.json

Given tests (mocked stream)
Then ≥5 assertions: rows render from entries, KPI math correct (p50/p95/ratio), delegated rows flagged, export action wired
```

## File modification map
- `apps/web/src/routes/Audit.tsx` — UPDATE.
- `apps/web/src/components/{AuditRow,AuditKpiTile}.tsx` — NEW.
- `apps/web/src/lib/audit-kpis.ts` — NEW — pure p50/p95/ratio helpers (unit-tested).
- `apps/web/src/lib/audit-kpis.test.ts` — NEW — ≥5 assertions.

## Shell verification
```bash
pnpm --filter web test audit-kpis Audit   # ≥5 pass
```
