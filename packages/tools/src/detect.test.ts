import { describe, it, expect } from "vitest";
import { detectCategories } from "./detect.js";

describe("detectCategories (deterministic safety net)", () => {
  it("flags breathing from a counted rate even if 'cough' is absent", () => {
    expect(detectCategories("fever three days, breathing fast, 52 breaths in one minute")).toContain("cough_or_breathing");
  });
  it("flags fever and breathing together", () => {
    const c = detectCategories("fever and breathing fast");
    expect(c).toContain("fever");
    expect(c).toContain("cough_or_breathing");
  });
  it("flags diarrhoea", () => {
    expect(detectCategories("loose watery stools for two days")).toContain("diarrhoea");
  });
  it("flags ear problem", () => {
    expect(detectCategories("ear pain and discharge")).toContain("ear_problem");
  });
  it("flags malnutrition from MUAC", () => {
    expect(detectCategories("MUAC is 120 mm")).toContain("malnutrition");
  });
  it("returns nothing for an unrelated utterance", () => {
    expect(detectCategories("the child seems generally well")).toHaveLength(0);
  });
});
