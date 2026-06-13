import { describe, it, expect, vi, beforeEach } from "vitest";
import { z } from "zod";

// Mock the SDK so the adapter is tested without native deps.
const loadModel = vi.fn(async (..._a: unknown[]) => "model-1");
const unloadModel = vi.fn(async (..._a: unknown[]) => undefined);
const completion = vi.fn();

vi.mock("@qvac/sdk", () => ({
  loadModel: (...a: unknown[]) => loadModel(...a),
  unloadModel: (...a: unknown[]) => unloadModel(...a),
  completion: (...a: unknown[]) => completion(...a),
  QWEN3_1_7B_INST_Q4: "builtin://qwen3-1.7b",
}));

const { LlmAdapter } = await import("./inference-llm.js");
const { AuditWriter, MemorySink } = await import("./audit.js");

async function* gen(items: string[]) {
  for (const i of items) yield i;
}

function makeResult(opts: {
  tokens: string[];
  toolCalls?: unknown[];
  stats?: Record<string, number | string> | undefined;
}) {
  return {
    tokenStream: gen(opts.tokens),
    toolCallStream: gen([]),
    toolCalls: Promise.resolve(opts.toolCalls ?? []),
    text: Promise.resolve(opts.tokens.join("")),
    stats: Promise.resolve(opts.stats),
  };
}

let sink: InstanceType<typeof MemorySink>;
let audit: InstanceType<typeof AuditWriter>;
let adapter: InstanceType<typeof LlmAdapter>;

beforeEach(() => {
  loadModel.mockClear();
  unloadModel.mockClear();
  completion.mockReset();
  sink = new MemorySink();
  audit = new AuditWriter(sink);
  adapter = new LlmAdapter({ audit, reasoningBudgetJunior: 0 });
});

describe("LlmAdapter", () => {
  it("resolves a built-in constant name to its SDK value on load", async () => {
    await adapter.load({ modelRef: "QWEN3_1_7B_INST_Q4", tools: true });
    expect(loadModel).toHaveBeenCalledTimes(1);
    const arg = loadModel.mock.calls[0]![0] as { modelSrc: string; modelConfig: { tools: boolean } };
    expect(arg.modelSrc).toBe("builtin://qwen3-1.7b");
    expect(arg.modelConfig.tools).toBe(true);
  });

  it("passes a URL modelRef through unchanged", async () => {
    await adapter.load({ modelRef: "https://hf/medpsy.gguf" });
    const arg = loadModel.mock.calls[0]![0] as { modelSrc: string };
    expect(arg.modelSrc).toBe("https://hf/medpsy.gguf");
  });

  it("sets the delegate option and tags the audit entry when delegating", async () => {
    await adapter.load({ modelRef: "https://hf/medpsy-4b.gguf", delegateTo: "abcdef1234567890" });
    const arg = loadModel.mock.calls[0]![0] as { delegate?: { providerPublicKey: string; fallbackToLocal: boolean } };
    expect(arg.delegate?.providerPublicKey).toBe("abcdef1234567890");
    expect(arg.delegate?.fallbackToLocal).toBe(true);
    const entry = JSON.parse(sink.lines.at(-1)!);
    expect(entry.delegated).toBe(true);
    expect(entry.providerPublicKeyPrefix).toBe("abcdef12");
  });

  it("streams tokens and writes a completion audit entry with SDK stats", async () => {
    completion.mockReturnValue(
      makeResult({ tokens: ["he", "llo"], stats: { timeToFirstToken: 100, tokensPerSecond: 50, promptTokens: 5, generatedTokens: 2, backendDevice: "gpu" } }),
    );
    const r = adapter.complete({ modelRef: "model-1", history: [{ role: "user", content: "hi" }] });
    let text = "";
    for await (const t of r.tokenStream) text += t;
    await r.stats;
    expect(text).toBe("hello");
    const entry = JSON.parse(sink.lines.at(-1)!);
    expect(entry.op).toBe("completion");
    expect(entry.ttftMs).toBe(100);
    expect(entry.ttftSource).toBe("sdk");
    expect(entry.tps).toBe(50);
  });

  it("falls back to measured TTFT when the SDK omits stats", async () => {
    completion.mockReturnValue(makeResult({ tokens: ["x"], stats: undefined }));
    const r = adapter.complete({ modelRef: "model-1", history: [{ role: "user", content: "hi" }], delegated: true });
    for await (const _ of r.tokenStream) void _;
    await r.stats;
    const entry = JSON.parse(sink.lines.at(-1)!);
    expect(entry.ttftSource).toBe("measured");
    expect(entry.ttftMs).toBeGreaterThanOrEqual(0);
    expect(entry.node).toBe("senior-delegated");
    expect(entry.delegated).toBe(true);
  });

  it("forwards zod tool defs and reasoning_budget to the SDK", async () => {
    completion.mockReturnValue(makeResult({ tokens: ["ok"], stats: {} }));
    const tool = { name: "t", description: "d", parameters: z.object({ x: z.string() }) };
    const r = adapter.complete({ modelRef: "m", history: [], tools: [tool], reasoningBudget: 0 });
    for await (const _ of r.tokenStream) void _;
    await r.stats;
    const arg = completion.mock.calls[0]![0] as { tools: { parameters: unknown }[]; reasoning_budget: number };
    expect(arg.tools[0]!.parameters).toBe(tool.parameters);
    expect(arg.reasoning_budget).toBe(0);
  });

  it("validates tool calls through the schema", async () => {
    completion.mockReturnValue(
      makeResult({ tokens: ["x"], toolCalls: [{ id: "c1", name: "get_weather", arguments: { city: "Lagos" }, raw: "{}" }], stats: {} }),
    );
    const r = adapter.complete({ modelRef: "m", history: [] });
    for await (const _ of r.tokenStream) void _;
    const calls = await r.toolCalls;
    expect(calls[0]!.name).toBe("get_weather");
    expect(calls[0]!.arguments).toEqual({ city: "Lagos" });
  });

  it("records an unload audit entry", async () => {
    await adapter.unload("model-1");
    expect(unloadModel).toHaveBeenCalledTimes(1);
    expect(JSON.parse(sink.lines.at(-1)!).op).toBe("unloadModel");
  });
});
