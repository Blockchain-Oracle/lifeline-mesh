import {
  LlmAdapter,
  MeshAdapter,
  AuditWriter,
  MemorySink,
  getAppLogger,
  loadEnv,
  MODELS,
  CTX,
} from "@lifeline/core";

// Senior node: the laptop "senior brain". Pre-warms MedPsy-4B so the first delegated
// call has no cold download (ADR-015), then starts the QVAC provider with a
// deterministic identity (QVAC_HYPERSWARM_SEED) for the mesh.

const log = getAppLogger("senior-node");

async function main(): Promise<void> {
  const env = loadEnv();
  if (!env.QVAC_HYPERSWARM_SEED) {
    log.error("QVAC_HYPERSWARM_SEED is required (64-hex) for a deterministic provider identity");
    process.exit(1);
  }

  const audit = new AuditWriter(new MemorySink());
  const llm = new LlmAdapter({ audit, reasoningBudgetJunior: 0 });
  log.info("pre-warming MedPsy-4B (senior brain)…");
  const modelId = await llm.load({ modelRef: MODELS.SENIOR_LLM_URL, tools: true, ctxSize: CTX.SENIOR });
  log.info({ modelId }, "MedPsy-4B ready");

  const mesh = new MeshAdapter();
  const allowedConsumerKey = env.SENIOR_PROVIDER_PUBLIC_KEY;
  const { publicKey } = await mesh.startProvider(
    allowedConsumerKey ? { allowedConsumerKey } : {},
  );

  // eslint-disable-next-line no-console
  console.log(`\n✅ Senior provider online.\n🔑 Provider public key:\n   ${publicKey}\n\nSet LIFELINE_SENIOR_KEY to this on the junior node. Ctrl+C to stop.\n`);

  const shutdown = async (): Promise<void> => {
    log.info("stopping provider…");
    await mesh.stopProvider().catch(() => undefined);
    await llm.unload(modelId).catch(() => undefined);
    process.exit(0);
  };
  process.on("SIGINT", () => void shutdown());
  process.stdin.resume();
}

main().catch((err: unknown) => {
  log.error({ err }, "senior-node failed");
  process.exit(1);
});
