#!/usr/bin/env node
// Live end-to-end demo of one case through the full Lifeline Mesh pipeline:
// RAG protocol retrieval -> MedPsy structured extraction -> deterministic IMCI
// classification -> resolved WHO citation. Run after `pnpm build`.
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";

const ROOT = join(dirname(new URL(import.meta.url).pathname), "..");
const core = await import(join(ROOT, "packages/core/dist/index.js"));
const rag = await import(join(ROOT, "packages/rag/dist/index.js"));
const agents = await import(join(ROOT, "packages/agents/dist/index.js"));

const { LlmAdapter, EmbedAdapter, AuditWriter, MODELS, RAG } = core;
const { Workspace, WorkspaceRagPort, CitationResolver } = rag;
const { runCase } = agents;

const utterance =
  process.argv[2] ||
  "Child two years old, fever for three days, breathing fast, I counted 52 breaths in one minute, and she is not eating well.";
const ageMonths = Number(process.env.AGE_MONTHS || 24);

const chunks = readFileSync(join(ROOT, "kb/chunks/imci.ndjson"), "utf8").trim().split("\n").map((l) => JSON.parse(l));
const resolver = new CitationResolver(chunks);

const audit = new AuditWriter(join(ROOT, "submission/demo-audit.ndjson"));
const llm = new LlmAdapter({ audit, reasoningBudgetJunior: 0 });
const embed = new EmbedAdapter(MODELS.EMBEDDING, RAG.EMBED_DIM);
const ws = await Workspace.create(RAG.EMBED_DIM, join(ROOT, "kb/workspace.sqlite"));
const ragPort = new WorkspaceRagPort(ws, embed);

const modelId = await llm.load({ modelRef: MODELS.JUNIOR_LLM_URL, tools: true, ctxSize: 8192 });

const line = "─".repeat(72);
console.log(`\n${line}`);
console.log("LIFELINE MESH — offline IMCI assessment (junior node, MedPsy-1.7B)");
console.log(line);
console.log(`\n🧑 CHW reports (age ${ageMonths} months):\n   "${utterance}"\n`);

const t0 = Date.now();
const result = await runCase(
  { caseId: "demo-1", utterance, ageMonths, sex: "f", modelRef: modelId },
  { llm, rag: ragPort },
);
const ms = Date.now() - t0;

console.log(`📚 Protocol pages retrieved (offline RAG):`);
for (const id of result.citations) {
  try {
    const c = resolver.resolve(id);
    console.log(`   • ${c.label}`);
  } catch {
    /* rag-hit ids without a chunk entry */
  }
}
console.log(`\n🔎 Symptom categories assessed: ${result.categories.join(", ") || "(none)"}`);
console.log(`\n🩺 IMCI CLASSIFICATION:  ${result.classification}`);
console.log(`   Why: ${result.rationale}`);
const cite = resolver.resolve(result.classificationCitation);
console.log(`   Source: ${cite.label}`);
console.log(`\n⏱  ${(ms / 1000).toFixed(1)}s, fully on-device, 0 bytes to the cloud.`);
console.log(`${line}\n`);

await llm.unload(modelId);
await embed.unload();
ws.close();
process.exit(0);
