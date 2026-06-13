# Architecture — Lifeline Mesh

All decisions in this file are locked. Stories reference filenames listed here. If a story needs to break a rule below, it must update this file first.

Underlying research: `research/qvac-2026/13-architecture-validation.md` + `08-tool-calling-deep-dive.md` + `11-resources-clinic-mesh.md`. Read those before challenging any choice here.

## 1. Stack (locked versions)

| Layer | Choice | Version |
|---|---|---|
| Language | TypeScript strict | 5.5.x |
| Package manager | pnpm workspaces | 9.x |
| Runtime (Pi & laptop) | Node.js | ≥ 22.17.0 |
| Inference SDK | `@qvac/sdk` | exactly `0.12.2` (pin; do not chase 0.13.x unpublished) |
| HTTP/WS server | `fastify` + `@fastify/websocket` | 4.x |
| Frontend | Vite + React + Tailwind | React 18 |
| Component lib | shadcn/ui (Radix primitives, copied in, no runtime dep) | n/a |
| Logger (app) | `pino` (+ `pino-pretty` dev only) | 9.x |
| Audit log | dedicated `pino` instance → `submission/audit-log.ndjson` | n/a |
| Test runner | `vitest` | 1.x |
| Lint | ESLint 9 flat config + `typescript-eslint` + `prettier` | 9.x |
| Schema | `zod` | 3.x |
| PDF/HTML ingest (build only) | `pdf-parse`, `cheerio`, `marked` | latest |
| Vector DB | `@sqliteai/sqlite-wasm` (self-managed, arch-independent) | latest |
| Service supervisor (Pi) | systemd | OS |
| Pi OS | Raspberry Pi OS Lite 64-bit (Bookworm) | latest |
| Wi-Fi AP + mDNS | `hostapd` + `dnsmasq` + `avahi-daemon` | distro |

## 2. Engineering standards (enforced)

Non-negotiable rules — enforced by CI, not by hope:

1. **No file > 400 lines.** Counted as `skipBlankLines:true, skipComments:true` so the cap targets code only.
   - ESLint flat-config rule: `"max-lines": ["error", { "max": 400, "skipBlankLines": true, "skipComments": true }]`
   - Belt-and-braces shell check in CI (catches files lint can't lint).
2. **CI gate to merge:** typecheck + lint + unit tests + 400-line check + schema validation must all be green. Branch protection on `main`.
3. **No magic values.** All thresholds, model URLs, timeouts, ports, ctx sizes, seeds — declared in `packages/core/src/constants.ts` and re-exported. Lint rule `no-magic-numbers` (with `[0, 1, -1, 2]` ignored) on `apps/**` and `packages/**` except `constants.ts`.
4. **No stray console.log.** Lint rule `no-console` (error). Use `pino`. Exception: `scripts/**` may use console for human-facing CLI output.
5. **Adapter seam for the SDK.** Every call into `@qvac/sdk` goes through `packages/core/src/inference.ts` (`LlmPort`, `SttPort`, `TtsPort`, `EmbedPort`, `RagPort`, `MeshPort`). This is the seam where (a) audit-log entries are emitted, (b) tests inject fakes, (c) the senior-side handlers are swapped in. No `import "@qvac/sdk"` outside this file or its `packages/core` siblings — enforced by ESLint `no-restricted-imports`.
6. **TypeScript strict.** No `any` (lint `no-explicit-any` error). Unknown shapes from external inputs are validated through `zod` schemas.
7. **Imports.** ESM only (`type: module`). Path aliases via tsconfig (`@core/*`, `@agents/*`, `@rag/*`, `@mesh/*`, `@tools/*`).
8. **Logger naming.** `pino.child({ component: "agents.triage" })` — every component declares its namespace, no global root logger usage.
9. **Tests-first for ports.** Every Port interface ships with an in-memory fake in `packages/core/src/inference.fakes.ts`; agent/policy/tool tests use the fakes. The real SDK is exercised only by the on-device bench scripts.
10. **Tests are behavioural.** Smoke tests don't count. Each story specifies the number of behavioural assertions required.

## 3. Architecture Decision Records (ADRs)

Stored inline (we don't have time for an `adr/` directory; revisit post-hackathon).

- **ADR-001 — Node 22 not Bare runtime.** Same `.bare` native prebuilds load under both; Node is the documented primary; Bare adds peer-dep ceremony with no benefit for a server-style daemon. Validation: `13` §1.
- **ADR-002 — Pi 5 4 GB target (Tinkerer).** The Tinkerer track caps at ≤ 4 GB. Built-in `WHISPER_EN_BASE_Q8_0` STT + built-in `EMBEDDINGGEMMA_300M_BF16` embedder (768-dim) + `TTS_EN_SUPERTONIC_Q4_0` single-GGUF TTS fits the budget with sequential lifecycle. RAM fallback: URL-loaded `Qwen3-Embedding-0.6B-Q4` (~400 MB, 1024-dim — rebuild DB) + `WHISPER_EN_TINY_Q8_0`. Validation: `13` §2, SDK registry inspection 2026-06-13.
- **ADR-003 — Web UI served by the Pi, viewed in a phone browser, NOT a kiosk on the Pi.** Chromium on the Pi would eat 0.6–1 GB of RAM we don't have. Phone-on-the-Pi's-hotspot is also the real deployment shape. Validation: `13` §3.
- **ADR-004 — One Node process embeds the SDK + Fastify + WS, not `qvac serve openai`.** The agent loop, escalation policy, and audit hooks are application logic that can't be expressed through an OpenAI-compatible endpoint. `qvac serve` stays as a bonus demo on the laptop. Validation: `13` §3.
- **ADR-005 — Pre-curated KB chunks, not runtime PDF ingestion.** The chart booklet's tabular layout requires hand-curation. We embed at build time on the laptop, ship the SQLite DB to the Pi. Validation: `13` §6.
- **ADR-006 — RAG via low-level `embed()` + self-managed `@sqliteai/sqlite-wasm` DB, not `ragSaveEmbeddings`/workspaces.** The shipped `examples/rag/rag-sqlite.js` stores arbitrary columns and searches with `vector_init`/`vector_quantize`/`vector_quantize_preload`/`vector_quantize_scan`. We add `source_id, section, page, type` columns returned directly with each hit → clean citations with full schema control. **sqlite-wasm is architecture-independent, so the x86-built DB opens unchanged on the Pi's arm64** (dissolves the prior portability risk). New dep: `@sqliteai/sqlite-wasm`. Validation: SDK example inspection 2026-06-13.
- **ADR-007 — Confidence via grammar-constrained self-assessment, not logprobs.** SDK exposes no logprob fields. A `responseFormat: json_schema` probe is reliable on 1.7B. Combined with deterministic IMCI danger-sign rules. Validation: `13` §7.
- **ADR-008 — Escalation is a deterministic policy, not an LLM.** Defensible (medicine prefers rules), cheap, testable. The model can recommend escalation; the policy decides.
- **ADR-009 — Audit log uses the SDK's native `completionStats` event.** TTFT, tok/s, prompt tokens, generated tokens, cache tokens, backend device all available on `result.events`/`result.final.stats` (event name: `completionStats`, schema: `dist/schemas/completion-event.d.ts`). No internals hacking. Validation: `13` §8.
- **ADR-010 — Pi runs its own Wi-Fi AP ("LifelineMesh") via hostapd/dnsmasq + mDNS hostname `lifeline.local` via avahi.** Lets the CHW's phone connect with zero infra. The laptop joins the same AP for mesh visibility.
- **ADR-011 — Browser captures audio via `MediaRecorder`; whole-utterance HTTP POST is the default; streaming over WS is the stretch.** Streaming `transcribeStream` from a browser-pushed buffer is unverified; push-to-talk is demo-equivalent and simpler. `13` §3.
- **ADR-012 — Hermes tool dialect for MedPsy.** Qwen3-base → hermes (filename-detected); explicit `toolDialect:"hermes"` in `loadModel` to remove ambiguity. `13` §7.
- **ADR-013 — `toolsMode: "static"`.** Same clinical toolset for the whole session; static gives faster prompt warm. `reasoning_budget: 0` on Pi (latency); allow thinking on senior 4B (better answers + good demo visual with `captureThinking: true`). **Tool-reliability fallback:** if MedPsy-1.7B hermes adherence < 80 % on the 20-case eval, route tool turns through the built-in `LLAMA_TOOL_CALLING_1B_INST_Q4_K` (tool-tuned 1B) or fall back to `json_schema`-constrained tool selection.
- **ADR-014 — Fast dev stand-in `QWEN3_1_7B_INST_Q4`.** MedPsy's exact base arch ships as a built-in constant; use it for the local dev loop, unit-test fixtures, and the arm-smoke CI job so we don't pull the 2.7 GB MedPsy GGUF on every iteration. Swap to the MedPsy URL for eval/demo/bench.
- **ADR-015 — Senior pre-warms MedPsy-4B.** `startQVACProvider()` serves models on demand (downloads/loads on first delegated request). The senior process pre-loads the 4B at boot so the demo's first delegated call is not a multi-GB download.

## 4. Repository layout

```
lifeline-mesh/
├── package.json                       # workspace root, engines.node ">=22.17", "type": "module"
├── pnpm-workspace.yaml
├── pnpm-lock.yaml
├── tsconfig.base.json                 # strict, paths aliases
├── eslint.config.js                   # flat config: max-lines 400, no-magic-numbers, no-console, no-explicit-any, no-restricted-imports
├── .prettierrc
├── .editorconfig
├── .gitignore
├── .github/workflows/
│   ├── ci.yml                         # typecheck + lint + 400-line check + vitest + schema validate
│   └── arm-smoke.yml                  # ubuntu-24.04-arm: load a tiny GGUF, prove arm64 prebuild
├── apps/
│   ├── junior-node/                   # the Pi process
│   │   ├── src/
│   │   │   ├── index.ts               # bootstrap: pino, profiler.enable(), load models, mount server
│   │   │   ├── server.ts              # fastify + websocket
│   │   │   ├── ws-routes.ts           # /ws/voice, /ws/case
│   │   │   ├── http-routes.ts         # /health, /audit/recent, /static/*
│   │   │   ├── voice.ts               # MediaRecorder ingest → transcribe → agent loop → tts
│   │   │   ├── case-runner.ts         # orchestrates triage → walkthrough → referral
│   │   │   └── lifecycle.ts           # sequential model load/unload
│   │   ├── tsconfig.json
│   │   └── package.json
│   ├── senior-node/                   # the laptop process
│   │   ├── src/
│   │   │   ├── index.ts               # startQVACProvider + load MedPsy-4B
│   │   │   ├── provider.ts            # provider keypair from QVAC_HYPERSWARM_SEED env
│   │   │   └── dashboard.ts           # optional fastify route exposing the senior's audit log
│   │   ├── tsconfig.json
│   │   └── package.json
│   └── web/                           # Vite/React UI
│       ├── src/
│       │   ├── main.tsx
│       │   ├── App.tsx
│       │   ├── routes/                # /, /audit
│       │   ├── components/            # CaseCard, CitationCard, TriageStepCard, EscalationBadge, AudioRecorder, AuditViewer
│       │   ├── hooks/                 # useWebSocket, useCaseStream, useAudioCapture
│       │   ├── lib/                   # ws-client, audio-utils
│       │   └── styles/                # tailwind, tokens
│       ├── vite.config.ts
│       ├── tailwind.config.ts
│       ├── tsconfig.json
│       └── package.json
├── packages/
│   ├── core/                          # shared everything
│   │   ├── src/
│   │   │   ├── constants.ts           # the single magic-numbers home
│   │   │   ├── env.ts                 # zod-validated process.env
│   │   │   ├── logger.ts              # pino factory (app + audit instances)
│   │   │   ├── audit.ts               # AuditWriter (NDJSON), schema
│   │   │   ├── types.ts               # shared domain types
│   │   │   ├── errors.ts              # typed errors
│   │   │   ├── ports.ts               # LlmPort, SttPort, TtsPort, EmbedPort, RagPort, MeshPort
│   │   │   ├── inference.ts           # QVAC SDK adapter implementing the ports + audit hooks
│   │   │   └── inference.fakes.ts     # in-memory fakes for tests
│   │   └── package.json
│   ├── agents/
│   │   ├── src/
│   │   │   ├── triage.ts              # tools, prompt, run()
│   │   │   ├── walkthrough.ts         # protocol-step loop
│   │   │   ├── referral.ts            # json_schema-constrained SBAR generator
│   │   │   ├── self-assessment.ts     # json_schema confidence probe
│   │   │   └── prompts/               # plain-string templates, no logic
│   │   └── package.json
│   ├── rag/
│   │   ├── src/
│   │   │   ├── search.ts              # ragSearch wrapper, returns Hit[] with metadata
│   │   │   ├── cite.ts                # CitationResolver: chunkId → "WHO IMCI, p.23, §..."
│   │   │   ├── workspace.ts           # open/close workspace, dim validation
│   │   │   └── ingest/                # build-time only, executed via scripts
│   │   │       ├── pdf.ts             # PDF → text
│   │   │       ├── chunker.ts         # section-aware chunker w/ metadata
│   │   │       └── manifest.ts        # KB manifest schema
│   │   └── package.json
│   ├── mesh/
│   │   ├── src/
│   │   │   ├── delegate.ts            # loadModel({delegate:..., fallbackToLocal:true}) helper
│   │   │   ├── heartbeat.ts           # probe + cached state
│   │   │   ├── escalate.ts            # deterministic escalation policy
│   │   │   └── route.ts               # given (case, state) → which modelId
│   │   └── package.json
│   └── tools/
│       ├── src/
│       │   ├── ddi.ts                 # drug-drug interaction tool (openFDA + WHO MF)
│       │   ├── dosing.ts              # dose calculator tool
│       │   ├── breathing-rate.ts      # compute and classify breathing rate
│       │   ├── danger-signs.ts        # IMCI structured rubric (deterministic)
│       │   ├── triage-classify.ts     # tool that returns a Classification
│       │   └── schemas.ts             # zod schemas → tool definitions
│       └── package.json
├── kb/                                # built knowledge base (committed)
│   ├── source/                        # raw PDFs/HTML (gitignored if too large; LFS optional)
│   ├── chunks/                        # built JSON: per-source NDJSON of chunks + metadata
│   ├── manifest.json                  # KB version + provenance + checksums
│   └── workspace.sqlite               # ragSaveEmbeddings output, embedded once on first boot
├── scripts/
│   ├── ingest.mjs                     # PDF/HTML → chunks NDJSON
│   ├── embed-kb.mjs                   # chunks NDJSON → workspace.sqlite (embeds on the laptop)
│   ├── bench/
│   │   ├── pi5.mjs                    # 20-case IMCI eval on the Pi
│   │   ├── laptop.mjs                 # 20-case IMCI eval on the laptop
│   │   └── eval-cases.json            # synthetic IMCI scenarios + expected classifications
│   └── audit/
│       └── aggregate.mjs              # audit-log.ndjson → submission/audit-log.json
├── submission/                        # judging artefacts (committed where committable)
│   ├── audit-log.schema.json
│   ├── bench-schema.json
│   ├── README.demo.md                 # video script + reproduce instructions
│   └── .gitkeep
├── infra/
│   └── pi/
│       ├── hostapd.conf               # LifelineMesh SSID config
│       ├── dnsmasq.conf
│       ├── avahi-lifeline.service     # mDNS lifeline.local
│       ├── lifeline-junior.service    # systemd unit for apps/junior-node
│       └── install.sh                 # idempotent provisioning script
├── docs/                              # this spec set
├── remote-apis.json                   # mandatory submission file — empty array (no remote APIs at runtime)
└── README.md                          # title, pitch, hardware, reproduce, demo link, screenshot
```

## 5. Constants (canonical list)

`packages/core/src/constants.ts` is the only place these values appear:

```ts
// MedPsy has no built-in SDK constant → load by URL. Other models use built-in registry constants.
export const MODELS = {
  JUNIOR_LLM_URL: "https://huggingface.co/qvac/MedPsy-1.7B-GGUF/resolve/main/medpsy-1.7b-q4_k_m-imat.gguf",
  SENIOR_LLM_URL: "https://huggingface.co/qvac/MedPsy-4B-GGUF/resolve/main/medpsy-4b-q4_k_m-imat.gguf",
  DEV_LLM: "QWEN3_1_7B_INST_Q4",                 // built-in: MedPsy base arch, fast dev/CI stand-in (ADR-014)
  TOOL_FALLBACK_LLM: "LLAMA_TOOL_CALLING_1B_INST_Q4_K", // built-in: tool-call reliability fallback (ADR-013)
  EMBEDDING: "EMBEDDINGGEMMA_300M_BF16",         // built-in, 768-dim
  EMBEDDING_FALLBACK_URL: "https://huggingface.co/Qwen/Qwen3-Embedding-0.6B-GGUF/resolve/main/qwen3-embedding-0.6b-q4_k_m.gguf", // 1024-dim, lighter RAM
  WHISPER: "WHISPER_EN_BASE_Q8_0",               // built-in; fallback WHISPER_EN_TINY_Q8_0
  WHISPER_FALLBACK: "WHISPER_EN_TINY_Q8_0",
  TTS: "TTS_EN_SUPERTONIC_Q4_0",                 // built-in
} as const;

export const CTX = { JUNIOR: 2048, SENIOR: 4096 } as const;
export const TIMEOUTS_MS = { DELEGATION_FIRST: 60_000, DELEGATION_WARM: 5_000, HEARTBEAT: 3_000 } as const;
export const PORTS = { JUNIOR_HTTP: 8787, SENIOR_HTTP: 8788 } as const;
export const ESCALATE = { CONFIDENCE_THRESHOLD: 0.7, MAX_TURNS_BEFORE_ESCALATE: 6, TOOL_ERROR_WINDOW: 5, TOOL_ERROR_THRESHOLD: 3 } as const;
export const RAG = { TOP_K: 4, MIN_SIMILARITY: 0.55, EMBED_DIM: 768 } as const; // 768 = EmbeddingGemma; 1024 if fallback embedder
export const AUDIO = { FORMAT: "f32le", LANGUAGE: "en" } as const;
export const KB_VERSION = "lifeline-v1";
export const PROVIDER_SEED_ENV = "QVAC_HYPERSWARM_SEED";
export const AP = { SSID: "LifelineMesh", HOSTNAME: "lifeline.local" } as const;
```

(Values reviewed at story time; the structure does not move.)

## 6. CI workflow contract (`.github/workflows/ci.yml`)

Steps, in order, all required:

1. Checkout, setup pnpm@9 + node@22, `pnpm i --frozen-lockfile`.
2. `pnpm typecheck` (`tsc --noEmit` on every workspace).
3. `pnpm lint` (eslint, max-warnings=0).
4. **400-line shell check**: find all `*.ts`/`*.tsx`/`*.mjs`/`*.js` under `apps/`, `packages/`, `scripts/`; fail if any file > 400 SLOC (`grep -vE '^\s*(//|$)'` for skip-blank+skip-comments).
5. `pnpm test --coverage` (vitest), coverage gate ≥ 70 % lines on `packages/` (lower bar for `apps/` because of the SDK boundary).
6. `pnpm schema:check`: validate `remote-apis.json`, `submission/audit-log.schema.json`, `kb/manifest.json` against their JSON schemas.
7. `pnpm build` (every workspace builds, including the web app).
8. **Optional non-blocking** `arm-smoke.yml`: on `ubuntu-24.04-arm` runner, install SDK, load a tiny 0.6B GGUF, run one completion — proves the arm64 prebuild loads. Caches model with `actions/cache`.

## 7. Banned patterns
- No `console.*` outside `scripts/`.
- No `any`, no `as any`. Use `zod` for unknowns.
- No magic numbers/strings in business logic (all to `constants.ts`).
- No `import "@qvac/sdk"` outside `packages/core/src/inference.ts` (`no-restricted-imports`).
- No raw `process.env.X`; everything via `packages/core/src/env.ts` (zod-validated).
- No mocks in the demo path. Tests may mock the ports; the running app never does.
- No `setTimeout`-based polling for state that should be event-driven (use WS events).
- No CSS-in-JS (Tailwind only). No inline styles in JSX.
- No `fetch` calls to the internet from the running app (everything is local; CI catches via lint banned-modules + audit of `remote-apis.json` = `[]`).

## 8. Deployment story (the Pi)

`infra/pi/install.sh` is idempotent and does:
1. Install Node 22 (NodeSource), pnpm, system deps (`hostapd`, `dnsmasq`, `avahi-daemon`, `ffmpeg`).
2. Copy `infra/pi/hostapd.conf`, `dnsmasq.conf`, enable AP mode.
3. Copy `avahi-lifeline.service`, enable `lifeline.local` mDNS.
4. Run `pnpm i --filter junior-node --prod`, `pnpm --filter junior-node build`.
5. Install `lifeline-junior.service` systemd unit (env file holds `QVAC_HYPERSWARM_SEED`, log level, etc.).
6. `systemctl enable --now lifeline-junior`.

The laptop side runs `pnpm --filter senior-node start` from a checkout. The `QVAC_HYPERSWARM_SEED` env is set in both places (same hex string) so the Pi knows the senior's public key.

## 9. Observability + audit

- App logs: `pino` JSON, stdout. systemd journal collects them; readable via `journalctl -u lifeline-junior -f`.
- Audit log: dedicated `pino` instance writes `submission/audit-log.ndjson`. Schema in `submission/audit-log.schema.json`. Fields: `ts, op, modelId, modelSrc, requestId, node ("pi"|"senior-delegated"|"senior-local"), promptTokens, generatedTokens, cacheTokens, ttftMs, totalMs, tps, backendDevice, stopReason, toolCallsCount, delegated, providerPublicKeyPrefix, sessionId, caseId`.
- `scripts/audit/aggregate.mjs` rolls NDJSON to the structured JSON submission expects.

## 10. Security + safety
- The Pi listens only on `0.0.0.0:8787` over its own AP — no upstream internet path.
- `remote-apis.json = []`. Verified by CI.
- All KB content is open-licensed (WHO, MSF for non-commercial use within KB, openFDA public domain). Licenses listed in `kb/manifest.json`.
- Demo scenarios are synthetic; never use real PHI.
- README and video include the "research/demonstration only" disclaimer.

## 11. Open items (day-1 hardware verification — tracked in stories)
1. `@qvac/transcription-whispercpp` and `@qvac/tts-ggml` linux-arm64 prebuilds present.
2. Combined RAM under steady load ≤ 3.4 GB on Pi 5 4 GB.
3. Profiler `completionStats` populated for delegated completions (else fallback to consumer-side TTFT measurement, already designed in adapter).
4. MedPsy-1.7B hermes tool-call adherence ≥ 80 % on our 20-case eval (else `LLAMA_TOOL_CALLING_1B_INST_Q4_K` or `json_schema` routing fallback per ADR-013).

_Resolved during SDK validation (2026-06-13):_ ~~SQLite workspace built on x86 opens on arm64~~ — sqlite-wasm is arch-independent (ADR-006). ~~Browser-pushed audio~~ — locked to whole-utterance HTTP POST → temp file → `transcribe({audioChunk})` (ADR-011).
