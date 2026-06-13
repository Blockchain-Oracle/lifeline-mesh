import type { LlmPort, ChatTurn, SelfAssessment } from "@lifeline/core";
import { selfAssessmentSchema } from "@lifeline/core";
import { SELF_ASSESSMENT_PROMPT } from "./prompts.js";

// Grammar-constrained confidence probe (the SDK exposes no logprobs). json_schema
// and tools are mutually exclusive, so this is a separate tools-less completion.
const SELF_ASSESSMENT_JSON_SCHEMA = {
  type: "object",
  properties: {
    confidence: { type: "number" },
    uncertainFactors: { type: "array", items: { type: "string" } },
    escalate: { type: "boolean" },
  },
  required: ["confidence", "uncertainFactors", "escalate"],
} as const;

export async function assessConfidence(
  llm: LlmPort,
  modelRef: string,
  caseHistory: ChatTurn[],
): Promise<SelfAssessment> {
  const history: ChatTurn[] = [...caseHistory, { role: "user", content: SELF_ASSESSMENT_PROMPT }];
  const result = llm.complete({
    modelRef,
    history,
    responseFormat: { type: "json_schema", name: "self_assessment", schema: SELF_ASSESSMENT_JSON_SCHEMA },
    reasoningBudget: 0,
  });
  for await (const _ of result.tokenStream) void _;
  const text = await result.text;
  const parsed = selfAssessmentSchema.safeParse(JSON.parse(text));
  if (!parsed.success) {
    // Conservative default: low confidence -> escalate when the probe is unparseable.
    return { confidence: 0, uncertainFactors: ["self-assessment unparseable"], escalate: true };
  }
  return parsed.data;
}
