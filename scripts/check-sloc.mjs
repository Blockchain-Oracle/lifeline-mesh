#!/usr/bin/env node
// Belt-and-braces guard for the 400-line cap (docs/architecture.md §2).
// Counts non-blank, non-line-comment lines per source file. Fails if any exceeds the cap.
import { readFileSync } from "node:fs";
import { execSync } from "node:child_process";

const MAX_SLOC = 400;
const ROOTS = ["apps", "packages", "scripts"];
const EXT = /\.(ts|tsx|js|mjs)$/;

const files = execSync(`find ${ROOTS.join(" ")} -type f 2>/dev/null || true`, { encoding: "utf8" })
  .split("\n")
  .filter((f) => f && EXT.test(f) && !f.includes("/dist/") && !f.includes("/node_modules/"));

const offenders = [];
for (const file of files) {
  const sloc = readFileSync(file, "utf8")
    .split("\n")
    .filter((line) => {
      const t = line.trim();
      return t.length > 0 && !t.startsWith("//");
    }).length;
  if (sloc > MAX_SLOC) offenders.push(`${file}: ${sloc}`);
}

if (offenders.length > 0) {
  console.error(`Files over ${MAX_SLOC} SLOC:\n${offenders.join("\n")}`);
  process.exit(1);
}
console.log(`SLOC guard OK — ${files.length} files, all <= ${MAX_SLOC}.`);
