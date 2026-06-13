# Story — `story-monorepo-bootstrap`

**Epic:** Epic 1 — Scaffold + CI/CD · **Depends on:** none · **Est:** 25 min
**Status note:** largely DONE in the initial scaffold commit; this story documents the acceptance bar.

## Why
Every later story needs a working pnpm/TypeScript workspace with path aliases and a place for shared code.

## BDD acceptance criteria
```
Given a fresh clone
When `pnpm install` runs
Then it completes with exit 0 and a pnpm-lock.yaml exists

Given the workspace root
When `pnpm typecheck` runs
Then tsc exits 0 across all workspace packages

Given tsconfig.base.json
When a file imports from "@core/constants"
Then the path alias resolves without error

Given `pnpm build`
Then every package with a build script emits dist/ and exits 0
```

## File modification map
- `package.json`, `pnpm-workspace.yaml`, `tsconfig.base.json` — NEW — workspace root, Node ≥22.17, `type: module`, aliases `@core/@agents/@rag/@mesh/@tools`.
- `.gitignore`, `.editorconfig`, `.prettierrc`, `LICENSE` (Apache-2.0), `README.md` — NEW.
- `packages/core/{package.json,tsconfig.json,src/index.ts}` — NEW — first workspace package.

## Shell verification
```bash
pnpm install && pnpm typecheck && pnpm build   # all exit 0
test -f pnpm-lock.yaml && echo "lock OK"
```
