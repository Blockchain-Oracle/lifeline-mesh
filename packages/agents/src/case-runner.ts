import type { LlmPort, RagPort, ChatTurn } from "@lifeline/core";
import { RAG } from "@lifeline/core";
import {
  findingsSchema,
  TRIAGE_JSON_SCHEMA,
  CATEGORY_JSON_SCHEMAS,
  CATEGORY_TRIAGE_FLAG,
  CATEGORY_FINDING_FLAG,
  CATEGORIES,
  classifyCase,
  type Findings,
  type Category,
} from "@lifeline/tools";
import { EXTRACTION_SYSTEM, extractionUser } from "./prompts.js";

export interface CaseInput {
  caseId: string;
  utterance: string;
  ageMonths: number;
  sex: string;
  modelRef: string;
  sessionId?: string;
}

export interface CaseResult {
  caseId: string;
  classification: string;
  rationale: string;
  categories: string[];
  findings: Findings;
  citations: string[];
  classificationCitation: string;
}

function stripThink(text: string): string {
  return text.replace(/<think>[\s\S]*?<\/think>/g, "").trim();
}

function parseJson(text: string): Record<string, unknown> {
  const clean = stripThink(text);
  const start = clean.indexOf("{");
  const end = clean.lastIndexOf("}");
  if (start < 0 || end <= start) return {};
  try {
    return JSON.parse(clean.slice(start, end + 1)) as Record<string, unknown>;
  } catch {
    return {};
  }
}

export interface CaseRunnerDeps {
  llm: LlmPort;
  rag: RagPort;
}

async function extract(
  deps: CaseRunnerDeps,
  input: CaseInput,
  history: ChatTurn[],
  name: string,
  schema: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const result = deps.llm.complete({
    modelRef: input.modelRef,
    history,
    responseFormat: { type: "json_schema", name, schema },
    reasoningBudget: 0,
    caseId: input.caseId,
    ...(input.sessionId ? { sessionId: input.sessionId } : {}),
  });
  for await (const _ of result.tokenStream) void _;
  return parseJson(await result.text);
}

// Multi-category two-stage extraction (ADR-013): stage 1 multi-selects which IMCI
// symptom categories are present + danger signs; stage 2 deep-extracts only the
// present categories (focused -> reliable). Deterministic classifyCase owns the
// cited result and picks the most severe across all assessed categories (true IMCI).
export async function runCase(input: CaseInput, deps: CaseRunnerDeps): Promise<CaseResult> {
  const hits = await deps.rag.search({ query: input.utterance, topK: RAG.TOP_K });
  const citations = new Set<string>(hits.map((h) => h.id));

  const history: ChatTurn[] = [
    { role: "system", content: EXTRACTION_SYSTEM },
    { role: "user", content: extractionUser(input.utterance, input.ageMonths) },
  ];

  const triage = await extract(deps, input, history, "triage", TRIAGE_JSON_SCHEMA);
  const merged: Record<string, unknown> = { ...triage };

  const present: Category[] = CATEGORIES.filter((c) => triage[CATEGORY_TRIAGE_FLAG[c]] === true);
  for (const category of present) {
    const signs = await extract(deps, input, history, `signs_${category}`, CATEGORY_JSON_SCHEMAS[category]);
    Object.assign(merged, signs);
    const flag = CATEGORY_FINDING_FLAG[category];
    if (flag) merged[flag] = true;
  }

  const findings: Findings = findingsSchema.parse(merged);
  const decision = classifyCase(findings, input.ageMonths);
  citations.add(decision.citationId);

  return {
    caseId: input.caseId,
    classification: decision.classification,
    rationale: decision.rationale,
    categories: present,
    findings,
    citations: [...citations],
    classificationCitation: decision.citationId,
  };
}
