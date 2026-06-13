#!/usr/bin/env node
// Validates committed submission/config files are well-formed JSON and structurally correct.
// Expand with JSON-schema validation as the schemas land (audit-log, bench).
import { readFileSync, existsSync } from "node:fs";

const CLASSIFICATIONS = new Set([
  "VERY SEVERE DISEASE",
  "SEVERE PNEUMONIA OR VERY SEVERE DISEASE",
  "PNEUMONIA",
  "COUGH OR COLD",
  "SEVERE DEHYDRATION",
  "SOME DEHYDRATION",
  "NO DEHYDRATION",
  "VERY SEVERE FEBRILE DISEASE",
  "MALARIA",
  "MASTOIDITIS",
  "ACUTE EAR INFECTION",
  "SEVERE ACUTE MALNUTRITION",
  "MODERATE ACUTE MALNUTRITION",
]);

const checks = [
  {
    path: "remote-apis.json",
    validate: (data) => {
      if (!Array.isArray(data)) throw new Error("remote-apis.json must be an array");
      // Lifeline Mesh makes zero runtime remote API calls — the array stays empty.
      if (data.length > 0) {
        throw new Error("remote-apis.json must be empty: no runtime remote APIs allowed");
      }
    },
  },
  {
    path: "kb/manifest.json",
    optional: true,
    validate: (data) => {
      if (!data.version || !Array.isArray(data.sources) || data.sources.length < 1) {
        throw new Error("manifest must have version and at least one source");
      }
      for (const s of data.sources) {
        if (!s.licence) throw new Error(`source ${s.id} missing licence`);
        if (!/^[a-f0-9]{64}$/.test(s.sha256 ?? "")) throw new Error(`source ${s.id} bad sha256`);
        if (!(s.chunkCount > 0)) throw new Error(`source ${s.id} chunkCount must be > 0`);
      }
    },
  },
  {
    path: "scripts/bench/eval-cases.json",
    validate: (data) => {
      if (!Array.isArray(data) || data.length < 20) {
        throw new Error("eval-cases.json must have at least 20 cases");
      }
      for (const c of data) {
        if (!CLASSIFICATIONS.has(c.expectedClassification)) {
          throw new Error(`case ${c.id}: unknown classification "${c.expectedClassification}"`);
        }
      }
    },
  },
];

let failed = false;
for (const check of checks) {
  if (!existsSync(check.path)) {
    if (check.optional) {
      console.log(`SKIP (not built yet): ${check.path}`);
      continue;
    }
    console.error(`MISSING: ${check.path}`);
    failed = true;
    continue;
  }
  try {
    check.validate(JSON.parse(readFileSync(check.path, "utf8")));
    console.log(`OK: ${check.path}`);
  } catch (err) {
    console.error(`INVALID: ${check.path} — ${err.message}`);
    failed = true;
  }
}
process.exit(failed ? 1 : 0);
