# Story — `story-kb-manifest`

**Epic:** Epic 3 — KB ingest · **Depends on:** `story-section-chunker` · **Est:** 15 min

## Why
Reproducibility + licensing transparency (judging requires both). The manifest records every source, its licence, checksum, and chunk count.

## BDD acceptance criteria
```
Given kb/manifest.json
Then it lists each source with { id, title, url, licence, sha256, chunkCount, version: KB_VERSION }

Given the build pipeline
When chunks are (re)generated
Then manifest chunkCount matches the actual NDJSON line count per source

Given schema:check
Then kb/manifest.json validates against kb/manifest.schema.json (CI)

Given a licence field that is empty
Then validation fails (no source without a declared licence)
```

## File modification map
- `kb/manifest.json` + `kb/manifest.schema.json` — NEW.
- `scripts/ingest.mjs` — UPDATE — writes/updates manifest after chunking.
- `scripts/check-schemas.mjs` — UPDATE — add manifest validation.

## Shell verification
```bash
pnpm schema:check   # manifest validates, exit 0
```
