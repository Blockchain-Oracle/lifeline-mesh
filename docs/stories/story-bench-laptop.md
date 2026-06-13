# Story — `story-bench-laptop`

**Epic:** Epic 11 — Submission artefacts · **Depends on:** `story-route-by-state`, `story-eval-cases` · **Est:** 20 min

## Why
Senior-side numbers (MedPsy-4B) for the comparison the submission needs: small-on-Pi vs bigger-on-laptop, and the RAG-on/off accuracy lift.

## BDD acceptance criteria
```
Given scripts/bench/laptop.mjs
When run on the senior laptop
Then it runs the eval set on MedPsy-4B and writes submission/bench-laptop.json with the same schema as pi5

Given RAG-on vs RAG-off modes
Then it records accuracy for both, demonstrating the citation/RAG lift

Given the output
Then it validates against bench-schema.json
```

## File modification map
- `scripts/bench/laptop.mjs` — NEW.

## Shell verification
```bash
node scripts/bench/laptop.mjs && node -e "JSON.parse(require('fs').readFileSync('submission/bench-laptop.json'))"
```
