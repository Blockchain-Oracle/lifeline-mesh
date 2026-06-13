import type { ChatTurn, ToolDef, ToolCall, CompletionStats, MeshState } from "./types.js";

// Ports-and-adapters seam. Everything depends on these interfaces; only
// inference.ts implements them against @qvac/sdk. Tests use inference.fakes.ts.

export interface CompletionRequest {
  modelRef: string;
  history: ChatTurn[];
  tools?: ToolDef[];
  responseFormat?: { type: "json_schema"; schema: Record<string, unknown> };
  reasoningBudget?: number;
  delegated?: boolean;
  sessionId?: string;
  caseId?: string;
}

export interface CompletionResult {
  tokenStream: AsyncIterable<string>;
  toolCalls: Promise<ToolCall[]>;
  text: Promise<string>;
  stats: Promise<CompletionStats | undefined>;
}

export interface LlmPort {
  load(opts: { modelRef: string; tools?: boolean; ctxSize?: number; delegateTo?: string }): Promise<string>;
  complete(req: CompletionRequest): CompletionResult;
  unload(modelRef: string): Promise<void>;
}

export interface SttPort {
  transcribe(opts: { audioPath: string }): Promise<{ text: string; durationMs: number }>;
}

export interface TtsPort {
  speak(opts: { text: string }): Promise<{ audio: Uint8Array }>;
}

export interface EmbedPort {
  embed(opts: { text: string }): Promise<{ embedding: number[] }>;
  dim(): number;
}

export interface RagHit {
  id: string;
  content: string;
  score: number;
  sourceId: string;
  section: string;
  page: number;
  type: string;
}

export interface RagPort {
  search(opts: { query: string; topK: number }): Promise<RagHit[]>;
}

export interface MeshPort {
  heartbeat(opts: { providerPublicKey: string; timeoutMs: number }): Promise<MeshState>;
  startProvider(opts: { allowedConsumerKey?: string }): Promise<{ publicKey: string }>;
  stopProvider(): Promise<void>;
}
