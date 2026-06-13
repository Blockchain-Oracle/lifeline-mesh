import { z } from "zod";

// Domain types shared across packages. Schemas validate anything crossing a boundary.

export const chatTurnSchema = z.object({
  role: z.enum(["system", "user", "assistant", "tool"]),
  content: z.string(),
});
export type ChatTurn = z.infer<typeof chatTurnSchema>;

export const citationSchema = z.object({
  chunkId: z.string(),
  docId: z.string(),
  sourceTitle: z.string(),
  section: z.string(),
  page: z.number().int().nonnegative(),
  quote: z.string(),
});
export type Citation = z.infer<typeof citationSchema>;

// A tool definition for the QVAC SDK. `parameters` is a Zod object schema —
// the SDK reads `.shape` off it (NOT a JSON Schema). Verified live 2026-06-13.
export interface ToolDef {
  name: string;
  description: string;
  parameters: z.ZodObject<z.ZodRawShape>;
}

// Shape returned by the SDK's toolCallStream / result.toolCalls.
export const toolCallSchema = z.object({
  id: z.string(),
  name: z.string(),
  arguments: z.record(z.string(), z.unknown()),
  raw: z.string().optional(),
});
export type ToolCall = z.infer<typeof toolCallSchema>;

export const completionStatsSchema = z.object({
  timeToFirstToken: z.number().optional(),
  tokensPerSecond: z.number().optional(),
  promptTokens: z.number().optional(),
  generatedTokens: z.number().optional(),
  cacheTokens: z.number().optional(),
  backendDevice: z.string().optional(),
});
export type CompletionStats = z.infer<typeof completionStatsSchema>;

export const classificationSchema = z.object({
  name: z.string(),
  treatment: z.string(),
  dangerSigns: z.array(z.string()),
  citations: z.array(citationSchema),
});
export type Classification = z.infer<typeof classificationSchema>;

export const selfAssessmentSchema = z.object({
  confidence: z.number().min(0).max(1),
  uncertainFactors: z.array(z.string()),
  escalate: z.boolean(),
});
export type SelfAssessment = z.infer<typeof selfAssessmentSchema>;

export interface TriageState {
  caseId: string;
  ageMonths: number;
  sex: "m" | "f" | "unknown";
  findings: Record<string, string | number | boolean>;
  dangerSigns: string[];
  proposedClassification?: Classification;
  citations: Citation[];
  turns: number;
  toolErrorsRecent: number;
  stopReason?: string;
  selfAssessment?: SelfAssessment;
}

export type EscalationLayer = "deterministic" | "self-assessment" | "mechanical";

export interface EscalationDecision {
  escalate: boolean;
  reason?: string;
  layer?: EscalationLayer;
}

export type MeshStatus = "local" | "linked" | "offline";

export interface MeshState {
  status: MeshStatus;
  latencyMs?: number;
  checkedAtMs: number;
}
