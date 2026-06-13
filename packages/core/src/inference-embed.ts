import * as sdk from "@qvac/sdk";
import type { EmbedPort } from "./ports.js";
import { RAG } from "./constants.js";

// EmbedPort over @qvac/sdk. Loads a built-in embedding model (EmbeddingGemma,
// 768-dim by default) and embeds text. Part of the inference* adapter seam.

const HTTP = /^https?:\/\//;

function resolveModelSrc(modelRef: string): unknown {
  if (HTTP.test(modelRef)) return modelRef;
  const builtin = (sdk as Record<string, unknown>)[modelRef];
  return builtin ?? modelRef;
}

export class EmbedAdapter implements EmbedPort {
  private modelId: string | undefined;
  constructor(
    private readonly modelRef: string,
    private readonly dimension: number = RAG.EMBED_DIM,
  ) {}

  async load(): Promise<void> {
    this.modelId = await sdk.loadModel({
      modelSrc: resolveModelSrc(this.modelRef),
      modelType: "embeddings",
    } as unknown as Parameters<typeof sdk.loadModel>[0]);
  }

  // The SDK's embed() is batch: text is string[] and embedding is number[][].
  async embed(opts: { text: string }): Promise<{ embedding: number[] }> {
    if (!this.modelId) await this.load();
    const res = (await sdk.embed({ modelId: this.modelId, text: [opts.text] } as unknown as Parameters<
      typeof sdk.embed
    >[0])) as { embedding: number[][] };
    const first = res.embedding[0];
    if (!first) throw new Error("embed() returned no vector");
    return { embedding: first };
  }

  dim(): number {
    return this.dimension;
  }

  async unload(): Promise<void> {
    if (this.modelId) {
      await sdk.unloadModel({ modelId: this.modelId } as Parameters<typeof sdk.unloadModel>[0]);
      this.modelId = undefined;
    }
  }
}
