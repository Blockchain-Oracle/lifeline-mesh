# Story — `story-workspace-portability`

**Epic:** Epic 4 — RAG runtime + citations · **Depends on:** `story-embed-kb-script` · **Est:** 10 min

## Why
Confirm the x86-built `kb/workspace.sqlite` opens and searches correctly on the Pi's arm64. SDK validation found sqlite-wasm is architecture-independent, so this should be trivially true — this story proves it.

## BDD acceptance criteria
```
Given kb/workspace.sqlite built on x86
When opened by packages/rag/src/workspace.ts on arm64 (or any arch)
Then the schema loads and a sample query returns the same top hit as on x86

Given a CI/dev check
When `node scripts/verify-workspace.mjs` runs on the build machine
Then it opens the DB, runs the demo query, and asserts the expected top chunk id

Given the Pi (day-1)
Then the same script run on the Pi passes (manual checklist item)
```

## File modification map
- `scripts/verify-workspace.mjs` — NEW — opens DB, runs demo query, asserts top id.
- `docs/PI-DAY1.md` — UPDATE/NEW — add this to the on-Pi checklist.

## Shell verification
```bash
node scripts/verify-workspace.mjs   # exit 0, prints matching top chunk id
```
