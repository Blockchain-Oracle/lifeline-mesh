// The single home for magic values (docs/architecture.md §5). No literal config elsewhere.

// MedPsy has no built-in SDK constant → load by URL. Others use built-in registry constants.
export const MODELS = {
  JUNIOR_LLM_URL:
    "https://huggingface.co/qvac/MedPsy-1.7B-GGUF/resolve/main/medpsy-1.7b-q4_k_m-imat.gguf",
  SENIOR_LLM_URL:
    "https://huggingface.co/qvac/MedPsy-4B-GGUF/resolve/main/medpsy-4b-q4_k_m-imat.gguf",
  DEV_LLM: "QWEN3_1_7B_INST_Q4",
  TOOL_FALLBACK_LLM: "LLAMA_TOOL_CALLING_1B_INST_Q4_K",
  EMBEDDING: "EMBEDDINGGEMMA_300M_BF16",
  EMBEDDING_FALLBACK_URL:
    "https://huggingface.co/Qwen/Qwen3-Embedding-0.6B-GGUF/resolve/main/qwen3-embedding-0.6b-q4_k_m.gguf",
  WHISPER: "WHISPER_EN_BASE_Q8_0",
  WHISPER_FALLBACK: "WHISPER_EN_TINY_Q8_0",
  TTS: "TTS_EN_SUPERTONIC_Q4_0",
} as const;

export const CTX = { JUNIOR: 2048, SENIOR: 4096 } as const;

export const TIMEOUTS_MS = {
  DELEGATION_FIRST: 60_000,
  DELEGATION_WARM: 5_000,
  HEARTBEAT: 3_000,
} as const;

export const PORTS = { JUNIOR_HTTP: 8787, SENIOR_HTTP: 8788 } as const;

export const ESCALATE = {
  CONFIDENCE_THRESHOLD: 0.7,
  MAX_TURNS_BEFORE_ESCALATE: 6,
  TOOL_ERROR_WINDOW: 5,
  TOOL_ERROR_THRESHOLD: 3,
} as const;

export const RAG = { TOP_K: 4, MIN_SIMILARITY: 0.55, EMBED_DIM: 768 } as const;

export const AUDIO = { FORMAT: "f32le", LANGUAGE: "en" } as const;

export const KB_VERSION = "lifeline-v1";
export const PROVIDER_SEED_ENV = "QVAC_HYPERSWARM_SEED";
export const AP = { SSID: "LifelineMesh", HOSTNAME: "lifeline.local" } as const;
