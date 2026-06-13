import { describe, it, expect } from "vitest";
import { AuditWriter, MemorySink, auditEntrySchema, type AuditEntry } from "./audit.js";

function entry(over: Partial<AuditEntry> = {}): AuditEntry {
  return {
    ts: 1000,
    op: "completion",
    modelRef: "medpsy-1.7b",
    node: "pi",
    promptTokens: 12,
    generatedTokens: 8,
    cacheTokens: 0,
    ttftMs: 120,
    totalMs: 400,
    tps: 20,
    backendDevice: "cpu",
    stopReason: "stop",
    toolCallsCount: 0,
    delegated: false,
    providerPublicKeyPrefix: null,
    sessionId: "s1",
    caseId: "c1",
    ttftSource: "sdk",
    ...over,
  };
}

describe("AuditWriter", () => {
  it("writes one NDJSON line per record", () => {
    const sink = new MemorySink();
    const w = new AuditWriter(sink);
    w.record(entry());
    w.record(entry({ op: "loadModel" }));
    expect(sink.lines).toHaveLength(2);
    expect(() => JSON.parse(sink.lines[0]!)).not.toThrow();
  });

  it("validates entries against the schema", () => {
    const sink = new MemorySink();
    const w = new AuditWriter(sink);
    // @ts-expect-error invalid node
    expect(() => w.record(entry({ node: "mars" }))).toThrow();
  });

  it("captures delegated fields for a senior-delegated entry", () => {
    const sink = new MemorySink();
    new AuditWriter(sink).record(
      entry({ node: "senior-delegated", delegated: true, providerPublicKeyPrefix: "abc123" }),
    );
    const parsed = JSON.parse(sink.lines[0]!);
    expect(parsed.delegated).toBe(true);
    expect(parsed.providerPublicKeyPrefix).toBe("abc123");
  });

  it("allows null ttft with ttftSource=none (SDK omitted stats)", () => {
    const sink = new MemorySink();
    new AuditWriter(sink).record(entry({ ttftMs: null, tps: null, ttftSource: "none" }));
    expect(JSON.parse(sink.lines[0]!).ttftSource).toBe("none");
  });

  it("records measured ttft provenance on the fallback path", () => {
    const sink = new MemorySink();
    new AuditWriter(sink).record(entry({ ttftMs: 95, ttftSource: "measured" }));
    expect(JSON.parse(sink.lines[0]!).ttftSource).toBe("measured");
  });

  it("schema accepts all three op-load/unload/completion shapes", () => {
    expect(auditEntrySchema.safeParse(entry({ op: "loadModel" })).success).toBe(true);
    expect(auditEntrySchema.safeParse(entry({ op: "unloadModel" })).success).toBe(true);
    expect(auditEntrySchema.safeParse(entry({ op: "transcribe" })).success).toBe(true);
  });
});
