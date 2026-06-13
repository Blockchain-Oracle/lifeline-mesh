# Story — `story-video-script`

**Epic:** Epic 11 — Submission artefacts · **Depends on:** `story-readme-and-screenshots` · **Est:** 20 min

## Why
The ≤5-minute video is the heart of the submission. A tight shot list makes it land the wow moment (router-cable pull) and show every mandated artifact.

## BDD acceptance criteria
```
Given submission/README.demo.md
Then it contains a shot-by-shot script (≤5 min) matching PRD §"five-minute demo": setting → voice intake → cited steps → escalation + router-cable pull → referral note → audit view

Given the script
Then each shot lists on-screen captions, the spoken line, and the artifact it proves (citation, delegation, audit log)

Given the opener
Then it states "synthetic case — research/demonstration only"

Given timing
Then the shot durations sum to ≤ 5:00
```

## File modification map
- `submission/README.demo.md` — NEW — the shot list + captions + timing table.

## Shell verification
```bash
grep -qi "synthetic" submission/README.demo.md && grep -qi "router" submission/README.demo.md && echo OK
```
