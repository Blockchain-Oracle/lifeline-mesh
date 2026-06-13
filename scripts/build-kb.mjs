#!/usr/bin/env node
// Build the committed KB: curated markdown -> kb/chunks/<source>.ndjson + kb/manifest.json.
// Uses the tested chunker from @lifeline/rag (run `pnpm build` first).
import { readFileSync, writeFileSync, mkdirSync, createReadStream } from "node:fs";
import { createHash } from "node:crypto";
import { join, dirname } from "node:path";

const ROOT = join(dirname(new URL(import.meta.url).pathname), "..");
const { chunk } = await import(join(ROOT, "packages/rag/dist/index.js"));
const KB_VERSION = "lifeline-v1";

const SOURCES = [
  {
    id: "imci",
    title: "WHO IMCI Chart Booklet (March 2014)",
    url: "https://cdn.who.int/media/docs/default-source/mca-documents/child/imci-integrated-management-of-childhood-illness/imci-in-service-training/imci-chart-booklet.pdf",
    licence: "© WHO 2014 — reproduced for non-commercial research/demonstration use",
    pdf: "kb/source/imci-chartbook.pdf",
    curated: "kb/source/imci-curated.md",
  },
];

function sha256(path) {
  return new Promise((resolve, reject) => {
    const h = createHash("sha256");
    createReadStream(path)
      .on("data", (d) => h.update(d))
      .on("end", () => resolve(h.digest("hex")))
      .on("error", reject);
  });
}

async function main() {
  mkdirSync(join(ROOT, "kb/chunks"), { recursive: true });
  const manifestSources = [];
  for (const src of SOURCES) {
    const md = readFileSync(join(ROOT, src.curated), "utf8");
    const chunks = chunk(md, { sourceId: src.id, sourceTitle: src.title });
    const ndjson = chunks.map((c) => JSON.stringify(c)).join("\n") + "\n";
    writeFileSync(join(ROOT, `kb/chunks/${src.id}.ndjson`), ndjson);
    manifestSources.push({
      id: src.id,
      title: src.title,
      url: src.url,
      licence: src.licence,
      sha256: await sha256(join(ROOT, src.pdf)),
      chunkCount: chunks.length,
    });
    console.log(`${src.id}: ${chunks.length} chunks -> kb/chunks/${src.id}.ndjson`);
  }
  const manifest = { version: KB_VERSION, builtFrom: "kb/source", sources: manifestSources };
  writeFileSync(join(ROOT, "kb/manifest.json"), JSON.stringify(manifest, null, 2) + "\n");
  console.log(`manifest -> kb/manifest.json`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
