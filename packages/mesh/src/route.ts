import type { MeshState } from "@lifeline/core";
import { evaluateEscalation, type EscalationInput, type EscalationDecision } from "./escalate.js";

export type RouteTarget = "junior-local" | "senior-delegated";

export interface RouteDecision {
  target: RouteTarget;
  escalation: EscalationDecision;
  escalatedButLocal: boolean;
}

// Combines the escalation policy with live mesh reachability: escalate to the senior
// only if the policy fires AND the senior is reachable; otherwise stay local and flag.
export function route(caseOutcome: EscalationInput, mesh: MeshState): RouteDecision {
  const escalation = evaluateEscalation(caseOutcome);
  if (!escalation.escalate) {
    return { target: "junior-local", escalation, escalatedButLocal: false };
  }
  if (mesh.status === "linked") {
    return { target: "senior-delegated", escalation, escalatedButLocal: false };
  }
  // Policy wants escalation but the senior is unreachable: keep the local result, flag it.
  return { target: "junior-local", escalation, escalatedButLocal: true };
}
