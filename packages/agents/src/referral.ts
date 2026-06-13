import type { LlmPort, ChatTurn } from "@lifeline/core";
import { z } from "zod";
import type { CaseResult } from "./case-runner.js";

// Structured SBAR referral note generated via grammar-constrained json_schema, then
// rendered to a printable letter. A documented CHW pain point; runs on the senior
// model when escalation fired (better wording for the hard cases that get referred).

export const referralSchema = z.object({
  situation: z.string(),
  background: z.string(),
  assessment: z.string(),
  recommendation: z.string(),
});
export type ReferralNote = z.infer<typeof referralSchema>;

const REFERRAL_JSON_SCHEMA = {
  type: "object",
  properties: {
    situation: { type: "string" },
    background: { type: "string" },
    assessment: { type: "string" },
    recommendation: { type: "string" },
  },
  required: ["situation", "background", "assessment", "recommendation"],
} as const;

function referralPrompt(c: CaseResult, ageMonths: number, sex: string): ChatTurn[] {
  return [
    {
      role: "system",
      content:
        "You write a concise SBAR referral note for a community health worker referring a sick child to a district hospital. Use only the assessment provided. Be factual and brief; do not invent findings.",
    },
    {
      role: "user",
      content: `Child: ${ageMonths} months, ${sex}.
IMCI classification: ${c.classification} (${c.rationale}).
Symptom categories assessed: ${c.categories.join(", ") || "none"}.
Extracted findings: ${JSON.stringify(c.findings)}.
Write the referral note as JSON with situation, background, assessment, recommendation.`,
    },
  ];
}

export interface ReferralDeps {
  llm: LlmPort;
  modelRef: string;
}

export async function generateReferral(
  result: CaseResult,
  ageMonths: number,
  sex: string,
  deps: ReferralDeps,
): Promise<ReferralNote> {
  const completion = deps.llm.complete({
    modelRef: deps.modelRef,
    history: referralPrompt(result, ageMonths, sex),
    responseFormat: { type: "json_schema", name: "referral", schema: REFERRAL_JSON_SCHEMA },
    reasoningBudget: 0,
    caseId: result.caseId,
  });
  for await (const _ of completion.tokenStream) void _;
  const text = (await completion.text).replace(/<think>[\s\S]*?<\/think>/g, "").trim();
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  const parsed = referralSchema.safeParse(JSON.parse(start >= 0 ? text.slice(start, end + 1) : "{}"));
  if (parsed.success) return parsed.data;
  // Deterministic fallback from the structured case if the model output is malformed.
  return {
    situation: `Child ${ageMonths} months referred with IMCI classification ${result.classification}.`,
    background: `Symptoms assessed: ${result.categories.join(", ") || "see findings"}.`,
    assessment: result.rationale,
    recommendation: "Refer to the district hospital for further assessment and management.",
  };
}
