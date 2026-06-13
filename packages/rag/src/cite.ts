import type { RagHit } from "@lifeline/core";
import type { Chunk } from "./ingest/manifest.js";

// Turns a retrieved chunk into a human-readable, verifiable citation:
// "WHO IMCI Chart Booklet (March 2014) · p.6 · §Cough or difficult breathing — classify and treat".

export interface Citation {
  chunkId: string;
  label: string;
  sourceTitle: string;
  section: string;
  page: number;
  quote: string;
}

const QUOTE_MAX = 240;

export class CitationNotFoundError extends Error {
  constructor(chunkId: string) {
    super(`No chunk found for citation id "${chunkId}"`);
    this.name = "CitationNotFoundError";
  }
}

export class CitationResolver {
  private readonly byId = new Map<string, Chunk>();

  constructor(chunks: Chunk[]) {
    for (const c of chunks) this.byId.set(c.id, c);
  }

  resolve(chunkId: string): Citation {
    const c = this.byId.get(chunkId);
    if (!c) throw new CitationNotFoundError(chunkId);
    return {
      chunkId: c.id,
      label: `${c.sourceTitle} · p.${c.page} · §${c.section}`,
      sourceTitle: c.sourceTitle,
      section: c.section,
      page: c.page,
      quote: c.content.length > QUOTE_MAX ? c.content.slice(0, QUOTE_MAX).trimEnd() + "…" : c.content,
    };
  }

  fromHit(hit: RagHit): Citation {
    return this.resolve(hit.id);
  }
}
