import { appendFileSync } from "node:fs";
import { z } from "zod";

// The mandated inference audit log. Every SDK call flows through the adapter,
// which calls AuditWriter.record(), so the log is complete by construction.

export const auditEntrySchema = z.object({
  ts: z.number(),
  op: z.enum(["loadModel", "unloadModel", "completion", "transcribe", "tts", "embed", "heartbeat"]),
  modelRef: z.string(),
  requestId: z.string().optional(),
  node: z.enum(["pi", "senior-delegated", "senior-local"]),
  promptTokens: z.number().nullable(),
  generatedTokens: z.number().nullable(),
  cacheTokens: z.number().nullable(),
  ttftMs: z.number().nullable(),
  totalMs: z.number().nullable(),
  tps: z.number().nullable(),
  backendDevice: z.string().nullable(),
  stopReason: z.string().nullable(),
  toolCallsCount: z.number().nullable(),
  delegated: z.boolean(),
  providerPublicKeyPrefix: z.string().nullable(),
  sessionId: z.string().nullable(),
  caseId: z.string().nullable(),
  ttftSource: z.enum(["sdk", "measured", "none"]),
});

export type AuditEntry = z.infer<typeof auditEntrySchema>;

export interface AuditSink {
  write(line: string): void;
}

class FileSink implements AuditSink {
  constructor(private readonly path: string) {}
  write(line: string): void {
    appendFileSync(this.path, line + "\n");
  }
}

export class MemorySink implements AuditSink {
  readonly lines: string[] = [];
  write(line: string): void {
    this.lines.push(line);
  }
}

export class AuditWriter {
  private readonly sink: AuditSink;
  constructor(sink: AuditSink | string) {
    this.sink = typeof sink === "string" ? new FileSink(sink) : sink;
  }
  record(entry: AuditEntry): void {
    const valid = auditEntrySchema.parse(entry);
    this.sink.write(JSON.stringify(valid));
  }
}
