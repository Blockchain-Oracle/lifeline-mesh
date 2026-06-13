import type { ReferralNote } from "./referral.js";
import type { Citation } from "@lifeline/rag";

// Render the SBAR note to a printable markdown letter with cited sources.

export interface ReferralContext {
  classification: string;
  ageMonths: number;
  sex: string;
  citations: Citation[];
  dateIso: string;
}

export function renderMarkdown(note: ReferralNote, ctx: ReferralContext): string {
  const sources =
    ctx.citations.length > 0
      ? ctx.citations.map((c) => `- ${c.label}`).join("\n")
      : "- WHO IMCI Chart Booklet (March 2014)";
  return `# Referral Note

**Date:** ${ctx.dateIso}
**Patient:** child, ${ctx.ageMonths} months, ${ctx.sex}
**IMCI classification:** ${ctx.classification}

## Situation
${note.situation}

## Background
${note.background}

## Assessment
${note.assessment}

## Recommendation
${note.recommendation}

---

### Protocol sources
${sources}

_Generated offline by Lifeline Mesh. For research/demonstration — not a substitute for clinical judgement._
`;
}
