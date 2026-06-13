import type { LlmPort, RagPort, ChatTurn } from "@lifeline/core";
import { RAG, ESCALATE } from "@lifeline/core";
import { TOOL_DEFS, dispatchTool } from "@lifeline/tools";
import { TRIAGE_SYSTEM, triageUser, protocolContext } from "./prompts.js";

export interface CaseInput {
  caseId: string;
  utterance: string;
  ageMonths: number;
  sex: string;
  modelRef: string;
  sessionId?: string;
}

export interface ToolInvocation {
  name: string;
  ok: boolean;
  result?: unknown;
  error?: string;
}

export interface CaseResult {
  caseId: string;
  classification?: string;
  finalText: string;
  citations: string[];
  toolInvocations: ToolInvocation[];
  turns: number;
  toolErrors: number;
  stopReason: "answered" | "max-turns";
}

const CLASSIFICATIONS = [
  "SEVERE PNEUMONIA OR VERY SEVERE DISEASE",
  "VERY SEVERE FEBRILE DISEASE",
  "VERY SEVERE DISEASE",
  "SEVERE DEHYDRATION",
  "SOME DEHYDRATION",
  "NO DEHYDRATION",
  "SEVERE ACUTE MALNUTRITION",
  "MODERATE ACUTE MALNUTRITION",
  "ACUTE EAR INFECTION",
  "MASTOIDITIS",
  "PNEUMONIA",
  "COUGH OR COLD",
  "MALARIA",
];

function extractClassification(text: string, tools: ToolInvocation[]): string | undefined {
  for (let i = tools.length - 1; i >= 0; i--) {
    const r = tools[i]?.result as { classification?: string } | undefined;
    if (r?.classification) return r.classification;
  }
  const upper = text.toUpperCase();
  return CLASSIFICATIONS.find((c) => upper.includes(c));
}

export interface CaseRunnerDeps {
  llm: LlmPort;
  rag: RagPort;
}

export async function runCase(input: CaseInput, deps: CaseRunnerDeps): Promise<CaseResult> {
  const hits = await deps.rag.search({ query: input.utterance, topK: RAG.TOP_K });
  const citations = new Set<string>(hits.map((h) => h.id));

  const history: ChatTurn[] = [
    { role: "system", content: `${TRIAGE_SYSTEM}\n\n${protocolContext(hits.map((h) => h.content))}` },
    { role: "user", content: triageUser(input.utterance, input.ageMonths, input.sex) },
  ];

  const toolInvocations: ToolInvocation[] = [];
  let toolErrors = 0;
  let finalText = "";
  let stopReason: "answered" | "max-turns" = "max-turns";

  for (let turn = 1; turn <= ESCALATE.MAX_TURNS_BEFORE_ESCALATE; turn++) {
    const result = deps.llm.complete({
      modelRef: input.modelRef,
      history,
      tools: TOOL_DEFS,
      reasoningBudget: 0,
      caseId: input.caseId,
      ...(input.sessionId ? { sessionId: input.sessionId } : {}),
    });
    for await (const _ of result.tokenStream) void _;
    const text = await result.text;
    const calls = await result.toolCalls;

    if (calls.length === 0) {
      finalText = text;
      stopReason = "answered";
      break;
    }

    history.push({ role: "assistant", content: text });
    for (const call of calls) {
      const out = dispatchTool(call);
      toolInvocations.push({
        name: call.name,
        ok: out.ok,
        ...(out.result !== undefined ? { result: out.result } : {}),
        ...(out.error !== undefined ? { error: out.error } : {}),
      });
      if (!out.ok) toolErrors++;
      if (out.citationId) citations.add(out.citationId);
      history.push({
        role: "tool",
        content: JSON.stringify(out.ok ? out.result : { error: out.error }),
      });
    }
    finalText = text;
  }

  const classification = extractClassification(finalText, toolInvocations);
  return {
    caseId: input.caseId,
    ...(classification ? { classification } : {}),
    finalText,
    citations: [...citations],
    toolInvocations,
    turns: toolInvocations.length === 0 ? 1 : toolInvocations.length,
    toolErrors,
    stopReason,
  };
}
