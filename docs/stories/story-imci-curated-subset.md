# Story — `story-imci-curated-subset`

**Epic:** Epic 3 — KB ingest · **Depends on:** `story-section-chunker` · **Est:** 45 min (manual curation)

## Why
A small excellent KB beats a large noisy one for a 5-minute demo. Hand-curate the 15 highest-value IMCI sections so the demo case (sick child, fever, fast breathing) is rock-solid and every answer cites a real page.

## BDD acceptance criteria
```
Given kb/chunks/imci.ndjson
Then it contains the curated sections: general danger signs, cough/difficult breathing, diarrhoea/dehydration, fever/malaria, ear problems, malnutrition/anaemia, immunization, and key dosing tables

Given each chunk
Then metadata.page resolves to a real page in the WHO IMCI chart booklet (spot-checked)

Given the demo scenario (2yo, fever 3d, fast breathing, RR 52)
Then retrieval over this KB returns the "fast breathing → pneumonia" classification chunk in top-3

Given `pnpm test`
Then a fixture test asserts ≥15 chunks and that the demo query hits the expected chunk id
```

## File modification map
- `kb/chunks/imci.ndjson` — NEW — curated chunks (committed).
- `packages/rag/src/ingest/curate-imci.test.ts` — NEW — asserts coverage + demo hit (uses FakeEmbedPort or a stored ranking).

## Shell verification
```bash
wc -l kb/chunks/imci.ndjson   # >= 15
pnpm --filter @lifeline/rag test curate   # demo hit asserted
```

## Safety
All content is verbatim/paraphrased WHO protocol with page citations — protocol walkthrough, not invented medical advice.
