#!/usr/bin/env node
// Roll the raw inference audit NDJSON into the structured submission/audit-log.json
// the hackathon requires (model loads/unloads, prompt/tokens, TTFT, tokens/sec).
// Usage: node scripts/audit/aggregate.mjs [input.ndjson] [output.json]
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";

const ROOT = join(dirname(new URL(import.meta.url).pathname), "..", "..");
const input = process.argv[2] || join(ROOT, "submission", "demo-audit.ndjson");
const output = process.argv[3] || join(ROOT, "submission", "audit-log.json");

if (!existsSync(input)) {
  console.error(`No audit input at ${input} — run scripts/demo.mjs (or the bench) first.`);
  process.exit(1);
}

const entries = readFileSync(input, "utf8")
  .trim()
  .split("\n")
  .filter(Boolean)
  .map((l) => JSON.parse(l));

const completions = entries.filter((e) => e.op === "completion");
const ttfts = completions.map((e) => e.ttftMs).filter((v) => typeof v === "number");
const tpss = completions.map((e) => e.tps).filter((v) => typeof v === "number");
const median = (a) => (a.length ? [...a].sort((x, y) => x - y)[Math.floor(a.length / 2)] : null);

const summary = {
  totalEntries: entries.length,
  modelLoads: entries.filter((e) => e.op === "loadModel").length,
  modelUnloads: entries.filter((e) => e.op === "unloadModel").length,
  completions: completions.length,
  delegations: completions.filter((e) => e.delegated).length,
  ttftMsMedian: median(ttfts),
  tokensPerSecondMedian: median(tpss),
  backendDevices: [...new Set(completions.map((e) => e.backendDevice).filter(Boolean))],
};

writeFileSync(output, JSON.stringify({ summary, entries }, null, 2) + "\n");
console.log(`Aggregated ${entries.length} entries -> ${output}`);
console.log(JSON.stringify(summary, null, 2));
