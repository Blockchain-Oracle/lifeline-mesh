import { describe, it, expect } from "vitest";
import type { LlmPort, CompletionRequest, CompletionResult } from "@lifeline/core";
import { generateReferral } from "./referral.js";
import { renderMarkdown } from "./referral-render.js";
import type { CaseResult } from "./case-runner.js";

class JsonLlm implements LlmPort {
  readonly requests: CompletionRequest[] = [];
  constructor(private out: string) {}
  async load(): Promise<string> {
    return "m";
  }
  complete(req: CompletionRequest): CompletionResult {
    this.requests.push(req);
    const out = this.out;
    async function* t(): AsyncIterable<string> {
      yield out;
    }
    return { tokenStream: t(), toolCalls: Promise.resolve([]), text: Promise.resolve(out), stats: Promise.resolve(undefined) };
  }
  async unload(): Promise<void> {}
}

const result: CaseResult = {
  caseId: "c1",
  classification: "PNEUMONIA",
  rationale: "Fast breathing 52/min.",
  categories: ["cough_or_breathing"],
  findings: { hasCough: true, breathsPerMin: 52 },
  citations: ["c-imci-cough-or-difficult-breathing-classify-and-treat"],
  classificationCitation: "c-imci-cough-or-difficult-breathing-classify-and-treat",
};

const VALID = JSON.stringify({
  situation: "2-year-old with fast breathing referred.",
  background: "Cough and fast breathing for 3 days.",
  assessment: "IMCI: PNEUMONIA.",
  recommendation: "First dose amoxicillin given; refer for review.",
});

describe("generateReferral", () => {
  it("uses a tools-less json_schema completion", async () => {
    const llm = new JsonLlm(VALID);
    await generateReferral(result, 24, "f", { llm, modelRef: "m" });
    expect(llm.requests[0]!.responseFormat?.type).toBe("json_schema");
    expect(llm.requests[0]!.tools).toBeUndefined();
  });

  it("parses a valid SBAR note", async () => {
    const note = await generateReferral(result, 24, "f", { llm: new JsonLlm(VALID), modelRef: "m" });
    expect(note.assessment).toContain("PNEUMONIA");
    expect(note.recommendation).toContain("amoxicillin");
  });

  it("falls back to a deterministic note on malformed output", async () => {
    const note = await generateReferral(result, 24, "f", { llm: new JsonLlm("garbage"), modelRef: "m" });
    expect(note.situation).toContain("PNEUMONIA");
    expect(note.recommendation).toContain("district hospital");
  });
});

describe("renderMarkdown", () => {
  it("renders all SBAR sections with classification, patient, and cited sources", async () => {
    const note = await generateReferral(result, 24, "f", { llm: new JsonLlm(VALID), modelRef: "m" });
    const md = renderMarkdown(note, {
      classification: "PNEUMONIA",
      ageMonths: 24,
      sex: "f",
      citations: [{ chunkId: "x", label: "WHO IMCI p.6", sourceTitle: "WHO IMCI", section: "Cough", page: 6, quote: "" }],
      dateIso: "2026-06-13",
    });
    expect(md).toContain("## Situation");
    expect(md).toContain("## Recommendation");
    expect(md).toContain("PNEUMONIA");
    expect(md).toContain("WHO IMCI p.6");
    expect(md).toMatch(/not a substitute for clinical judgement/i);
  });
});
