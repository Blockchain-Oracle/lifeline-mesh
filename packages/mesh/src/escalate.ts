import { ESCALATE } from "@lifeline/core";

// Deterministic escalation policy (ADR-008): decide when the junior node should
// hand a case to the senior 4B. Rules, not vibes — defensible to clinical judges.

export type EscalationLayer = "severity" | "uncertainty" | "confidence";

export interface EscalationDecision {
  escalate: boolean;
  reason?: string;
  layer?: EscalationLayer;
}

export interface EscalationInput {
  classification: string;
  severity?: "pink" | "yellow" | "green";
  confidence?: number;
}

// Severe (pink) classifications are high-stakes: a senior 4B review adds safety.
const SEVERE = new Set([
  "VERY SEVERE DISEASE",
  "SEVERE PNEUMONIA OR VERY SEVERE DISEASE",
  "VERY SEVERE FEBRILE DISEASE",
  "SEVERE DEHYDRATION",
  "MASTOIDITIS",
  "SEVERE ACUTE MALNUTRITION",
]);

export function evaluateEscalation(input: EscalationInput): EscalationDecision {
  if (input.classification === "NO CLASSIFICATION") {
    return { escalate: true, reason: "junior could not classify", layer: "uncertainty" };
  }
  if (input.severity === "pink" || SEVERE.has(input.classification)) {
    return { escalate: true, reason: `severe classification: ${input.classification}`, layer: "severity" };
  }
  if (input.confidence !== undefined && input.confidence < ESCALATE.CONFIDENCE_THRESHOLD) {
    return {
      escalate: true,
      reason: `confidence ${input.confidence} < ${ESCALATE.CONFIDENCE_THRESHOLD}`,
      layer: "confidence",
    };
  }
  return { escalate: false };
}
