import type {
  LlmPort,
  SttPort,
  TtsPort,
  EmbedPort,
  RagPort,
  RagHit,
  MeshPort,
  CompletionRequest,
  CompletionResult,
} from "./ports.js";
import type { ToolCall, CompletionStats, MeshState } from "./types.js";

// Deterministic in-memory fakes. No @qvac/sdk import. Everything downstream
// tests against these so the suite runs fast, offline, with no native deps.

async function* fromArray(items: string[]): AsyncIterable<string> {
  for (const it of items) yield it;
}

export interface FakeLlmScript {
  tokens: string[];
  toolCalls?: ToolCall[];
  stats?: CompletionStats;
}

export class FakeLlmPort implements LlmPort {
  readonly calls: CompletionRequest[] = [];
  constructor(private script: FakeLlmScript = { tokens: ["ok"] }) {}

  setScript(script: FakeLlmScript): void {
    this.script = script;
  }

  async load(): Promise<string> {
    return "fake-model";
  }

  complete(req: CompletionRequest): CompletionResult {
    this.calls.push(req);
    const { tokens, toolCalls = [], stats } = this.script;
    return {
      tokenStream: fromArray(tokens),
      toolCalls: Promise.resolve(toolCalls),
      text: Promise.resolve(tokens.join("")),
      stats: Promise.resolve(stats),
    };
  }

  async unload(): Promise<void> {}
}

export class FakeSttPort implements SttPort {
  constructor(private text = "child two years fever fast breathing") {}
  async transcribe(): Promise<{ text: string; durationMs: number }> {
    return { text: this.text, durationMs: 1200 };
  }
}

export class FakeTtsPort implements TtsPort {
  async speak(): Promise<{ audio: Uint8Array }> {
    return { audio: new Uint8Array([1, 2, 3]) };
  }
}

export class FakeEmbedPort implements EmbedPort {
  constructor(private dimension = 768) {}
  async embed(opts: { text: string }): Promise<{ embedding: number[] }> {
    // Deterministic pseudo-embedding from char codes — stable for tests.
    const v = new Array<number>(this.dimension).fill(0);
    for (let i = 0; i < opts.text.length; i++) {
      const idx = opts.text.charCodeAt(i) % this.dimension;
      v[idx] = (v[idx] ?? 0) + 1;
    }
    return { embedding: v };
  }
  dim(): number {
    return this.dimension;
  }
}

export class FakeRagPort implements RagPort {
  constructor(private hits: RagHit[] = []) {}
  seed(hits: RagHit[]): void {
    this.hits = hits;
  }
  async search(opts: { query: string; topK: number }): Promise<RagHit[]> {
    // Rank by naive term overlap so the demo query is deterministic.
    const terms = opts.query.toLowerCase().split(/\s+/);
    return [...this.hits]
      .map((h) => ({
        h,
        score: terms.filter((t) => h.content.toLowerCase().includes(t)).length,
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, opts.topK)
      .map(({ h, score }) => ({ ...h, score }));
  }
}

export class FakeMeshPort implements MeshPort {
  constructor(private reachable = true) {}
  setReachable(v: boolean): void {
    this.reachable = v;
  }
  async heartbeat(): Promise<MeshState> {
    return this.reachable
      ? { status: "linked", latencyMs: 12, checkedAtMs: 0 }
      : { status: "offline", checkedAtMs: 0 };
  }
  async startProvider(): Promise<{ publicKey: string }> {
    return { publicKey: "fake-public-key" };
  }
  async stopProvider(): Promise<void> {}
}
