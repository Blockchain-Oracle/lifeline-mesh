# Story — `story-build-in-public-checklist`

**Epic:** Epic 11 — Submission artefacts · **Depends on:** none · **Est:** 10 min

## Why
There's a dedicated Build-in-Public prize ($1,500) and community-vote weight. A small, consistent cadence captures those points.

## BDD acceptance criteria
```
Given submission/BUILD-IN-PUBLIC.md
Then it records: the team hashtag (#LifelineMesh), the @QVAC tag, the Discord (tetherdev) thread link, and a 3–5 post cadence with dates up to the deadline

Given each planned post
Then it has a hook (the mesh moment, the Pi RAM numbers, the citation demo) and an artifact (clip/screenshot)

Given the checklist
Then it is updated with links as posts go live
```

## File modification map
- `submission/BUILD-IN-PUBLIC.md` — NEW — hashtag, cadence, post plan + live links.

## Shell verification
```bash
grep -qi "#LifelineMesh" submission/BUILD-IN-PUBLIC.md && echo OK
```

## Note
Posting itself is a shared/external action — drafts are prepared here; actual posting happens with Abu's go-ahead.
