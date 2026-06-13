# Story — `story-embed-kb-script`

**Epic:** Epic 4 — RAG runtime + citations · **Depends on:** `story-inference-adapter`, `story-imci-curated-subset` · **Est:** 35 min

## Why
Build the vector DB once on the laptop and ship it to the Pi. Uses the validated low-level path: `embed()` + self-managed `@sqliteai/sqlite-wasm` with arbitrary metadata columns (sqlite-wasm is arch-independent, so the x86-built DB opens on arm64).

## BDD acceptance criteria
```
Given scripts/embed-kb.mjs
When run over kb/chunks/*.ndjson with EMBEDDING (EmbeddingGemma 768-dim)
Then it produces kb/workspace.sqlite with a table holding (id, content, source_id, section, page, type, embedding BLOB)

Given the vector index
Then vector_init/vector_quantize/vector_quantize_preload are applied with dimension=768

Given a re-run
Then the DB is rebuilt deterministically (same chunk set → same row count)

Given EMBED_DIM mismatch (chunks embedded at 768 but index says 1024)
Then the script fails loudly before writing a corrupt DB
```

## File modification map
- `scripts/embed-kb.mjs` — NEW — embeds chunks via the adapter's EmbedPort, writes sqlite-wasm DB with metadata columns.
- `packages/rag/src/workspace.ts` — NEW — open/create DB, schema, dim guard.
- `packages/rag/package.json` — UPDATE — add `@sqliteai/sqlite-wasm`.

## Shell verification
```bash
node scripts/embed-kb.mjs && test -f kb/workspace.sqlite && echo OK
```

## Risk
EmbeddingGemma 768-dim assumed; if RAM forces the Qwen3-Embedding-0.6B fallback, EMBED_DIM→1024 and the DB must be rebuilt (single constant change).
