import { AGE, BREATHING, CITATIONS } from "./clinical-constants.js";

export interface BreathingResult {
  fast: boolean;
  threshold: number;
  citationId: string;
  note: string;
}

// Classify breathing rate per IMCI age-banded thresholds (p.6).
// 2 up to 12 months: fast at >= 50/min. 12 months up to 5 years: fast at >= 40/min.
export function classifyBreathing(ratePerMin: number, ageMonths: number): BreathingResult {
  const isInfant = ageMonths < AGE.INFANT_MAX_MONTHS;
  const threshold = isInfant ? BREATHING.INFANT_FAST : BREATHING.CHILD_FAST;
  const fast = ratePerMin >= threshold;
  const band = isInfant ? "2 up to 12 months" : "12 months up to 5 years";
  return {
    fast,
    threshold,
    citationId: CITATIONS.coughAssess,
    note: `${ratePerMin}/min vs fast-breathing threshold ${threshold}/min for ${band}: ${
      fast ? "FAST breathing" : "not fast"
    }.`,
  };
}
