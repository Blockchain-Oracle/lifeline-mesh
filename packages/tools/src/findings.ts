import { z } from "zod";

// Structured clinical findings extracted from the CHW's report via grammar-constrained
// json_schema (reliable on small models). ageMonths comes from the CHW's structured
// input, NOT from extraction (models mis-convert "two years" -> months).

const optNum = z.coerce.number().optional();
const optBool = z
  .preprocess((v) => {
    if (typeof v === "boolean") return v;
    if (typeof v === "string") {
      const s = v.trim().toLowerCase();
      if (["true", "yes", "y", "1", "present"].includes(s)) return true;
      if (["false", "no", "n", "0", "absent", ""].includes(s)) return false;
    }
    return v;
  }, z.boolean())
  .optional();

export const findingsSchema = z.object({
  // General danger signs
  unableToDrink: optBool,
  vomitsEverything: optBool,
  convulsingNow: optBool,
  convulsionsHistory: optBool,
  lethargicOrUnconscious: optBool,
  // Cough / breathing
  hasCough: optBool,
  breathsPerMin: optNum,
  chestIndrawing: optBool,
  stridorInCalmChild: optBool,
  // Diarrhoea
  hasDiarrhoea: optBool,
  bloodInStool: optBool,
  restlessIrritable: optBool,
  sunkenEyes: optBool,
  drinkingEagerlyThirsty: optBool,
  drinkingPoorly: optBool,
  skinPinchVerySlow: optBool,
  skinPinchSlow: optBool,
  // Fever
  hasFever: optBool,
  stiffNeck: optBool,
  malariaTestPositive: optBool,
  // Ear
  hasEarProblem: optBool,
  earPainOrDischarge: optBool,
  swellingBehindEar: optBool,
  // Malnutrition
  bilateralOedema: optBool,
  muacMm: optNum,
});

export type Findings = z.infer<typeof findingsSchema>;

const b = { type: "boolean" } as const;
const n = { type: "number" } as const;

// Two-stage extraction (focused = far less hallucination than one 23-field form).
// IMCI assesses EVERY symptom, so stage 1 multi-selects which categories are present
// + general danger signs. Stage 2 then deep-extracts only the present categories.
export const CATEGORIES = ["cough_or_breathing", "diarrhoea", "fever", "ear_problem", "malnutrition"] as const;
export type Category = (typeof CATEGORIES)[number];

export const TRIAGE_JSON_SCHEMA = {
  type: "object",
  properties: {
    hasCoughOrBreathing: b,
    hasDiarrhoea: b,
    hasFever: b,
    hasEarProblem: b,
    hasMalnutritionSign: b,
    unableToDrink: b,
    vomitsEverything: b,
    convulsingNow: b,
    convulsionsHistory: b,
    lethargicOrUnconscious: b,
  },
  required: [
    "hasCoughOrBreathing", "hasDiarrhoea", "hasFever", "hasEarProblem", "hasMalnutritionSign",
    "unableToDrink", "vomitsEverything", "convulsingNow", "convulsionsHistory", "lethargicOrUnconscious",
  ],
} as const;

export const CATEGORY_TRIAGE_FLAG: Record<Category, string> = {
  cough_or_breathing: "hasCoughOrBreathing",
  diarrhoea: "hasDiarrhoea",
  fever: "hasFever",
  ear_problem: "hasEarProblem",
  malnutrition: "hasMalnutritionSign",
};
export const CATEGORY_FINDING_FLAG: Partial<Record<Category, keyof Findings>> = {
  cough_or_breathing: "hasCough",
  diarrhoea: "hasDiarrhoea",
  fever: "hasFever",
  ear_problem: "hasEarProblem",
};

// Stage 2: only the signs relevant to a present category.
export const CATEGORY_JSON_SCHEMAS: Record<Category, { type: "object"; properties: Record<string, unknown>; required: string[] }> = {
  cough_or_breathing: { type: "object", properties: { breathsPerMin: n, chestIndrawing: b, stridorInCalmChild: b }, required: ["chestIndrawing", "stridorInCalmChild"] },
  diarrhoea: { type: "object", properties: { bloodInStool: b, sunkenEyes: b, restlessIrritable: b, drinkingEagerlyThirsty: b, drinkingPoorly: b, skinPinchVerySlow: b, skinPinchSlow: b }, required: ["sunkenEyes", "restlessIrritable", "drinkingEagerlyThirsty", "drinkingPoorly", "skinPinchVerySlow", "skinPinchSlow"] },
  fever: { type: "object", properties: { stiffNeck: b, malariaTestPositive: b }, required: ["stiffNeck", "malariaTestPositive"] },
  ear_problem: { type: "object", properties: { earPainOrDischarge: b, swellingBehindEar: b }, required: ["earPainOrDischarge", "swellingBehindEar"] },
  malnutrition: { type: "object", properties: { bilateralOedema: b, muacMm: n }, required: ["bilateralOedema"] },
};
