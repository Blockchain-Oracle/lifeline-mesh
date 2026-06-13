import { z } from "zod";

// One retrievable knowledge chunk and its provenance (drives citations).
export const chunkTypeSchema = z.enum([
  "danger-signs",
  "protocol",
  "treatment",
  "dosing",
  "triage",
  "narrative",
]);
export type ChunkType = z.infer<typeof chunkTypeSchema>;

export const chunkSchema = z.object({
  id: z.string(),
  content: z.string().min(1),
  sourceId: z.string(),
  sourceTitle: z.string(),
  section: z.string(),
  page: z.number().int().positive(),
  type: chunkTypeSchema,
});
export type Chunk = z.infer<typeof chunkSchema>;

// KB manifest: provenance + licence + checksum + counts per source.
export const kbSourceSchema = z.object({
  id: z.string(),
  title: z.string(),
  url: z.string().url(),
  licence: z.string().min(1),
  sha256: z.string(),
  chunkCount: z.number().int().nonnegative(),
});
export type KbSource = z.infer<typeof kbSourceSchema>;

export const kbManifestSchema = z.object({
  version: z.string(),
  builtFrom: z.string(),
  sources: z.array(kbSourceSchema).min(1),
});
export type KbManifest = z.infer<typeof kbManifestSchema>;
