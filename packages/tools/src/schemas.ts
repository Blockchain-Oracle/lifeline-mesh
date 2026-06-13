import { z } from "zod";
import type { ToolDef } from "@lifeline/core";

// Zod tool schemas → SDK ToolDef list (the SDK reads `.shape` off `parameters`).
// One source of truth: agents import these defs; the dispatcher validates args.
//
// Small medical models (MedPsy) emit tool args as strings/yes-no ("24", "yes"),
// so number/boolean fields are COERCIVE — verified against live MedPsy output.

const num = z.coerce.number();
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

export const breathingRateArgs = z.object({
  ratePerMin: num.describe("Breaths counted in one full minute"),
  ageMonths: num.describe("Child age in months"),
});

export const dangerSignsArgs = z.object({
  unable_to_drink: optBool.describe("Child not able to drink or breastfeed"),
  vomits_everything: optBool.describe("Child vomits everything"),
  convulsions_history: optBool.describe("Child has had convulsions this illness"),
  lethargic: optBool.describe("Child is lethargic"),
  unconscious: optBool.describe("Child is unconscious"),
  convulsing_now: optBool.describe("Child is convulsing now"),
});

export const classifyCoughArgs = z.object({
  ageMonths: num.describe("Child age in months"),
  breathsPerMin: optNum.describe("Breaths per minute, if counted"),
  chestIndrawing: optBool.describe("Chest indrawing present"),
  stridorInCalmChild: optBool.describe("Stridor heard in a calm child"),
});

export const doseArgs = z.object({
  weightKg: num.describe("Child weight in kilograms"),
});

export const drugInteractionArgs = z.object({
  drugA: z.string().describe("First medicine name"),
  drugB: z.string().describe("Second medicine name"),
});

export const TOOL_DEFS: ToolDef[] = [
  { name: "compute_breathing_rate", description: "Classify breathing rate against IMCI age thresholds.", parameters: breathingRateArgs },
  { name: "check_danger_signs", description: "Check IMCI general danger signs from observations.", parameters: dangerSignsArgs },
  { name: "classify_cough", description: "Classify a cough/difficult-breathing case per IMCI.", parameters: classifyCoughArgs },
  { name: "amoxicillin_dose", description: "Compute the amoxicillin dose by child weight.", parameters: doseArgs },
  { name: "drug_interaction", description: "Check for an interaction between two medicines.", parameters: drugInteractionArgs },
];

export const TOOL_SCHEMAS: Record<string, z.ZodObject<z.ZodRawShape>> = {
  compute_breathing_rate: breathingRateArgs,
  check_danger_signs: dangerSignsArgs,
  classify_cough: classifyCoughArgs,
  amoxicillin_dose: doseArgs,
  drug_interaction: drugInteractionArgs,
};
