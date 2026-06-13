import type { ToolCall } from "@lifeline/core";
import { TOOL_SCHEMAS } from "./schemas.js";
import { classifyBreathing } from "./breathing-rate.js";
import { evaluateDangerSigns } from "./danger-signs.js";
import { classifyCough, type CoughClassifyInput } from "./triage-classify.js";
import { amoxicillinDose } from "./dosing.js";
import { checkInteraction } from "./ddi.js";

export interface ToolOutput {
  ok: boolean;
  result?: unknown;
  error?: string;
  citationId?: string;
}

// Validate a model tool call against its zod schema and route to the deterministic
// implementation. Unknown tools / invalid args return a typed error (never throw
// into the agent loop) so the walkthrough can record a tool error and continue.
export function dispatchTool(call: ToolCall): ToolOutput {
  const schema = TOOL_SCHEMAS[call.name];
  if (!schema) return { ok: false, error: `unknown tool: ${call.name}` };
  const parsed = schema.safeParse(call.arguments);
  if (!parsed.success) {
    return { ok: false, error: `invalid args for ${call.name}: ${parsed.error.issues[0]?.message ?? "bad input"}` };
  }
  const args = parsed.data;
  switch (call.name) {
    case "compute_breathing_rate": {
      const r = classifyBreathing(args.ratePerMin, args.ageMonths);
      return { ok: true, result: r, citationId: r.citationId };
    }
    case "check_danger_signs": {
      const r = evaluateDangerSigns(args);
      return { ok: true, result: r, citationId: r.citationId };
    }
    case "classify_cough": {
      const r = classifyCough(args as unknown as CoughClassifyInput);
      return { ok: true, result: r, citationId: r.citationId };
    }
    case "amoxicillin_dose": {
      const r = amoxicillinDose(args.weightKg);
      return { ok: true, result: r, citationId: r.citationId };
    }
    case "drug_interaction": {
      const r = checkInteraction(args.drugA, args.drugB);
      return { ok: true, result: r };
    }
    default:
      return { ok: false, error: `unhandled tool: ${call.name}` };
  }
}
