import { describe, it, expect } from "vitest";
import { classifyCase } from "./classify-case.js";
import type { Findings } from "./findings.js";

const f = (o: Partial<Findings>): Findings => o;

describe("classifyCase (deterministic IMCI engine)", () => {
  it("fast breathing -> PNEUMONIA", () => {
    expect(classifyCase(f({ hasCough: true, breathsPerMin: 52 }), 24).classification).toBe("PNEUMONIA");
  });

  it("chest indrawing -> PNEUMONIA", () => {
    expect(classifyCase(f({ hasCough: true, breathsPerMin: 30, chestIndrawing: true }), 36).classification).toBe("PNEUMONIA");
  });

  it("cough, normal breathing, no signs -> COUGH OR COLD", () => {
    expect(classifyCase(f({ hasCough: true, breathsPerMin: 30 }), 36).classification).toBe("COUGH OR COLD");
  });

  it("stridor in calm child -> SEVERE PNEUMONIA OR VERY SEVERE DISEASE", () => {
    expect(classifyCase(f({ hasCough: true, stridorInCalmChild: true }), 24).classification).toBe("SEVERE PNEUMONIA OR VERY SEVERE DISEASE");
  });

  it("danger sign + cough -> SEVERE PNEUMONIA OR VERY SEVERE DISEASE", () => {
    expect(classifyCase(f({ hasCough: true, breathsPerMin: 58, vomitsEverything: true }), 10).classification).toBe("SEVERE PNEUMONIA OR VERY SEVERE DISEASE");
  });

  it("danger sign, no cough -> VERY SEVERE DISEASE", () => {
    expect(classifyCase(f({ convulsingNow: true, unableToDrink: true }), 12).classification).toBe("VERY SEVERE DISEASE");
  });

  it("severe dehydration (very slow skin pinch)", () => {
    expect(classifyCase(f({ hasDiarrhoea: true, lethargicOrUnconscious: true, sunkenEyes: true, skinPinchVerySlow: true }), 15).classification).toBe("SEVERE DEHYDRATION");
  });

  it("some dehydration", () => {
    expect(classifyCase(f({ hasDiarrhoea: true, restlessIrritable: true, drinkingEagerlyThirsty: true, skinPinchSlow: true }), 24).classification).toBe("SOME DEHYDRATION");
  });

  it("no dehydration", () => {
    expect(classifyCase(f({ hasDiarrhoea: true }), 36).classification).toBe("NO DEHYDRATION");
  });

  it("fever with stiff neck -> VERY SEVERE FEBRILE DISEASE", () => {
    expect(classifyCase(f({ hasFever: true, stiffNeck: true }), 48).classification).toBe("VERY SEVERE FEBRILE DISEASE");
  });

  it("fever + positive malaria -> MALARIA", () => {
    expect(classifyCase(f({ hasFever: true, malariaTestPositive: true }), 36).classification).toBe("MALARIA");
  });

  it("ear swelling behind ear -> MASTOIDITIS", () => {
    expect(classifyCase(f({ hasEarProblem: true, swellingBehindEar: true }), 24).classification).toBe("MASTOIDITIS");
  });

  it("ear pain/discharge -> ACUTE EAR INFECTION", () => {
    expect(classifyCase(f({ hasEarProblem: true, earPainOrDischarge: true }), 36).classification).toBe("ACUTE EAR INFECTION");
  });

  it("bilateral oedema -> SEVERE ACUTE MALNUTRITION", () => {
    expect(classifyCase(f({ bilateralOedema: true }), 18).classification).toBe("SEVERE ACUTE MALNUTRITION");
  });

  it("MUAC 120mm -> MODERATE ACUTE MALNUTRITION", () => {
    expect(classifyCase(f({ muacMm: 120 }), 24).classification).toBe("MODERATE ACUTE MALNUTRITION");
  });

  it("cough + fever both present -> pneumonia wins (most severe relevant)", () => {
    expect(classifyCase(f({ hasCough: true, breathsPerMin: 46, hasFever: true }), 24).classification).toBe("PNEUMONIA");
  });

  it("no assessable findings -> NO CLASSIFICATION", () => {
    expect(classifyCase(f({}), 24).classification).toBe("NO CLASSIFICATION");
  });
});
