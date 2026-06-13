import { describe, it, expect } from "vitest";
import type { LlmPort, CompletionRequest, CompletionResult } from "@lifeline/core";
import { FakeRagPort, type RagHit } from "@lifeline/core";
import { runCase } from "./case-runner.js";

// Fake LLM: returns the same scripted JSON for every (two-stage) extraction call.
class ExtractingLlm implements LlmPort {
  readonly requests: CompletionRequest[] = [];
  constructor(private json: string) {}
  async load(): Promise<string> {
    return "m";
  }
  complete(req: CompletionRequest): CompletionResult {
    this.requests.push(req);
    const json = this.json;
    async function* tokens(): AsyncIterable<string> {
      yield json;
    }
    return {
      tokenStream: tokens(),
      toolCalls: Promise.resolve([]),
      text: Promise.resolve(json),
      stats: Promise.resolve(undefined),
    };
  }
  async unload(): Promise<void> {}
}

const coughHit: RagHit = {
  id: "c-imci-cough-or-difficult-breathing-assess",
  content: "Fast breathing thresholds.",
  score: 1,
  sourceId: "imci",
  section: "Cough - assess",
  page: 6,
  type: "protocol",
};
const rag = (): FakeRagPort => new FakeRagPort([coughHit]);
const input = { caseId: "c1", utterance: "fast breathing 52", ageMonths: 24, sex: "f", modelRef: "m" };

const PNEUMONIA_JSON = JSON.stringify({
  hasCoughOrBreathing: true,
  hasDiarrhoea: false,
  hasFever: false,
  hasEarProblem: false,
  hasMalnutritionSign: false,
  unableToDrink: false,
  vomitsEverything: false,
  convulsingNow: false,
  convulsionsHistory: false,
  lethargicOrUnconscious: false,
  breathsPerMin: 52,
  chestIndrawing: false,
  stridorInCalmChild: false,
});

describe("runCase (two-stage extract -> deterministic classify)", () => {
  it("uses grammar-constrained json_schema extraction, not native tools", async () => {
    const llm = new ExtractingLlm(PNEUMONIA_JSON);
    await runCase(input, { llm, rag: rag() });
    expect(llm.requests[0]!.responseFormat?.type).toBe("json_schema");
    expect(llm.requests[0]!.tools).toBeUndefined();
    expect(llm.requests.length).toBe(2); // two-stage
  });

  it("classifies PNEUMONIA from fast breathing (deterministic)", async () => {
    const llm = new ExtractingLlm(PNEUMONIA_JSON);
    const r = await runCase(input, { llm, rag: rag() });
    expect(r.classification).toBe("PNEUMONIA");
    expect(r.classificationCitation).toBe("c-imci-cough-or-difficult-breathing-classify-and-treat");
  });

  it("tolerates <think> wrappers around the JSON", async () => {
    const llm = new ExtractingLlm(`<think>reasoning</think> ${PNEUMONIA_JSON}`);
    const r = await runCase(input, { llm, rag: rag() });
    expect(r.classification).toBe("PNEUMONIA");
  });

  it("attaches RAG + classification citations", async () => {
    const llm = new ExtractingLlm(PNEUMONIA_JSON);
    const r = await runCase(input, { llm, rag: rag() });
    expect(r.citations).toContain("c-imci-cough-or-difficult-breathing-assess");
    expect(r.citations).toContain("c-imci-cough-or-difficult-breathing-classify-and-treat");
  });

  it("falls back to NO CLASSIFICATION on unparseable output with no detectable signals (no crash)", async () => {
    const llm = new ExtractingLlm(`not json at all`);
    const neutral = { ...input, utterance: "the child was brought in today" };
    const r = await runCase(neutral, { llm, rag: rag() });
    expect(r.classification).toBe("NO CLASSIFICATION");
  });
});
