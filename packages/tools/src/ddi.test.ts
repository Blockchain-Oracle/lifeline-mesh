import { describe, it, expect } from "vitest";
import { checkInteraction } from "./ddi.js";

describe("checkInteraction (offline DDI)", () => {
  it("amoxicillin + iron syrup -> none, found", () => {
    const r = checkInteraction("amoxicillin", "iron syrup");
    expect(r.severity).toBe("none");
    expect(r.found).toBe(true);
  });
  it("known moderate interaction (ciprofloxacin + ferrous)", () => {
    expect(checkInteraction("ciprofloxacin", "ferrous sulfate").severity).toBe("moderate");
  });
  it("is symmetric", () => {
    expect(checkInteraction("ferrous sulfate", "ciprofloxacin").severity).toBe("moderate");
  });
  it("unknown drug -> none + found=false (never fabricates)", () => {
    const r = checkInteraction("amoxicillin", "unobtanium");
    expect(r.found).toBe(false);
    expect(r.severity).toBe("none");
    expect(r.note).toMatch(/national formulary/i);
  });
  it("resolves aliases (coartem, acetaminophen)", () => {
    expect(checkInteraction("coartem", "acetaminophen").found).toBe(true);
  });
});
