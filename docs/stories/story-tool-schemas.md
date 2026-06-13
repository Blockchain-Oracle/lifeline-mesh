# Story — `story-tool-schemas`

**Epic:** Epic 5 — Agents + tools · **Depends on:** `story-inference-fakes` · **Est:** 20 min

## Why
Tools are defined once as zod schemas and converted to SDK `Tool` defs (hermes dialect). Single source of truth for tool shapes; agents import from here.

## BDD acceptance criteria
```
Given packages/tools/src/schemas.ts
Then it exports zod schemas + Tool defs for: lookup_protocol, record_vital, compute_breathing_rate, check_danger_signs, triage_classify, drug_interaction, dose_calc

Given each Tool def
Then it has name, description, and parameters derived from the zod schema (no hand-duplicated JSON)

Given an arguments object from a model toolCall
When validated with the matching schema
Then valid args parse and invalid args produce a typed error

Given tests
Then ≥5 assertions: every tool present, schema↔def name parity, valid/invalid parse, no `any`
```

## File modification map
- `packages/tools/src/schemas.ts` — NEW — zod schemas + `toToolDef()` helper.
- `packages/tools/src/schemas.test.ts` — NEW — ≥5 assertions.
- `packages/tools/{package.json,tsconfig.json}` — NEW.

## Shell verification
```bash
pnpm --filter @lifeline/tools test schemas   # ≥5 pass
```
