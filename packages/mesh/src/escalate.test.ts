import { describe, it, expect } from "vitest";
import { evaluateEscalation } from "./escalate.js";
import { route } from "./route.js";
import type { MeshState } from "@lifeline/core";

describe("evaluateEscalation (deterministic policy)", () => {
  it("escalates NO CLASSIFICATION (junior unsure)", () => {
    const d = evaluateEscalation({ classification: "NO CLASSIFICATION" });
    expect(d.escalate).toBe(true);
    expect(d.layer).toBe("uncertainty");
  });
  it("escalates a severe (pink) classification", () => {
    expect(evaluateEscalation({ classification: "SEVERE DEHYDRATION" }).escalate).toBe(true);
    expect(evaluateEscalation({ classification: "PNEUMONIA", severity: "pink" }).layer).toBe("severity");
  });
  it("escalates on low confidence", () => {
    const d = evaluateEscalation({ classification: "PNEUMONIA", confidence: 0.4 });
    expect(d.escalate).toBe(true);
    expect(d.layer).toBe("confidence");
  });
  it("does not escalate a confident non-severe case", () => {
    expect(evaluateEscalation({ classification: "COUGH OR COLD", severity: "green", confidence: 0.9 }).escalate).toBe(false);
  });
});

const linked: MeshState = { status: "linked", latencyMs: 12, checkedAtMs: 0 };
const offline: MeshState = { status: "offline", checkedAtMs: 0 };

describe("route (escalation x mesh reachability)", () => {
  it("routes a severe case to the senior when linked", () => {
    const r = route({ classification: "SEVERE DEHYDRATION" }, linked);
    expect(r.target).toBe("senior-delegated");
    expect(r.escalatedButLocal).toBe(false);
  });
  it("stays local and flags when escalation wanted but senior offline", () => {
    const r = route({ classification: "SEVERE DEHYDRATION" }, offline);
    expect(r.target).toBe("junior-local");
    expect(r.escalatedButLocal).toBe(true);
  });
  it("stays local for a non-escalating case", () => {
    const r = route({ classification: "COUGH OR COLD", severity: "green" }, linked);
    expect(r.target).toBe("junior-local");
    expect(r.escalatedButLocal).toBe(false);
  });
});
