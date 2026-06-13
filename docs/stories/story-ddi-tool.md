# Story — `story-ddi-tool`

**Epic:** Epic 5 — Agents + tools · **Depends on:** `story-tool-schemas`, `story-citation-resolver` · **Est:** 30 min

## Why
The drug-interaction tool is a pure deterministic lookup over openFDA labels + WHO Model Formulary chunks — defensible (no LLM guessing about drug safety) and citation-backed.

## BDD acceptance criteria
```
Given packages/tools/src/ddi.ts checkInteraction(drugA, drugB)
Then it returns { severity: "none"|"moderate"|"severe", note, citation } from indexed openFDA/WHO-MF data

Given a known interacting pair (from the indexed set)
Then severity is non-"none" and a citation resolves to the source label/section

Given an unknown drug
Then it returns severity "none" with a "not found in formulary" note (never fabricates)

Given the function
Then it makes ZERO network calls (offline; data pre-indexed at build time)

Given tests
Then ≥6 assertions: known interaction, no-interaction, unknown drug, citation present, offline (no fetch), symmetry checkInteraction(a,b)==checkInteraction(b,a)
```

## File modification map
- `packages/tools/src/ddi.ts` — NEW — pure lookup + index loader.
- `scripts/ingest.mjs` — UPDATE — build the DDI index from openFDA bulk JSON into `kb/chunks/ddi.ndjson`.
- `packages/tools/src/ddi.test.ts` — NEW — ≥6 assertions.

## Shell verification
```bash
pnpm --filter @lifeline/tools test ddi   # ≥6 pass
```

## Safety
Lookup + citation only; "not found" is explicit, never a guess.
