import type { MeshPort, MeshState } from "@lifeline/core";
import { TIMEOUTS_MS } from "@lifeline/core";

// Cached mesh-state monitor: the SDK has no auto-reconnect, so the junior owns a
// heartbeat + cached state that drives both the route decision and the UI status pill.

export class MeshMonitor {
  private state: MeshState = { status: "local", checkedAtMs: 0 };

  constructor(
    private readonly mesh: MeshPort,
    private readonly providerPublicKey: string | undefined,
  ) {}

  getState(): MeshState {
    return this.state;
  }

  async probe(): Promise<MeshState> {
    if (!this.providerPublicKey) {
      this.state = { status: "local", checkedAtMs: Date.now() };
      return this.state;
    }
    this.state = await this.mesh.heartbeat({
      providerPublicKey: this.providerPublicKey,
      timeoutMs: TIMEOUTS_MS.HEARTBEAT,
    });
    return this.state;
  }
}
