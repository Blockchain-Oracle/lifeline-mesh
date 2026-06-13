import { describe, it, expect } from "vitest";
import { dispatchTool } from "./dispatch.js";
import { TOOL_DEFS, TOOL_SCHEMAS } from "./schemas.js";

describe("schemas", () => {
  it("every tool def has a matching schema by name", () => {
    for (const def of TOOL_DEFS) {
      expect(TOOL_SCHEMAS[def.name]).toBeDefined();
      expect(def.parameters).toBe(TOOL_SCHEMAS[def.name]);
    }
  });
});

describe("dispatchTool", () => {
  it("routes a valid classify_cough call and returns a citation", () => {
    const out = dispatchTool({ id: "1", name: "classify_cough", arguments: { ageMonths: 24, breathsPerMin: 52 } });
    expect(out.ok).toBe(true);
    expect((out.result as { classification: string }).classification).toBe("PNEUMONIA");
    expect(out.citationId).toBe("c-imci-cough-or-difficult-breathing-classify-and-treat");
  });

  it("returns a typed error for an unknown tool (never throws)", () => {
    const out = dispatchTool({ id: "1", name: "nope", arguments: {} });
    expect(out.ok).toBe(false);
    expect(out.error).toMatch(/unknown tool/);
  });

  it("returns a typed error for invalid args", () => {
    const out = dispatchTool({ id: "1", name: "amoxicillin_dose", arguments: { weightKg: "heavy" } });
    expect(out.ok).toBe(false);
    expect(out.error).toMatch(/invalid args/);
  });

  it("routes drug_interaction", () => {
    const out = dispatchTool({ id: "1", name: "drug_interaction", arguments: { drugA: "amoxicillin", drugB: "iron syrup" } });
    expect(out.ok).toBe(true);
    expect((out.result as { severity: string }).severity).toBe("none");
  });
});
