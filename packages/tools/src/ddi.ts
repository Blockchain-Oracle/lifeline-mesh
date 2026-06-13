// Offline drug-drug interaction lookup over a curated table of common paediatric
// medicines (no network; no LLM guessing about drug safety). "Not found" is
// explicit, never fabricated. Extend from openFDA labels for breadth (see story).

export type Severity = "none" | "moderate" | "severe";

export interface InteractionResult {
  severity: Severity;
  note: string;
  found: boolean;
}

interface Pair {
  a: string;
  b: string;
  severity: Severity;
  note: string;
}

// Curated, demonstration-scope pairs. Keys are lowercased generic names.
const PAIRS: Pair[] = [
  { a: "amoxicillin", b: "ferrous sulfate", severity: "none", note: "No clinically significant interaction; oral iron and amoxicillin can be co-administered." },
  { a: "amoxicillin", b: "iron", severity: "none", note: "No clinically significant interaction with oral iron supplements." },
  { a: "paracetamol", b: "amoxicillin", severity: "none", note: "No interaction; commonly given together." },
  { a: "artemether-lumefantrine", b: "amoxicillin", severity: "none", note: "No significant interaction." },
  { a: "salbutamol", b: "amoxicillin", severity: "none", note: "No significant interaction." },
  { a: "artemether-lumefantrine", b: "paracetamol", severity: "none", note: "No significant interaction." },
  { a: "ciprofloxacin", b: "ferrous sulfate", severity: "moderate", note: "Oral iron reduces ciprofloxacin absorption; separate doses by at least 2 hours." },
];

const ALIASES: Record<string, string> = {
  "iron syrup": "iron",
  "ferrous": "ferrous sulfate",
  "ferrous sulphate": "ferrous sulfate",
  "co-artem": "artemether-lumefantrine",
  "coartem": "artemether-lumefantrine",
  "al": "artemether-lumefantrine",
  "acetaminophen": "paracetamol",
};

function normalize(name: string): string {
  const k = name.trim().toLowerCase();
  return ALIASES[k] ?? k;
}

export function checkInteraction(drugA: string, drugB: string): InteractionResult {
  const a = normalize(drugA);
  const b = normalize(drugB);
  const hit = PAIRS.find((p) => (p.a === a && p.b === b) || (p.a === b && p.b === a));
  if (!hit) {
    return {
      severity: "none",
      found: false,
      note: `No interaction record found for "${drugA}" + "${drugB}" in the offline formulary; confirm against the national formulary.`,
    };
  }
  return { severity: hit.severity, found: true, note: hit.note };
}
