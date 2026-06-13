import * as sdk from "@qvac/sdk";
import type { LlmPort, CompletionRequest, CompletionResult } from "./ports.js";
import type { ToolCall, CompletionStats } from "./types.js";
import { toolCallSchema } from "./types.js";
import type { AuditWriter, AuditEntry } from "./audit.js";
import { CTX, PROVIDER_KEY_PREFIX_LEN } from "./constants.js";

// The ONLY file (with its inference* siblings) that imports @qvac/sdk.
// Implements LlmPort, capturing TTFT/tok-s into the audit log on every call,
// with a consumer-side TTFT fallback when the SDK omits stats (delegated path).
// Shapes verified against the live SDK on 2026-06-13.

const HTTP = /^https?:\/\//;

// modelRef is either a URL (MedPsy GGUF) or a built-in constant NAME. The SDK's
// built-in constants are descriptor OBJECTS ({name, src, registryPath, ...}), so
// when the name matches we must pass that object through, not the name string.
function resolveModelSrc(modelRef: string): unknown {
  if (HTTP.test(modelRef)) return modelRef;
  const builtin = (sdk as Record<string, unknown>)[modelRef];
  return builtin ?? modelRef;
}

interface SdkToolDef {
  name: string;
  description: string;
  parameters: unknown;
}

export interface LlmAdapterDeps {
  audit: AuditWriter;
  reasoningBudgetJunior: number;
}

export class LlmAdapter implements LlmPort {
  constructor(private readonly deps: LlmAdapterDeps) {}

  async load(opts: {
    modelRef: string;
    tools?: boolean;
    ctxSize?: number;
    delegateTo?: string;
  }): Promise<string> {
    const start = Date.now();
    const modelConfig: Record<string, unknown> = {
      ctx_size: opts.ctxSize ?? CTX.JUNIOR,
      tools: opts.tools ?? false,
    };
    const params: Record<string, unknown> = {
      modelSrc: resolveModelSrc(opts.modelRef),
      modelType: "llm",
      modelConfig,
    };
    if (opts.delegateTo) {
      params["delegate"] = {
        providerPublicKey: opts.delegateTo,
        timeout: 60_000,
        fallbackToLocal: true,
      };
    }
    const modelId = await sdk.loadModel(params as Parameters<typeof sdk.loadModel>[0]);
    this.deps.audit.record(
      this.baseEntry({
        op: "loadModel",
        modelRef: opts.modelRef,
        node: opts.delegateTo ? "senior-delegated" : "pi",
        delegated: Boolean(opts.delegateTo),
        providerPublicKeyPrefix: opts.delegateTo
          ? opts.delegateTo.slice(0, PROVIDER_KEY_PREFIX_LEN)
          : null,
        totalMs: Date.now() - start,
      }),
    );
    return modelId;
  }

  complete(req: CompletionRequest): CompletionResult {
    const tools = req.tools?.map(
      (t): SdkToolDef => ({ name: t.name, description: t.description, parameters: t.parameters }),
    );
    const callParams: Record<string, unknown> = {
      modelId: req.modelRef,
      history: req.history,
      stream: true,
    };
    if (tools) callParams["tools"] = tools;
    if (req.responseFormat) {
      callParams["responseFormat"] = {
        type: "json_schema",
        json_schema: { name: req.responseFormat.name, schema: req.responseFormat.schema },
      };
    }
    if (req.reasoningBudget !== undefined) callParams["reasoning_budget"] = req.reasoningBudget;
    if (req.temperature !== undefined) callParams["temperature"] = req.temperature;

    const start = Date.now();
    const result = sdk.completion(callParams as Parameters<typeof sdk.completion>[0]) as {
      tokenStream: AsyncIterable<string>;
      toolCallStream: AsyncIterable<{ call: unknown }>;
      toolCalls: Promise<unknown[]>;
      text: Promise<string>;
      stats: Promise<CompletionStats | undefined>;
    };

    const timing = { firstTokenAt: 0 };
    let markStreamDone = (): void => {};
    const streamDone = new Promise<void>((resolve) => {
      markStreamDone = resolve;
    });
    async function* timedTokens(): AsyncIterable<string> {
      for await (const tok of result.tokenStream) {
        if (!timing.firstTokenAt) timing.firstTokenAt = Date.now();
        yield tok;
      }
      markStreamDone();
    }

    const toolCalls: Promise<ToolCall[]> = result.toolCalls.then((raw) =>
      raw.map((c) => toolCallSchema.parse(c)),
    );

    // Record only after the stream is drained so the measured-TTFT fallback
    // (used when the SDK omits stats, e.g. delegated calls) has a first-token time.
    const stats = Promise.all([streamDone, result.stats]).then(([, s]) => {
      this.recordCompletion(req, s, start, timing.firstTokenAt);
      return s;
    });

    return { tokenStream: timedTokens(), toolCalls, text: result.text, stats };
  }

  async unload(modelRef: string): Promise<void> {
    await sdk.unloadModel({ modelId: modelRef, clearStorage: false } as Parameters<
      typeof sdk.unloadModel
    >[0]);
    this.deps.audit.record(
      this.baseEntry({ op: "unloadModel", modelRef, node: "pi", delegated: false }),
    );
  }

  private recordCompletion(
    req: CompletionRequest,
    stats: CompletionStats | undefined,
    startMs: number,
    firstTokenAt: number,
  ): void {
    const sdkTtft = stats?.timeToFirstToken;
    const measuredTtft = firstTokenAt ? firstTokenAt - startMs : null;
    const ttftMs = sdkTtft ?? measuredTtft;
    const ttftSource = sdkTtft != null ? "sdk" : measuredTtft != null ? "measured" : "none";
    this.deps.audit.record(
      this.baseEntry({
        op: "completion",
        modelRef: req.modelRef,
        node: req.delegated ? "senior-delegated" : "pi",
        delegated: Boolean(req.delegated),
        promptTokens: stats?.promptTokens ?? null,
        generatedTokens: stats?.generatedTokens ?? null,
        cacheTokens: stats?.cacheTokens ?? null,
        ttftMs,
        totalMs: Date.now() - startMs,
        tps: stats?.tokensPerSecond ?? null,
        backendDevice: stats?.backendDevice ?? null,
        sessionId: req.sessionId ?? null,
        caseId: req.caseId ?? null,
        ttftSource,
      }),
    );
  }

  private baseEntry(over: Partial<AuditEntry> & Pick<AuditEntry, "op" | "modelRef" | "node" | "delegated">): AuditEntry {
    return {
      ts: Date.now(),
      promptTokens: null,
      generatedTokens: null,
      cacheTokens: null,
      ttftMs: null,
      totalMs: null,
      tps: null,
      backendDevice: null,
      stopReason: null,
      toolCallsCount: null,
      providerPublicKeyPrefix: null,
      sessionId: null,
      caseId: null,
      ttftSource: "none",
      ...over,
    };
  }
}
