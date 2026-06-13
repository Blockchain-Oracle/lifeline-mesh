# Story — `story-readme-and-screenshots`

**Epic:** Epic 11 — Submission artefacts · **Depends on:** `story-audit-aggregate` · **Est:** 30 min

## Why
The README is the first thing a judge reads (3-stage verification stage 1 = static repo analysis). It must make the project legible and reproducible in minutes.

## BDD acceptance criteria
```
Given README.md
Then it contains: title, one-line pitch, the problem, hardware specs (Pi 5 4 GB + laptop) WITH system-profiler screenshots, the two-tier architecture diagram, reproduce steps (clone → pnpm i → fetch models → install.sh → run → bench), the demo video link, and the safety disclaimer

Given reproduce steps
Then a fresh reader can follow them end-to-end without tribal knowledge

Given screenshots
Then submission/screenshots/ holds hardware proof + UI captures referenced by the README
```

## File modification map
- `README.md` — UPDATE — full submission README.
- `submission/screenshots/` — NEW — hardware + UI images.
- `docs/architecture-diagram.*` — NEW — the box→laptop mesh diagram (or designer-provided).

## Shell verification
```bash
grep -qiE "reproduce|pnpm i" README.md && grep -qi "disclaimer" README.md && echo OK
```
