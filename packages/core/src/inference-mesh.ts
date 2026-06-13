import * as sdk from "@qvac/sdk";
import type { MeshPort } from "./ports.js";
import type { MeshState } from "./types.js";

// MeshPort over @qvac/sdk Hyperswarm delegation primitives (inference* seam).
// heartbeat probes a provider; startProvider runs the senior service.

export class MeshAdapter implements MeshPort {
  async heartbeat(opts: { providerPublicKey: string; timeoutMs: number }): Promise<MeshState> {
    const checkedAtMs = Date.now();
    try {
      const start = Date.now();
      await sdk.heartbeat({
        delegate: { providerPublicKey: opts.providerPublicKey, timeout: opts.timeoutMs },
      } as unknown as Parameters<typeof sdk.heartbeat>[0]);
      return { status: "linked", latencyMs: Date.now() - start, checkedAtMs };
    } catch {
      return { status: "offline", checkedAtMs };
    }
  }

  async startProvider(opts: { allowedConsumerKey?: string }): Promise<{ publicKey: string }> {
    const params = opts.allowedConsumerKey
      ? { firewall: { mode: "allow", publicKeys: [opts.allowedConsumerKey] } }
      : {};
    const res = (await sdk.startQVACProvider(params as Parameters<typeof sdk.startQVACProvider>[0])) as {
      publicKey: string;
    };
    return { publicKey: res.publicKey };
  }

  async stopProvider(): Promise<void> {
    await sdk.stopQVACProvider();
  }
}
