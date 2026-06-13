# Story — `story-referral-render`

**Epic:** Epic 6 — Referral note · **Depends on:** `story-referral-generator` · **Est:** 20 min

## Why
Turn the structured note into a clean printable artifact the CHW can hand to a hospital — markdown + PDF, with citations rendered as footnotes.

## BDD acceptance criteria
```
Given packages/agents/src/referral-render.ts renderMarkdown(note) and renderPdf(note)
Then markdown contains all SBAR sections with citation footnotes resolved to "WHO IMCI p.X §Y"

Given renderPdf
Then it produces a valid PDF buffer (magic bytes %PDF) from the markdown

Given a note with danger signs
Then they are rendered prominently in the Assessment section

Given tests
Then ≥4 assertions: all sections in markdown, citations as footnotes, %PDF header, danger-sign rendering
```

## File modification map
- `packages/agents/src/referral-render.ts` — NEW — markdown builder + PDF (markdown-pdf or pandoc wrapper).
- `packages/agents/src/referral-render.test.ts` — NEW — ≥4 assertions.

## Shell verification
```bash
pnpm --filter @lifeline/agents test referral-render   # ≥4 pass
```
