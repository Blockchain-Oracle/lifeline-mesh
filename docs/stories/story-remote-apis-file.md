# Story — `story-remote-apis-file`

**Epic:** Epic 11 — Submission artefacts · **Depends on:** none · **Est:** 5 min
**Status note:** DONE in scaffold (`remote-apis.json = []` + CI validation). This documents the bar.

## Why
The hackathon mandates a structured file listing every remote API call. Lifeline Mesh makes ZERO at runtime — an empty array is itself a selling point, and CI keeps it honest.

## BDD acceptance criteria
```
Given remote-apis.json
Then it is an empty JSON array []

Given any runtime code adds an internet fetch
Then lint/CI flags it (no-restricted-imports / banned-modules) and schema:check fails if the file is non-empty without justification

Given schema:check
Then it asserts remote-apis.json parses and is empty
```

## File modification map
- `remote-apis.json` — NEW — `[]`.
- `scripts/check-schemas.mjs` — UPDATE — empty-array assertion (done).

## Shell verification
```bash
pnpm schema:check   # OK: remote-apis.json
```
