#!/usr/bin/env node
// Build the vector DB on the laptop: embed committed chunks with the real SDK
// embedding model and write kb/workspace.sqlite (shipped to the Pi as-is).
// Run after `pnpm build` and `node scripts/build-kb.mjs`.
import { readFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";

const ROOT = join(dirname(new URL(import.meta.url).pathname), "..");
const core = await import(join(ROOT, "packages/core/dist/index.js"));
const rag = await import(join(ROOT, "packages/rag/dist/index.js"));

const { EmbedAdapter, MODELS, RAG } = core;
const { Workspace } = rag;

async function main() {
  const embed = new EmbedAdapter(MODELS.EMBEDDING, RAG.EMBED_DIM);
  const ws = await Workspace.create(RAG.EMBED_DIM);

  const chunkDir = join(ROOT, "kb/chunks");
  const files = readdirSync(chunkDir).filter((f) => f.endsWith(".ndjson"));
  let total = 0;
  for (const f of files) {
    const chunks = readFileSync(join(chunkDir, f), "utf8").trim().split("\n").map((l) => JSON.parse(l));
    const embedded = [];
    for (const c of chunks) {
      const { embedding } = await embed.embed({ text: `${c.section}\n${c.content}` });
      embedded.push({ ...c, embedding });
    }
    ws.upsert(embedded);
    total += embedded.length;
    console.log(`${f}: embedded ${embedded.length} chunks`);
  }
  ws.index();
  const out = join(ROOT, "kb/workspace.sqlite");
  ws.saveTo(out);
  ws.close();
  await embed.unload();
  console.log(`Wrote ${total} embedded chunks -> kb/workspace.sqlite`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
