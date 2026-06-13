import { readFileSync } from "node:fs";
import {
  LlmAdapter,
  EmbedAdapter,
  MeshAdapter,
  AuditWriter,
  getAppLogger,
  MODELS,
  RAG,
  CTX,
  type RagHit,
} from "@lifeline/core";
import { Workspace, WorkspaceRagPort, CitationResolver, type Chunk, type Citation } from "@lifeline/rag";
import { runCase, generateReferral, renderMarkdown, type CaseResult } from "@lifeline/agents";
import { MeshMonitor, route, type RouteDecision } from "@lifeline/mesh";

const log = getAppLogger("junior.case-service");

export interface AssessInput {
  utterance: string;
  ageMonths: number;
  sex: string;
}

export interface AssessOutput {
  case: CaseResult;
  citations: Citation[];
  classificationCitation: Citation | null;
  route: RouteDecision;
}

export interface CaseServiceConfig {
  root: string;
  auditPath: string;
  seniorProviderKey?: string;
}

// Holds the loaded junior-node models and exposes the verified pipeline to the server.
export class CaseService {
  private llm!: LlmAdapter;
  private embed!: EmbedAdapter;
  private workspace!: Workspace;
  private ragPort!: WorkspaceRagPort;
  private resolver!: CitationResolver;
  private monitor!: MeshMonitor;
  private modelId = "";

  constructor(private readonly cfg: CaseServiceConfig) {}

  async init(): Promise<void> {
    const audit = new AuditWriter(this.cfg.auditPath);
    this.llm = new LlmAdapter({ audit, reasoningBudgetJunior: 0 });
    this.embed = new EmbedAdapter(MODELS.EMBEDDING, RAG.EMBED_DIM);
    this.workspace = await Workspace.create(RAG.EMBED_DIM, `${this.cfg.root}/kb/workspace.sqlite`);
    this.ragPort = new WorkspaceRagPort(this.workspace, this.embed);

    const chunks: Chunk[] = readFileSync(`${this.cfg.root}/kb/chunks/imci.ndjson`, "utf8")
      .trim()
      .split("\n")
      .map((l) => JSON.parse(l) as Chunk);
    this.resolver = new CitationResolver(chunks);
    this.monitor = new MeshMonitor(new MeshAdapter(), this.cfg.seniorProviderKey);

    log.info("loading junior MedPsy-1.7B…");
    this.modelId = await this.llm.load({ modelRef: MODELS.JUNIOR_LLM_URL, tools: true, ctxSize: CTX.SENIOR });
    log.info({ modelId: this.modelId }, "junior node ready");
  }

  private resolveCitations(ids: string[]): Citation[] {
    const out: Citation[] = [];
    for (const id of ids) {
      try {
        out.push(this.resolver.resolve(id));
      } catch {
        /* RAG-hit ids without a curated chunk are skipped */
      }
    }
    return out;
  }

  async assess(input: AssessInput): Promise<AssessOutput> {
    const result = await runCase(
      { caseId: `case-${input.ageMonths}-${input.utterance.length}`, ...input, modelRef: this.modelId },
      { llm: this.llm, rag: this.ragPort },
    );
    const mesh = await this.monitor.probe();
    let classificationCitation: Citation | null = null;
    try {
      classificationCitation = this.resolver.resolve(result.classificationCitation);
    } catch {
      classificationCitation = null;
    }
    return {
      case: result,
      citations: this.resolveCitations(result.citations),
      classificationCitation,
      route: route({ classification: result.classification }, mesh),
    };
  }

  async referral(result: CaseResult, ageMonths: number, sex: string, dateIso: string): Promise<string> {
    const note = await generateReferral(result, ageMonths, sex, { llm: this.llm, modelRef: this.modelId });
    return renderMarkdown(note, {
      classification: result.classification,
      ageMonths,
      sex,
      citations: this.resolveCitations(result.citations),
      dateIso,
    });
  }

  meshState(): ReturnType<MeshMonitor["getState"]> {
    return this.monitor.getState();
  }

  search(query: string): Promise<RagHit[]> {
    return this.ragPort.search({ query, topK: RAG.TOP_K });
  }

  async shutdown(): Promise<void> {
    await this.llm.unload(this.modelId).catch(() => undefined);
    await this.embed.unload().catch(() => undefined);
    this.workspace.close();
  }
}
