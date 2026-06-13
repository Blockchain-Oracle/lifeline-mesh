import { chunkSchema, chunkTypeSchema, type Chunk, type ChunkType } from "./manifest.js";

// Section-aware chunker for CURATED markdown (see ADR-005): one chunk per
// "## Section" block, with a metadata line `<!-- page: N | type: T -->` directly
// under the header. Curation (not naive PDF splitting) keeps protocol tables intact.
// Deterministic: same input -> same chunk ids and boundaries.

export interface ChunkMeta {
  sourceId: string;
  sourceTitle: string;
}

const HEADER = /^##\s+(.+?)\s*$/;
const META = /^<!--\s*page:\s*(\d+)\s*\|\s*type:\s*([a-z-]+)\s*-->\s*$/;

function slug(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function chunk(markdown: string, meta: ChunkMeta): Chunk[] {
  const lines = markdown.split("\n");
  const chunks: Chunk[] = [];
  const seen = new Set<string>();

  let current: { section: string; page: number; type: ChunkType; body: string[] } | null = null;

  const flush = (): void => {
    if (!current) return;
    const content = current.body.join("\n").trim();
    if (content.length === 0) return;
    const base = `c-${meta.sourceId}-${slug(current.section)}`;
    let id = base;
    let n = 2;
    while (seen.has(id)) id = `${base}-${n++}`;
    seen.add(id);
    chunks.push(
      chunkSchema.parse({
        id,
        content,
        sourceId: meta.sourceId,
        sourceTitle: meta.sourceTitle,
        section: current.section,
        page: current.page,
        type: current.type,
      }),
    );
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] ?? "";
    const h = HEADER.exec(line);
    if (h) {
      flush();
      const next = lines[i + 1] ?? "";
      const m = META.exec(next);
      if (!m) {
        throw new Error(`Section "${h[1]}" is missing its "<!-- page: N | type: T -->" metadata line`);
      }
      current = {
        section: h[1]!,
        page: Number(m[1]),
        type: chunkTypeSchema.parse(m[2]),
        body: [],
      };
      i++; // consume the metadata line
      continue;
    }
    if (current) current.body.push(line);
  }
  flush();
  return chunks;
}
