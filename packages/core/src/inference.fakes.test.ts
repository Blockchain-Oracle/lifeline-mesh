import { describe, it, expect } from "vitest";
import {
  FakeLlmPort,
  FakeRagPort,
  FakeMeshPort,
  FakeEmbedPort,
} from "./inference.fakes.js";

describe("fakes", () => {
  it("FakeLlmPort yields the scripted tokens and tool calls deterministically", async () => {
    const llm = new FakeLlmPort({ tokens: ["a", "b"], toolCalls: [{ id: "1", name: "t", arguments: {} }] });
    const r = llm.complete({ modelRef: "m", history: [] });
    let out = "";
    for await (const t of r.tokenStream) out += t;
    expect(out).toBe("ab");
    expect((await r.toolCalls)[0]!.name).toBe("t");
    expect(llm.calls).toHaveLength(1);
  });

  it("FakeRagPort ranks by term overlap and respects topK", async () => {
    const rag = new FakeRagPort([
      { id: "1", content: "fast breathing pneumonia", score: 0, sourceId: "imci", section: "cough", page: 23, type: "protocol" },
      { id: "2", content: "diarrhoea dehydration", score: 0, sourceId: "imci", section: "diarrhoea", page: 30, type: "protocol" },
    ]);
    const hits = await rag.search({ query: "fast breathing", topK: 1 });
    expect(hits).toHaveLength(1);
    expect(hits[0]!.id).toBe("1");
    expect(hits[0]!.page).toBe(23);
  });

  it("FakeMeshPort reports reachable/offline per config", async () => {
    expect((await new FakeMeshPort(true).heartbeat()).status).toBe("linked");
    expect((await new FakeMeshPort(false).heartbeat()).status).toBe("offline");
  });

  it("FakeEmbedPort returns a stable vector of the right dimension", async () => {
    const e = new FakeEmbedPort(768);
    const a = await e.embed({ text: "hello" });
    const b = await e.embed({ text: "hello" });
    expect(a.embedding).toHaveLength(768);
    expect(a.embedding).toEqual(b.embedding);
    expect(e.dim()).toBe(768);
  });
});
