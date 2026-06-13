# Story — `story-vite-scaffold`

**Epic:** Epic 9 — Web UI · **Depends on:** `story-monorepo-bootstrap` · **Est:** 20 min
**Design note:** scaffold only. Visual language comes from the designer (see `DESIGN_BRIEF.md`); this sets up the buildable shell.

## BDD acceptance criteria
```
Given apps/web with Vite + React + TS + Tailwind
When `pnpm --filter web build`
Then it emits a static bundle to apps/web/dist with exit 0

Given `pnpm --filter web dev`
Then the app serves and renders a placeholder App without console errors

Given vitest + jsdom configured for the package
Then `pnpm --filter web test` runs
```

## File modification map
- `apps/web/{package.json,tsconfig.json,vite.config.ts,tailwind.config.ts,index.html}` — NEW.
- `apps/web/src/{main.tsx,App.tsx}` — NEW — placeholder shell + router.
- `apps/web/src/styles/tokens.css` — NEW — EMPTY placeholder (designer fills; no colors committed by devs).

## Shell verification
```bash
pnpm --filter web build && test -d apps/web/dist && echo OK
```
