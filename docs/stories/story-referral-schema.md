# Story — `story-referral-schema`

**Epic:** Epic 6 — Referral note · **Depends on:** `story-walkthrough-agent` · **Est:** 15 min

## Why
The referral note is generated via a grammar-constrained `json_schema` call. The schema IS the contract — SBAR-structured with citation fields.

## BDD acceptance criteria
```
Given packages/agents/src/referral-schema.ts
Then it exports a zod ReferralNote schema with Situation, Background, Assessment, Recommendation, plus patient { ageMonths, sex }, dangerSigns[], citations[]

Given each clinical claim field
Then it carries an optional citationId referencing a KB chunk

Given the schema converted to JSON Schema for responseFormat
Then it is valid llama.cpp-compatible json_schema (no unsupported constructs)

Given tests
Then ≥4 assertions: required sections present, citation fields, valid/invalid parse, json_schema conversion well-formed
```

## File modification map
- `packages/agents/src/referral-schema.ts` — NEW — zod + `toJsonSchema()`.
- `packages/agents/src/referral-schema.test.ts` — NEW — ≥4 assertions.

## Shell verification
```bash
pnpm --filter @lifeline/agents test referral-schema   # ≥4 pass
```
