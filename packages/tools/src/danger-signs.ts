import { GENERAL_DANGER_SIGNS, CITATIONS, type GeneralDangerSign } from "./clinical-constants.js";

export interface DangerSignsResult {
  present: GeneralDangerSign[];
  any: boolean;
  citationId: string;
  note: string;
}

// Evaluate IMCI general danger signs (p.5) from a set of observed boolean findings.
// Deterministic: the policy decides escalation from this, not the model.
export function evaluateDangerSigns(findings: Partial<Record<GeneralDangerSign, boolean>>): DangerSignsResult {
  const present = GENERAL_DANGER_SIGNS.filter((s) => findings[s] === true);
  return {
    present,
    any: present.length > 0,
    citationId: CITATIONS.dangerSigns,
    note:
      present.length > 0
        ? `General danger sign(s) present: ${present.join(", ")}. URGENT attention; classify as VERY SEVERE DISEASE.`
        : "No general danger signs observed.",
  };
}
