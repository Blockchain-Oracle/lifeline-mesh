import type { EmbedPort, RagPort, RagHit } from "@lifeline/core";
import { RAG } from "@lifeline/core";
import type { Workspace } from "./workspace.js";

// RagPort over the sqlite-wasm Workspace: embed the query, vector-search, return
// typed hits WITH metadata. Distance is ascending (smaller = closer), so we keep
// the topK nearest. MIN_SIMILARITY is applied as a max-distance gate.

export interface RagSearchOptions {
  topK?: number;
  maxDistance?: number;
}

export class WorkspaceRagPort implements RagPort {
  constructor(
    private readonly workspace: Workspace,
    private readonly embed: EmbedPort,
    private readonly opts: RagSearchOptions = {},
  ) {}

  async search({ query, topK }: { query: string; topK: number }): Promise<RagHit[]> {
    const k = topK || this.opts.topK || RAG.TOP_K;
    const { embedding } = await this.embed.embed({ text: query });
    const hits = this.workspace.search(embedding, k);
    const maxDistance = this.opts.maxDistance;
    return maxDistance === undefined ? hits : hits.filter((h) => h.score <= maxDistance);
  }
}
