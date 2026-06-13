import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { getAppLogger, loadEnv, PORTS } from "@lifeline/core";
import { CaseService } from "./case-service.js";
import { buildServer } from "./server.js";

const log = getAppLogger("junior.index");

async function main(): Promise<void> {
  const env = loadEnv();
  // Repo root is three levels up from apps/junior-node/dist/index.js.
  const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
  const auditPath = join(root, "submission", "junior-audit.ndjson");
  const seniorKey = process.env["LIFELINE_SENIOR_KEY"];

  const service = new CaseService({
    root,
    auditPath,
    ...(seniorKey ? { seniorProviderKey: seniorKey } : {}),
  });
  await service.init();

  const webDir = join(root, "apps", "web", "dist");
  const app = buildServer(service, { webDir, auditPath });

  const port = PORTS.JUNIOR_HTTP;
  await app.listen({ host: "0.0.0.0", port });
  // eslint-disable-next-line no-console
  console.log(`\n🩺 Lifeline Mesh junior node listening on http://0.0.0.0:${port}\n   (open http://lifeline.local:${port} on the clinic Wi-Fi)\n`);
  log.info({ port, ttsBackend: env.TTS_BACKEND }, "junior node serving");

  const shutdown = async (): Promise<void> => {
    await app.close();
    await service.shutdown();
    process.exit(0);
  };
  process.on("SIGINT", () => void shutdown());
  process.on("SIGTERM", () => void shutdown());
}

main().catch((err: unknown) => {
  log.error({ err }, "junior node failed to start");
  process.exit(1);
});
