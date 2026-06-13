// IMCI clinical thresholds, verified against the WHO IMCI Chart Booklet (March 2014).
// Chunk ids match kb/chunks/imci.ndjson so tool outputs can cite their source.

export const AGE = { INFANT_MAX_MONTHS: 12, CHILD_MAX_MONTHS: 60 } as const;

// Fast-breathing thresholds (breaths/min) — IMCI p.6.
export const BREATHING = {
  INFANT_FAST: 50, // 2 up to 12 months
  CHILD_FAST: 40, // 12 months up to 5 years
} as const;

// Mid-upper arm circumference (mm) — IMCI p.10.
export const MUAC = { SEVERE_MM: 115, MODERATE_MIN_MM: 115, MODERATE_MAX_MM: 125 } as const;

// Amoxicillin dosing bands (mg/dose) by weight (kg) — IMCI p.6 dosing chunk.
export const AMOX_BANDS = [
  { minKg: 4, maxKg: 10, mg: 250 },
  { minKg: 10, maxKg: 14, mg: 375 },
  { minKg: 14, maxKg: 19, mg: 500 },
] as const;

export const GENERAL_DANGER_SIGNS = [
  "unable_to_drink",
  "vomits_everything",
  "convulsions_history",
  "lethargic",
  "unconscious",
  "convulsing_now",
] as const;
export type GeneralDangerSign = (typeof GENERAL_DANGER_SIGNS)[number];

export const CITATIONS = {
  dangerSigns: "c-imci-general-danger-signs",
  coughAssess: "c-imci-cough-or-difficult-breathing-assess",
  coughTreat: "c-imci-cough-or-difficult-breathing-classify-and-treat",
  amoxDosing: "c-imci-amoxicillin-dosing-oral",
  malnutrition: "c-imci-acute-malnutrition-assess-and-classify",
} as const;
