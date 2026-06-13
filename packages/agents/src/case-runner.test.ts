import { describe, it, expect } from "vitest";
import type { LlmPort, CompletionRequest, CompletionResult, ToolCall } from "@lifeline/core";
import { FakeRagPort, type RagHit } from "@lifeline/core";
import { runCase } from "./case-runner.js";

interface Turn {
  text: string;
  toolCalls?: ToolCall[];
}

// Scripted LLM that returns one queued Turn per complete() call.
class ScriptedLlm implements LlmPort {
  readonly requests: CompletionRequest[] = [];
  constructor(private turns: Turn[]) {}
  async load(): Promise<string> {
    return "m";
  }
  complete(req: CompletionRequest): CompletionResult {
    this.requests.push(req);
    const turn = this.turns.shift() ?? { text: "done", toolCalls: [] };
    async function* tokens(): AsyncIterable<string> {
      yield turn.text;
    }
    return {
      tokenStream: tokens(),
      toolCalls: Promise.resolve(turn.toolCalls ?? []),
      text: Promise.resolve(turn.text),
      stats: Promise.resolve(undefined),
    };
  }
  async unload(): Promise<void> {}
}

const coughHit: RagHit = {
  id: "c-imci-cough-or-difficult-breathing-assess",
  content: "Fast breathing: 2-12 months 50/min; 12 months-5 years 40/min.",
  score: 1,
  sourceId: "imci",
  section: "Cough — assess",
  page: 6,
  type: "protocol",
};

function rag(): FakeRagPort {
  return new FakeRagPort([coughHit]);
}

const baseInput = { caseId: "c1", utterance: "fever, fast breathing 52", ageMonths: 24, sex: "f", modelRef: "m" };

describe("runCase", () => {
  it("runs the tool loop and classifies from the tool result", async () => {
    const llm = new ScriptedLlm([
      { text: "assessing", toolCalls: [{ id: "t1", name: "classify_cough", arguments: { ageMonths: 24, breathsPerMin: 52 } }] },
      { text: "Classification: PNEUMONIA. Give oral amoxicillin for 5 days." },
    ]);
    const result = await runCase(baseInput, { llm, rag: rag() });
    expect(result.classification).toBe("PNEUMONIA");
    expect(result.stopReason).toBe("answered");
    expect(result.toolErrors).toBe(0);
  });

  it("attaches RAG + tool citations", async () => {
    const llm = new ScriptedLlm([
      { text: "x", toolCalls: [{ id: "t1", name: "classify_cough", arguments: { ageMonths: 24, breathsPerMin: 52 } }] },
      { text: "PNEUMONIA" },
    ]);
    const result = await runCase(baseInput, { llm, rag: rag() });
    expect(result.citations).toContain("c-imci-cough-or-difficult-breathing-assess");
    expect(result.citations).toContain("c-imci-cough-or-difficult-breathing-classify-and-treat");
  });

  it("counts a failed tool call as a tool error and continues", async () => {
    const llm = new ScriptedLlm([
      { text: "x", toolCalls: [{ id: "t1", name: "bogus_tool", arguments: {} }] },
      { text: "COUGH OR COLD after retry" },
    ]);
    const result = await runCase(baseInput, { llm, rag: rag() });
    expect(result.toolErrors).toBe(1);
    expect(result.stopReason).toBe("answered");
  });

  it("surfaces a danger-sign classification via the tool", async () => {
    const llm = new ScriptedLlm([
      { text: "x", toolCalls: [{ id: "t1", name: "classify_cough", arguments: { ageMonths: 10, breathsPerMin: 58, stridorInCalmChild: true } }] },
      { text: "refer urgently" },
    ]);
    const result = await runCase(baseInput, { llm, rag: rag() });
    expect(result.classification).toBe("SEVERE PNEUMONIA OR VERY SEVERE DISEASE");
  });

  it("stops at max turns if the model keeps calling tools", async () => {
    const loop: Turn[] = Array.from({ length: 10 }, () => ({
      text: "again",
      toolCalls: [{ id: "t", name: "check_danger_signs", arguments: {} }] as ToolCall[],
    }));
    const llm = new ScriptedLlm(loop);
    const result = await runCase(baseInput, { llm, rag: rag() });
    expect(result.stopReason).toBe("max-turns");
  });

  it("passes the clinical tools and reasoning_budget 0 to the model", async () => {
    const llm = new ScriptedLlm([{ text: "PNEUMONIA" }]);
    await runCase(baseInput, { llm, rag: rag() });
    expect(llm.requests[0]!.tools!.length).toBeGreaterThan(0);
    expect(llm.requests[0]!.reasoningBudget).toBe(0);
  });
});
