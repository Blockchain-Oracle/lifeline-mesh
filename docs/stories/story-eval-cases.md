# Story — `story-eval-cases`

**Epic:** Epic 3 — KB ingest · **Depends on:** `story-imci-curated-subset` · **Est:** 30 min

## Why
The 20-case synthetic IMCI eval set is the backbone of: the tool-reliability gate (≥80%), the RAG-on-vs-off accuracy claim, and the bench numbers in the submission. All synthetic (demo-safety).

## BDD acceptance criteria
```
Given scripts/bench/eval-cases.json
Then it has ≥20 cases, each { id, utterance, age, sex, expectedClassification, expectedDangerSigns[], expectedCitationDoc }

Given every case
Then expectedClassification is one of the IMCI classifications present in kb/chunks/imci.ndjson

Given the set
Then it includes: ≥3 danger-sign/escalation cases, ≥3 ambiguous cases, ≥10 clear single-path cases

Given a validation test
Then it asserts schema validity and that every expectedCitationDoc exists in the KB manifest
```

## File modification map
- `scripts/bench/eval-cases.json` — NEW — 20 synthetic cases.
- `scripts/bench/eval-cases.schema.json` — NEW.
- `packages/rag/src/eval-cases.test.ts` — NEW — schema + KB-consistency assertions.

## Shell verification
```bash
node -e "const c=require('./scripts/bench/eval-cases.json'); if(c.length<20)process.exit(1)"
pnpm --filter @lifeline/rag test eval-cases
```

## Safety
Synthetic only; opening disclaimer in the video. No real PHI.
