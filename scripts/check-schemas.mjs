#!/usr/bin/env node
// Validates committed submission/config files are well-formed JSON and structurally correct.
// Expand with JSON-schema validation as the schemas land (audit-log, bench).
import { readFileSync, existsSync } from "node:fs";

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
];

let failed = false;
for (const check of checks) {
  if (!existsSync(check.path)) {
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
