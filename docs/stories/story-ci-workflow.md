# Story — `story-ci-workflow`

**Epic:** Epic 1 — Scaffold + CI/CD · **Depends on:** `story-eslint-400-line-cap` · **Est:** 25 min

## Why
The merge gate that makes every engineering standard non-negotiable. Without green-CI branch protection, the 400-line cap and tests are suggestions.

## BDD acceptance criteria
```
Given .github/workflows/ci.yml on a pull request
When CI runs
Then it executes, in order: install --frozen-lockfile, typecheck, lint, 400-line SLOC guard, test, schema:check, build
And any single step failing fails the whole job

Given a PR that adds a 401-SLOC source file
When CI runs
Then the "400-line SLOC guard" step fails

Given a PR with a failing unit test
When CI runs
Then the "Test" step fails and the job is red

Given main branch protection
Then a PR cannot merge while CI is red
```

## File modification map
- `.github/workflows/ci.yml` — NEW — `ubuntu-latest`, pnpm@10 + node@22, the 7 ordered steps.
- `scripts/check-sloc.mjs` — NEW — SLOC guard (non-blank, non-`//`), cap 400.
- `scripts/check-schemas.mjs` — NEW — validates `remote-apis.json` is an empty array + future schemas.
- `package.json` — UPDATE — `lint:sloc`, `schema:check` scripts.

## Shell verification
```bash
pnpm lint:sloc && pnpm schema:check     # exit 0 on clean tree
act pull_request 2>/dev/null || echo "CI yaml present; validated in GitHub Actions"
```

## Non-goals
- Branch protection toggles are set in GitHub UI (documented, not scripted).
