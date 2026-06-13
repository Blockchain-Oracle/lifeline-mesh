# Story — `story-citation-resolver`

**Epic:** Epic 4 — RAG runtime + citations · **Depends on:** `story-rag-search-wrapper` · **Est:** 25 min

## Why
The UX promise: every clinical claim resolves to "WHO IMCI Chart Booklet, p. 23, §Cough/Difficult breathing" with the exact quoted passage. This is the Full-Fathom quality bar and a core trust signal.

## BDD acceptance criteria
```
Given packages/rag/src/cite.ts CitationResolver
When given a chunk id (e.g. "c-imci-23")
Then it returns { label: "WHO IMCI Chart Booklet · p.23 · §Cough/Difficult breathing", quote, docId, page, section }

Given an agent answer containing citation tokens [c-imci-23]
When resolve(answer) runs
Then each token expands to a Citation object and the text references stay stable

Given an unknown citation id
Then it returns a typed CitationNotFound error (never a silent blank)

Given tests
Then ≥5 assertions: label format, quote excerpt, token expansion, unknown-id error, multiple-citations ordering
```

## File modification map
- `packages/rag/src/cite.ts` — NEW — resolver + `Citation` type (re-uses core types).
- `packages/rag/src/cite.test.ts` — NEW — ≥5 assertions.

## Shell verification
```bash
pnpm --filter @lifeline/rag test cite   # ≥5 pass
```
