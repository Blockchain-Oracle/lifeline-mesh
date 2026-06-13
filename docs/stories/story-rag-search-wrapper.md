# Story — `story-rag-search-wrapper`

**Epic:** Epic 4 — RAG runtime + citations · **Depends on:** `story-embed-kb-script` · **Est:** 25 min

## Why
Runtime retrieval on the Pi: embed the query, vector-search the shipped DB, return typed hits WITH metadata. Implements `RagPort.search`.

## BDD acceptance criteria
```
Given packages/rag/src/search.ts search(query, topK)
When called against kb/workspace.sqlite
Then it returns Hit[] = { id, content, score, source_id, section, page, type } sorted by score desc

Given RAG.TOP_K and RAG.MIN_SIMILARITY
Then results below MIN_SIMILARITY are dropped and at most TOP_K returned

Given the demo query (fast breathing, RR 52)
Then the pneumonia-classification chunk is in the returned hits

Given tests with a seeded in-memory DB (or FakeRagPort)
Then ≥5 assertions: ordering, top-k cap, threshold filter, metadata present, demo hit
```

## File modification map
- `packages/rag/src/search.ts` — NEW — `RagPort.search` impl over `vector_quantize_scan`.
- `packages/rag/src/search.test.ts` — NEW — ≥5 assertions.

## Shell verification
```bash
pnpm --filter @lifeline/rag test search   # ≥5 pass
```
