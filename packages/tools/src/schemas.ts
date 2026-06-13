import { z } from "zod";
import type { ToolDef } from "@lifeline/core";

// Zod tool schemas → SDK ToolDef list (the SDK reads `.shape` off `parameters`).
// One source of truth: agents import these defs; the dispatcher validates args.

export const breathingRateArgs = z.object({
  ratePerMin: z.number().describe("Breaths counted in one full minute"),
  ageMonths: z.number().describe("Child age in months"),
});

export const dangerSignsArgs = z.object({
  unable_to_drink: z.boolean().optional().describe("Child not able to drink or breastfeed"),
  vomits_everything: z.boolean().optional().describe("Child vomits everything"),
  convulsions_history: z.boolean().optional().describe("Child has had convulsions this illness"),
  lethargic: z.boolean().optional().describe("Child is lethargic"),
  unconscious: z.boolean().optional().describe("Child is unconscious"),
  convulsing_now: z.boolean().optional().describe("Child is convulsing now"),
});

export const classifyCoughArgs = z.object({
  ageMonths: z.number().describe("Child age in months"),
  breathsPerMin: z.number().optional().describe("Breaths per minute, if counted"),
  chestIndrawing: z.boolean().optional().describe("Chest indrawing present"),
  stridorInCalmChild: z.boolean().optional().describe("Stridor heard in a calm child"),
});

export const doseArgs = z.object({
  weightKg: z.number().describe("Child weight in kilograms"),
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
