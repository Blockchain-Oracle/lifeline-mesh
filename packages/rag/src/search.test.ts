import { describe, it, expect, beforeAll } from "vitest";
import { FakeEmbedPort } from "@lifeline/core";
import { Workspace, type EmbeddedChunk } from "./workspace.js";
import { WorkspaceRagPort } from "./search.js";
import type { Chunk } from "./ingest/manifest.js";

const DIM = 768;
const embed = new FakeEmbedPort(DIM);

const chunks: Chunk[] = [
  { id: "c1", content: "fast breathing chest indrawing pneumonia amoxicillin", sourceId: "imci", sourceTitle: "WHO IMCI", section: "Cough classify", page: 6, type: "treatment" },
  { id: "c2", content: "diarrhoea dehydration skin pinch ORS plan", sourceId: "imci", sourceTitle: "WHO IMCI", section: "Diarrhoea", page: 7, type: "protocol" },
  { id: "c3", content: "fever malaria stiff neck paracetamol", sourceId: "imci", sourceTitle: "WHO IMCI", section: "Fever", page: 8, type: "protocol" },
];

let ws: Workspace;

beforeAll(async () => {
  ws = await Workspace.create(DIM);
  const embedded: EmbeddedChunk[] = [];
  for (const c of chunks) embedded.push({ ...c, embedding: (await embed.embed({ text: c.content })).embedding });
  ws.upsert(embedded);
  ws.index();
});

describe("WorkspaceRagPort (real sqlite-wasm vector search)", () => {
  it("returns hits carrying citation metadata (page/section/type)", async () => {
    const port = new WorkspaceRagPort(ws, embed);
    const hits = await port.search({ query: chunks[0]!.content, topK: 3 });
    expect(hits.length).toBeGreaterThan(0);
    const top = hits[0]!;
    expect(top).toHaveProperty("page");
    expect(top).toHaveProperty("section");
    expect(typeof top.score).toBe("number");
  });

  it("respects topK", async () => {
    const port = new WorkspaceRagPort(ws, embed);
    const hits = await port.search({ query: "fever", topK: 1 });
    expect(hits.length).toBeLessThanOrEqual(1);
  });

  it("returns hits ordered by ascending distance (nearest first)", async () => {
    const port = new WorkspaceRagPort(ws, embed);
    const hits = await port.search({ query: chunks[0]!.content, topK: 3 });
    for (let i = 1; i < hits.length; i++) {
      expect(hits[i]!.score).toBeGreaterThanOrEqual(hits[i - 1]!.score);
    }
  });

  it("an exact-content query ranks its own chunk first", async () => {
    const port = new WorkspaceRagPort(ws, embed);
    const hits = await port.search({ query: chunks[1]!.content, topK: 3 });
    expect(hits[0]!.id).toBe("c2");
  });
});
