# Story — `story-classification-and-referral`

**Epic:** Epic 9 — Web UI · **Depends on:** `story-protocol-step-card` · **Est:** 25 min
**Design note:** behavior/contract only; verdict emphasis + referral surface (modal/page/sheet) chosen by the designer.

## BDD acceptance criteria
```
Given ClassificationVerdict props { name, dangerSigns[], next }
Then it renders the classification, marks danger signs distinctly (assert by role/aria, not color), and exposes the primary action (generate referral / continue)

Given the referral action
When triggered
Then it requests generation and renders the returned ReferralNote with citations and a share/download affordance

Given a danger-sign verdict
Then an urgent affordance is present (asserted structurally)

Given tests
Then ≥5 assertions: verdict render, danger-sign marking, primary action, referral render with citations, download affordance present
```

## File modification map
- `apps/web/src/components/{ClassificationVerdict,ReferralModal}.tsx` — NEW.
- `apps/web/src/components/*.test.tsx` — NEW — ≥5 assertions.

## Shell verification
```bash
pnpm --filter web test ClassificationVerdict ReferralModal   # ≥5 pass
```
