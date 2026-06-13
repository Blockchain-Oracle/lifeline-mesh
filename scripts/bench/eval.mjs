#!/usr/bin/env node
// Live eval: run the case runner against a REAL model over the 20-case IMCI set.
// Measures classification accuracy, tool-call adherence, and tool error rate.
// Usage: node scripts/bench/eval.mjs [modelRefOrUrl]
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";

const ROOT = join(dirname(new URL(import.meta.url).pathname), "..", "..");
const core = await import(join(ROOT, "packages/core/dist/index.js"));
const rag = await import(join(ROOT, "packages/rag/dist/index.js"));
const agents = await import(join(ROOT, "packages/agents/dist/index.js"));

const { LlmAdapter, EmbedAdapter, AuditWriter, MemorySink, MODELS, RAG } = core;
const { Workspace, WorkspaceRagPort } = rag;
const { runCase } = agents;

const modelRef = process.argv[2] || MODELS.JUNIOR_LLM_URL;
const limit = process.env.EVAL_LIMIT ? Number(process.env.EVAL_LIMIT) : Infinity;
const ctxSize = process.env.EVAL_CTX ? Number(process.env.EVAL_CTX) : 8192;
const cases = JSON.parse(readFileSync(join(ROOT, "scripts/bench/eval-cases.json"), "utf8")).slice(0, limit);

const audit = new AuditWriter(new MemorySink());
const llm = new LlmAdapter({ audit, reasoningBudgetJunior: 0 });
const embed = new EmbedAdapter(MODELS.EMBEDDING, RAG.EMBED_DIM);
const ws = await Workspace.create(RAG.EMBED_DIM, join(ROOT, "kb/workspace.sqlite"));
const ragPort = new WorkspaceRagPort(ws, embed);

const modelId = await llm.load({ modelRef, tools: true, ctxSize });

let correct = 0;
let extracted = 0;
let cited = 0;
for (const c of cases) {
  const r = await runCase(
    { caseId: c.id, utterance: c.utterance, ageMonths: c.ageMonths, sex: c.sex, modelRef: modelId },
    { llm, rag: ragPort },
  );
  const ok = r.classification === c.expectedClassification;
  if (ok) correct++;
  if (Object.keys(r.findings).length > 0) extracted++;
  if (r.citations.includes(r.classificationCitation)) cited++;
  console.log(`${ok ? "PASS" : "FAIL"} ${c.id}: expected="${c.expectedClassification}" got="${r.classification}" [${r.categories.join("+")}]`);
}

await llm.unload(modelId);
await embed.unload();
ws.close();

const n = cases.length;
console.log("\n=== SUMMARY ===");
console.log(`model: ${modelRef}`);
console.log(`classification accuracy: ${correct}/${n} = ${((correct / n) * 100).toFixed(0)}%`);
console.log(`valid extraction: ${extracted}/${n}`);
console.log(`classification cited: ${cited}/${n}`);
process.exit(0);
