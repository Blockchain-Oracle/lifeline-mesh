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
const cases = JSON.parse(readFileSync(join(ROOT, "scripts/bench/eval-cases.json"), "utf8"));

const audit = new AuditWriter(new MemorySink());
const llm = new LlmAdapter({ audit, reasoningBudgetJunior: 0 });
const embed = new EmbedAdapter(MODELS.EMBEDDING, RAG.EMBED_DIM);
const ws = await Workspace.create(RAG.EMBED_DIM, join(ROOT, "kb/workspace.sqlite"));
const ragPort = new WorkspaceRagPort(ws, embed);

const modelId = await llm.load({ modelRef, tools: true, ctxSize: 4096 });

let correct = 0;
let usedTools = 0;
let toolErrorCases = 0;
const rows = [];
for (const c of cases) {
  const r = await runCase(
    { caseId: c.id, utterance: c.utterance, ageMonths: c.ageMonths, sex: c.sex, modelRef: modelId },
    { llm, rag: ragPort },
  );
  const ok = r.classification === c.expectedClassification;
  if (ok) correct++;
  if (r.toolInvocations.length > 0) usedTools++;
  if (r.toolErrors > 0) toolErrorCases++;
  rows.push({ id: c.id, expected: c.expectedClassification, got: r.classification ?? "(none)", ok, tools: r.toolInvocations.length, toolErr: r.toolErrors });
  console.log(`${ok ? "PASS" : "FAIL"} ${c.id}: expected="${c.expectedClassification}" got="${r.classification ?? "(none)"}" tools=${r.toolInvocations.length} err=${r.toolErrors}`);
}

await llm.unload(modelId);
await embed.unload();
ws.close();

const n = cases.length;
console.log("\n=== SUMMARY ===");
console.log(`model: ${modelRef}`);
console.log(`classification accuracy: ${correct}/${n} = ${((correct / n) * 100).toFixed(0)}%`);
console.log(`cases that used >=1 tool: ${usedTools}/${n} = ${((usedTools / n) * 100).toFixed(0)}%  (tool-adherence gate: >=80%)`);
console.log(`cases with a tool error: ${toolErrorCases}/${n}`);
process.exit(0);
