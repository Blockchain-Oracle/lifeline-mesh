#!/usr/bin/env node
// arm64 smoke: load the built-in dev model and run one completion through the
// adapter. Proves the @qvac/sdk linux-arm64 native prebuilds load and inference
// works on aarch64 (Raspberry Pi class). Run after `pnpm build`.
import { join, dirname } from "node:path";

const ROOT = join(dirname(new URL(import.meta.url).pathname), "..");
const { LlmAdapter, AuditWriter, MemorySink, MODELS } = await import(
  join(ROOT, "packages/core/dist/index.js")
);

const llm = new LlmAdapter({ audit: new AuditWriter(new MemorySink()), reasoningBudgetJunior: 0 });
const arch = process.arch;
console.log(`arm-smoke: node arch=${arch}, loading ${MODELS.DEV_LLM}…`);

const modelId = await llm.load({ modelRef: MODELS.DEV_LLM, ctxSize: 2048 });
const result = llm.complete({
  modelRef: modelId,
  history: [{ role: "user", content: "Reply with exactly: ARM OK" }],
  reasoningBudget: 0,
});
let text = "";
for await (const tok of result.tokenStream) text += tok;
const stats = await result.stats;
await llm.unload(modelId);

const clean = text.replace(/<think>[\s\S]*?<\/think>/g, "").trim();
console.log("ARM_SMOKE_OUTPUT=" + JSON.stringify(clean.slice(0, 60)));
console.log("ARM_SMOKE_STATS=" + JSON.stringify(stats));
console.log(`arm-smoke: PASS on ${arch} — SDK native prebuilds loaded, inference ran.`);
process.exit(0);
