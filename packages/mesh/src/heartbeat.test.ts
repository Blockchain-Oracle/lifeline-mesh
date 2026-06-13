import { describe, it, expect } from "vitest";
import { FakeMeshPort } from "@lifeline/core";
import { MeshMonitor } from "./heartbeat.js";

describe("MeshMonitor", () => {
  it("reports local when no provider key is configured", async () => {
    const m = new MeshMonitor(new FakeMeshPort(true), undefined);
    expect((await m.probe()).status).toBe("local");
  });

  it("reports linked when the provider is reachable", async () => {
    const m = new MeshMonitor(new FakeMeshPort(true), "abc");
    const s = await m.probe();
    expect(s.status).toBe("linked");
    expect(s.latencyMs).toBeGreaterThanOrEqual(0);
  });

  it("reports offline when the provider is unreachable (no throw)", async () => {
    const m = new MeshMonitor(new FakeMeshPort(false), "abc");
    expect((await m.probe()).status).toBe("offline");
  });

  it("caches the last state via getState()", async () => {
    const m = new MeshMonitor(new FakeMeshPort(true), "abc");
    await m.probe();
    expect(m.getState().status).toBe("linked");
  });
});
