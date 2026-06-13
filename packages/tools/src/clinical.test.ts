import { describe, it, expect } from "vitest";
import { classifyBreathing } from "./breathing-rate.js";
import { evaluateDangerSigns } from "./danger-signs.js";
import { classifyCough } from "./triage-classify.js";
import { amoxicillinDose } from "./dosing.js";

describe("classifyBreathing (IMCI p.6 thresholds)", () => {
  it("infant (8mo) fast at 50, not at 49", () => {
    expect(classifyBreathing(50, 8).fast).toBe(true);
    expect(classifyBreathing(49, 8).fast).toBe(false);
  });
  it("child (24mo) fast at 40, not at 39", () => {
    expect(classifyBreathing(40, 24).fast).toBe(true);
    expect(classifyBreathing(39, 24).fast).toBe(false);
  });
  it("12-month boundary uses the child threshold (40)", () => {
    expect(classifyBreathing(45, 12).fast).toBe(true);
  });
  it("cites the cough-assess chunk", () => {
    expect(classifyBreathing(52, 24).citationId).toBe("c-imci-cough-or-difficult-breathing-assess");
  });
});

describe("evaluateDangerSigns (IMCI p.5)", () => {
  it("flags present signs only", () => {
    const r = evaluateDangerSigns({ convulsing_now: true, unable_to_drink: false });
    expect(r.any).toBe(true);
    expect(r.present).toEqual(["convulsing_now"]);
  });
  it("reports none when all absent", () => {
    expect(evaluateDangerSigns({}).any).toBe(false);
  });
});

describe("classifyCough (IMCI p.6 + danger override)", () => {
  it("danger sign -> SEVERE PNEUMONIA OR VERY SEVERE DISEASE", () => {
    expect(classifyCough({ ageMonths: 10, breathsPerMin: 58, dangerSigns: { vomits_everything: true } }).classification)
      .toBe("SEVERE PNEUMONIA OR VERY SEVERE DISEASE");
  });
  it("stridor in calm child -> severe", () => {
    expect(classifyCough({ ageMonths: 24, stridorInCalmChild: true }).classification)
      .toBe("SEVERE PNEUMONIA OR VERY SEVERE DISEASE");
  });
  it("fast breathing -> PNEUMONIA", () => {
    expect(classifyCough({ ageMonths: 24, breathsPerMin: 52 }).classification).toBe("PNEUMONIA");
  });
  it("chest indrawing -> PNEUMONIA", () => {
    expect(classifyCough({ ageMonths: 36, breathsPerMin: 30, chestIndrawing: true }).classification).toBe("PNEUMONIA");
  });
  it("no signs -> COUGH OR COLD", () => {
    expect(classifyCough({ ageMonths: 36, breathsPerMin: 30 }).classification).toBe("COUGH OR COLD");
  });
});

describe("amoxicillinDose (IMCI p.6)", () => {
  it("doses within charted bands", () => {
    expect(amoxicillinDose(8).mg).toBe(250);
    expect(amoxicillinDose(12).mg).toBe(375);
    expect(amoxicillinDose(16).mg).toBe(500);
  });
  it("refuses out-of-range weights (needsReview)", () => {
    const r = amoxicillinDose(25);
    expect(r.mg).toBeNull();
    expect(r.needsReview).toBe(true);
  });
});
