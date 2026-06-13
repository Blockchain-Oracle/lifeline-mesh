#!/usr/bin/env node
// Build-time KB ingest (runs on the laptop, output committed for reproducibility).
// Extracts page-marked text from source PDFs using poppler's pdftotext -layout,
// which preserves the IMCI chart booklet's tabular ASSESS/CLASSIFY/TREATMENT columns
// far better than pure-JS parsers. Requires `pdftotext` (poppler-utils) at build time.
import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";

const ROOT = join(dirname(new URL(import.meta.url).pathname), "..");
const PAGE_MARK = (n) => `\n@@PAGE ${n}@@\n`;

const SOURCES = {
  imci: {
    pdf: "kb/source/imci-chartbook.pdf",
    title: "WHO IMCI Chart Booklet (March 2014)",
    out: "kb/source/.text/imci.txt",
  },
};

function pageCount(pdfPath) {
  const info = execFileSync("pdfinfo", [pdfPath], { encoding: "utf8" });
  const m = info.match(/Pages:\s+(\d+)/);
  if (!m) throw new Error(`Could not read page count for ${pdfPath}`);
  return Number(m[1]);
}

function extract(pdfPath) {
  const pages = pageCount(pdfPath);
  let out = "";
  for (let p = 1; p <= pages; p++) {
    const txt = execFileSync("pdftotext", ["-layout", "-f", String(p), "-l", String(p), pdfPath, "-"], {
      encoding: "utf8",
      maxBuffer: 32 * 1024 * 1024,
    });
    out += PAGE_MARK(p) + txt;
  }
  return { pages, text: out };
}

function main() {
  const which = process.argv[2]?.replace(/^--source=?/, "") ?? "imci";
  const src = SOURCES[which];
  if (!src) {
    console.error(`Unknown source "${which}". Known: ${Object.keys(SOURCES).join(", ")}`);
    process.exit(1);
  }
  const pdfPath = join(ROOT, src.pdf);
  if (!existsSync(pdfPath)) {
    console.error(`Missing source PDF: ${src.pdf} (download it first — see kb/source/README.md)`);
    process.exit(1);
  }
  const { pages, text } = extract(pdfPath);
  const outPath = join(ROOT, src.out);
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, text);
  console.log(`Extracted ${pages} pages from ${src.title} -> ${src.out} (${text.length} chars)`);
}

main();
