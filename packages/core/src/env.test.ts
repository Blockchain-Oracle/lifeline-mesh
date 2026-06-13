import { describe, it, expect } from "vitest";
import { loadEnv } from "./env.js";

describe("loadEnv", () => {
  it("defaults LOG_LEVEL to info and TTS_BACKEND to supertonic when absent", () => {
    const env = loadEnv({});
    expect(env.LOG_LEVEL).toBe("info");
    expect(env.TTS_BACKEND).toBe("supertonic");
    expect(env.QVAC_HYPERSWARM_SEED).toBeUndefined();
  });

  it("accepts a valid 64-hex seed", () => {
    const seed = "a".repeat(64);
    expect(loadEnv({ QVAC_HYPERSWARM_SEED: seed }).QVAC_HYPERSWARM_SEED).toBe(seed);
  });

  it("rejects a non-64-hex seed with a message naming the variable", () => {
    expect(() => loadEnv({ QVAC_HYPERSWARM_SEED: "xyz" })).toThrow(/QVAC_HYPERSWARM_SEED/);
  });

  it("rejects an invalid LOG_LEVEL", () => {
    expect(() => loadEnv({ LOG_LEVEL: "loud" })).toThrow(/LOG_LEVEL/);
  });

  it("rejects an invalid TTS_BACKEND", () => {
    expect(() => loadEnv({ TTS_BACKEND: "festival" })).toThrow(/TTS_BACKEND/);
  });
});
