import { z } from "zod";

// The single validated boundary for process.env. No other module reads env directly.

const hex64 = /^[0-9a-fA-F]{64}$/;

const envSchema = z.object({
  LOG_LEVEL: z.enum(["error", "warn", "info", "debug"]).default("info"),
  // Provider identity seed: optional on the consumer (junior), required on the
  // senior to get a deterministic public key. When present it must be 64-hex.
  QVAC_HYPERSWARM_SEED: z
    .string()
    .refine((s) => hex64.test(s), "QVAC_HYPERSWARM_SEED must be a 64-character hex string")
    .optional(),
  SENIOR_PROVIDER_PUBLIC_KEY: z.string().optional(),
  TTS_BACKEND: z.enum(["supertonic", "espeak"]).default("supertonic"),
});

export type Env = z.infer<typeof envSchema>;

export function loadEnv(source: NodeJS.ProcessEnv = process.env): Env {
  const parsed = envSchema.safeParse(source);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
    throw new Error(`Invalid environment: ${issues}`);
  }
  return parsed.data;
}
