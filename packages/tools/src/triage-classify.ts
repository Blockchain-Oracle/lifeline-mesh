import { classifyBreathing } from "./breathing-rate.js";
import { evaluateDangerSigns } from "./danger-signs.js";
import { CITATIONS, type GeneralDangerSign } from "./clinical-constants.js";

export interface CoughClassifyInput {
  ageMonths: number;
  breathsPerMin?: number;
  chestIndrawing?: boolean;
  stridorInCalmChild?: boolean;
  dangerSigns?: Partial<Record<GeneralDangerSign, boolean>>;
}

export interface ClassifyResult {
  classification: string;
  severity: "pink" | "yellow" | "green";
  citationId: string;
  rationale: string;
}

// IMCI cough/difficult-breathing classifier (p.6) with the general-danger-sign
// override (p.5). Deterministic — rules over vibes (ADR-008).
export function classifyCough(input: CoughClassifyInput): ClassifyResult {
  const danger = evaluateDangerSigns(input.dangerSigns ?? {});
  if (danger.any || input.stridorInCalmChild === true) {
    return {
      classification: "SEVERE PNEUMONIA OR VERY SEVERE DISEASE",
      severity: "pink",
      citationId: CITATIONS.coughTreat,
      rationale: danger.any
        ? `General danger sign(s): ${danger.present.join(", ")}.`
        : "Stridor in a calm child.",
    };
  }
  const breathing =
    input.breathsPerMin === undefined
      ? { fast: false, note: "breathing rate not provided" }
      : classifyBreathing(input.breathsPerMin, input.ageMonths);
  if (input.chestIndrawing === true || breathing.fast) {
    return {
      classification: "PNEUMONIA",
      severity: "yellow",
      citationId: CITATIONS.coughTreat,
      rationale: `${input.chestIndrawing ? "Chest indrawing. " : ""}${breathing.note}`.trim(),
    };
  }
  return {
    classification: "COUGH OR COLD",
    severity: "green",
    citationId: CITATIONS.coughTreat,
    rationale: `No danger signs, no chest indrawing. ${breathing.note}`.trim(),
  };
}
