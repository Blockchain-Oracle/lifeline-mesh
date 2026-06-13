# Story — `story-section-chunker`

**Epic:** Epic 3 — KB ingest · **Depends on:** `story-pdf-text-ingest` · **Est:** 40 min

## Why
Citations are only as good as the chunks. A section-aware chunker that preserves protocol-table semantics and attaches `{source, section, page}` metadata is what makes "WHO IMCI p.23 §Cough" possible.

## BDD acceptance criteria
```
Given packages/rag/src/ingest/chunker.ts chunk(text, meta)
When given IMCI text with section headers and a page map
Then it emits chunks each carrying { id, content, source_id, source_title, section, page, type }

Given a protocol table block
Then the table is kept within a single chunk (not split mid-row)

Given a chunk
Then content length is within [MIN_CHARS, MAX_CHARS] except indivisible tables

Given two runs on the same input
Then chunk ids and boundaries are identical (deterministic) 

Given `pnpm test`
Then ≥6 assertions: metadata present, table integrity, deterministic ids, size bounds, type tagging
```

## File modification map
- `packages/rag/src/ingest/chunker.ts` — NEW — section-aware chunker.
- `packages/rag/src/ingest/manifest.ts` — NEW — chunk + KB manifest types (zod).
- `packages/rag/src/ingest/chunker.test.ts` — NEW — ≥6 assertions over a fixture.
- `packages/rag/{package.json,tsconfig.json}` — NEW.

## Shell verification
```bash
pnpm --filter @lifeline/rag test chunker   # ≥6 pass
```
