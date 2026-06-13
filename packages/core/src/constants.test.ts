import { describe, it, expect } from "vitest";
import { MODELS, RAG, ESCALATE, AP } from "./constants.js";

describe("constants", () => {
  it("loads MedPsy by URL (no built-in constant exists)", () => {
    expect(MODELS.JUNIOR_LLM_URL).toMatch(/MedPsy-1\.7B-GGUF/);
    expect(MODELS.SENIOR_LLM_URL).toMatch(/MedPsy-4B-GGUF/);
  });

  it("uses the 768-dim EmbeddingGemma by default", () => {
    expect(MODELS.EMBEDDING).toBe("EMBEDDINGGEMMA_300M_BF16");
    expect(RAG.EMBED_DIM).toBe(768);
  });

  it("keeps escalation confidence threshold in (0,1)", () => {
    expect(ESCALATE.CONFIDENCE_THRESHOLD).toBeGreaterThan(0);
    expect(ESCALATE.CONFIDENCE_THRESHOLD).toBeLessThan(1);
  });

  it("advertises the LifelineMesh AP", () => {
    expect(AP.SSID).toBe("LifelineMesh");
    expect(AP.HOSTNAME).toBe("lifeline.local");
  });
});
