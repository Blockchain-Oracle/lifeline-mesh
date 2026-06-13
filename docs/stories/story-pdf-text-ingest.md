# Story — `story-pdf-text-ingest`

**Epic:** Epic 3 — KB ingest · **Depends on:** `story-monorepo-bootstrap` · **Est:** 30 min

## Why
Turn the source WHO/MSF documents into clean text the chunker can work with. Build-time only (runs on the laptop), output committed for reproducibility.

## BDD acceptance criteria
```
Given scripts/ingest.mjs and a source PDF in kb/source/
When `node scripts/ingest.mjs --source imci` runs
Then it writes kb/source/.text/imci.txt with layout-preserving extraction (pdftotext -layout style)

Given an HTML source (MSF)
Then cheerio extraction strips nav/boilerplate and keeps clinical content

Given a missing source file
Then the script exits non-zero with a clear message naming the expected path

Given the openFDA bulk JSON
Then it is passed through unchanged into the drug-label intermediate
```

## File modification map
- `scripts/ingest.mjs` — NEW — per-source extractors (pdf via `pdf-parse`/pdftotext, html via `cheerio`).
- `packages/rag/src/ingest/pdf.ts` — NEW — reusable PDF→text helper.
- `kb/source/README.md` — NEW — provenance + download URLs for each source (committed; PDFs themselves gitignored).

## Shell verification
```bash
node scripts/ingest.mjs --source imci && test -f kb/source/.text/imci.txt && echo OK
```

## Sources (URLs in 11-resources-clinic-mesh.md)
WHO IMCI chart booklet, WHO BEC, WHO Model Formulary, MSF guidelines, START triage, openFDA labels.
