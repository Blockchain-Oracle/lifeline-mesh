# Story — `story-clinical-tools`

**Epic:** Epic 5 — Agents + tools · **Depends on:** `story-tool-schemas` · **Est:** 35 min

## Why
The deterministic clinical helpers the agents call: breathing-rate classification, IMCI danger-sign rubric, triage classification, dosing. Rules over vibes — these are pure functions, fully unit-tested, and feed the escalation policy.

## BDD acceptance criteria
```
Given packages/tools/src/breathing-rate.ts classifyBreathing(rate, ageMonths)
Then it applies IMCI age cutoffs (e.g. ≥50/min under 12mo, ≥40/min 12–59mo) and returns fast/normal with the threshold cited

Given packages/tools/src/danger-signs.ts evaluateDangerSigns(findings)
Then it returns the matched IMCI general-danger-sign list deterministically

Given packages/tools/src/triage-classify.ts
Then it maps findings → an IMCI classification with the citation chunk id

Given packages/tools/src/dosing.ts
Then it computes weight/age-band dosing from WHO-MF chunks, returning a citation; refuses (returns needsReview) when inputs are out of range

Given tests
Then ≥10 assertions across the four tools incl. boundary ages/rates and refusal paths
```

## File modification map
- `packages/tools/src/{breathing-rate,danger-signs,triage-classify,dosing}.ts` — NEW.
- `packages/tools/src/*.test.ts` — NEW — ≥10 assertions total, 100% on these pure modules.

## Shell verification
```bash
pnpm --filter @lifeline/tools test breathing danger triage dosing   # ≥10 pass
```
