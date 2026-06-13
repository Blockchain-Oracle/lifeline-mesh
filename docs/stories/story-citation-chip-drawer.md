# Story — `story-citation-chip-drawer`

**Epic:** Epic 9 — Web UI · **Depends on:** `story-case-console-shell` · **Est:** 20 min
**Design note:** behavior/contract only; reveal style (peek/drawer/modal) is the designer's decision.

## BDD acceptance criteria
```
Given CitationChip props { docId, section, page, quote }
When activated
Then it opens a surface showing the resolved label and the exact quoted passage

Given a citation with a long quote
Then the full quote is accessible (scroll/expand), not truncated silently

Given keyboard/AT use
Then the chip is focusable and operable without a pointer

Given tests
Then ≥4 assertions: label renders from props, quote shown on open, close works, keyboard operable
```

## File modification map
- `apps/web/src/components/{CitationChip,CitationDrawer}.tsx` — NEW.
- `apps/web/src/components/CitationChip.test.tsx` — NEW — ≥4 assertions.

## Shell verification
```bash
pnpm --filter web test CitationChip   # ≥4 pass
```
