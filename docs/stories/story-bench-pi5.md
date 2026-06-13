# Story — `story-bench-pi5`

**Epic:** Epic 11 — Submission artefacts · **Depends on:** `story-install-script`, `story-eval-cases` · **Est:** 30 min

## Why
The Tinkerer track lives or dies on real on-device numbers. This runs the 20-case eval on the Pi (junior alone and junior+senior) and produces the committed performance artifact.

## BDD acceptance criteria
```
Given scripts/bench/pi5.mjs
When run on the Pi
Then it runs all eval-cases, records TTFT/tok-s per inference, and writes submission/bench-pi5.json { device, model, perCase[], aggregate { ttftP50, ttftP95, tps, ramPeakMb } }

Given the run
Then it ALSO captures peak RSS (RAM budget proof) via the lifecycle

Given junior+senior mode
Then escalated cases show delegated timings separately

Given the output
Then it validates against submission/bench-schema.json (CI)
```

## File modification map
- `scripts/bench/pi5.mjs` — NEW.
- `submission/bench-schema.json` — NEW.
- `scripts/check-schemas.mjs` — UPDATE — validate bench files when present.

## Shell verification
```bash
# on the Pi:
node scripts/bench/pi5.mjs && node -e "JSON.parse(require('fs').readFileSync('submission/bench-pi5.json'))"
```
