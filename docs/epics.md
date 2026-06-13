# Epics — Lifeline Mesh

11 epics. Sized to ≤ 2 h of focused coding-agent time each (with our AI-pair velocity). Dependency arrows below; build order is bottom-up (E1 → E2 → E3 → ... mostly linear, with the UI in parallel after E2).

## Dependency graph (text)

```
E1 (Scaffold + CI)
  └─► E2 (Adapter + Audit log)
        ├─► E3 (KB ingest + embed)        ─► E4 (RAG runtime + citations)
        ├─► E5 (Agents + tools)
        ├─► E6 (Referral note)
        ├─► E7 (Mesh + delegation + escalation)
        ├─► E8 (Voice pipeline)
        └─► E9 (Web UI) — runs in parallel after E2
E4, E5, E6, E7 ─► E10 (Pi packaging + AP/mDNS + systemd)
ALL ───────────► E11 (Bench harness + submission artefacts + video)
```

---

## Epic 1 — Scaffold + CI/CD gate
**Business value:** Without this, every later epic ships unmeasured. The 400-line cap and lint gate are non-negotiable engineering rules; setting them up now prevents debt accumulation later.
**Dependencies:** none.
**Estimated coding time:** 1.5 h
**Stories:**
- `story-monorepo-bootstrap` — pnpm workspace + workspaces + tsconfig + prettier.
- `story-eslint-400-line-cap` — flat config with max-lines, no-magic-numbers, no-console, no-explicit-any, no-restricted-imports.
- `story-ci-workflow` — `.github/workflows/ci.yml` running typecheck + lint + 400-line shell check + vitest + schema validate + build.
- `story-arm-smoke-workflow` — `.github/workflows/arm-smoke.yml` on `ubuntu-24.04-arm` loading a tiny GGUF (non-blocking).

## Epic 2 — Inference adapter + audit log
**Business value:** The single seam every other epic depends on. Centralises SDK calls, captures the submission-mandated TTFT/tok-s audit log on every call, and gives tests a mock surface so the whole codebase is testable without native deps.
**Dependencies:** E1.
**Estimated coding time:** 2 h
**Stories:**
- `story-core-ports` — define `LlmPort`/`SttPort`/`TtsPort`/`EmbedPort`/`RagPort`/`MeshPort` interfaces in `packages/core/src/ports.ts` + zod schemas for inputs.
- `story-inference-adapter` — `packages/core/src/inference.ts` implementing all ports against `@qvac/sdk` 0.12.2, with `completionStats` event captured and forwarded to audit.
- `story-inference-fakes` — in-memory fakes in `inference.fakes.ts` (deterministic, used by every downstream test).
- `story-audit-writer` — `packages/core/src/audit.ts` NDJSON writer + zod schema + `submission/audit-log.schema.json`.
- `story-logger-factory` — `packages/core/src/logger.ts` — pino app + pino audit child instances, namespaced.
- `story-constants-and-env` — `constants.ts` + `env.ts` (zod-validated env).

## Epic 3 — Knowledge base ingest (build-time pipeline)
**Business value:** A small, surgically curated KB is the difference between a citation demo and a chatbot. Pre-chunked NDJSON committed to the repo makes reproduction trivial for judges.
**Dependencies:** E1.
**Estimated coding time:** 2 h
**Stories:**
- `story-pdf-text-ingest` — `scripts/ingest.mjs` — PDF/HTML → text per source (IMCI chart booklet, BEC, WHO MF, MSF, START rubrics).
- `story-section-chunker` — `packages/rag/src/ingest/chunker.ts` — section-aware chunker preserving table semantics + metadata.
- `story-kb-manifest` — `kb/manifest.json` schema (sources, licences, checksums, chunk counts).
- `story-imci-curated-subset` — hand-curate 15 highest-value IMCI sections (danger signs, fever, cough, diarrhoea, dosing) into `kb/chunks/imci.ndjson`.
- `story-eval-cases` — `scripts/bench/eval-cases.json` — 20 synthetic IMCI scenarios with expected classifications.

## Epic 4 — RAG runtime + citation resolver
**Business value:** Every clinical claim in the demo must resolve to `doc + section + page`. Without this, the UX promise of the PRD doesn't hold.
**Dependencies:** E2, E3.
**Estimated coding time:** 1.5 h
**Stories:**
- `story-embed-kb-script` — `scripts/embed-kb.mjs` runs on the laptop, calls `embed()` + `ragSaveEmbeddings({metadata})` to produce `kb/workspace.sqlite`.
- `story-rag-search-wrapper` — `packages/rag/src/search.ts` returns `Hit[]` typed with metadata.
- `story-citation-resolver` — `packages/rag/src/cite.ts` — `chunkId → "WHO IMCI Chart Booklet, p. 23, §Cough"` plus inline quote excerpt.
- `story-workspace-portability` — open the x86-built SQLite workspace on arm64 (smoke test on Pi).

## Epic 5 — Agents + tools
**Business value:** The judging criteria explicitly reward multi-agent orchestration + tool calling. This epic delivers both, on a small model, with grammar-constrained reliability.
**Dependencies:** E2, E4.
**Estimated coding time:** 2 h
**Stories:**
- `story-tool-schemas` — `packages/tools/src/schemas.ts` — zod schemas → SDK tool definitions for all tools.
- `story-ddi-tool` — `packages/tools/src/ddi.ts` (openFDA + WHO MF chunks lookup).
- `story-clinical-tools` — `breathing-rate`, `danger-signs`, `triage-classify`, `dosing`.
- `story-triage-agent` — `packages/agents/src/triage.ts` — tool-driven, hermes dialect, static toolsMode.
- `story-walkthrough-agent` — `packages/agents/src/walkthrough.ts` — step-loop bound to a matched protocol.
- `story-self-assessment-probe` — `packages/agents/src/self-assessment.ts` — json_schema confidence probe.

## Epic 6 — Referral note generator
**Business value:** A defensible "real-world utility" beat for the judges — solves a documented CHW pain point.
**Dependencies:** E2, E5.
**Estimated coding time:** 1 h
**Stories:**
- `story-referral-schema` — SBAR zod schema with citation fields.
- `story-referral-generator` — `packages/agents/src/referral.ts` — `responseFormat: json_schema` call; runs on junior first, re-runs on senior if escalation fired.
- `story-referral-render` — `packages/agents/src/referral-render.ts` — JSON → clean printable markdown + PDF (via pandoc/markdown-pdf).

## Epic 7 — Mesh + delegation + escalation policy
**Business value:** The wow moment. Without this we are a single-device chatbot. The deterministic escalation policy is defensible to clinical judges in a way "LLM decides" is not.
**Dependencies:** E2.
**Estimated coding time:** 2 h
**Stories:**
- `story-senior-provider` — `apps/senior-node/src/provider.ts` — `startQVACProvider()`, deterministic key from `QVAC_HYPERSWARM_SEED`.
- `story-mesh-heartbeat` — `packages/mesh/src/heartbeat.ts` — probe + cached state, `3 s` timeout.
- `story-delegate-helper` — `packages/mesh/src/delegate.ts` — `loadModel({delegate, fallbackToLocal:true})` wrapped with our adapter so audit log captures `delegated:true`.
- `story-escalation-policy` — `packages/mesh/src/escalate.ts` — deterministic rules + self-assessment + mechanical signals (three-layer policy).
- `story-route-by-state` — `packages/mesh/src/route.ts` — `(case, state) → modelId` picker.

## Epic 8 — Voice pipeline
**Business value:** The demo IS voice-driven. Without this, the demo collapses to typed prompts and we lose the Tinkerer/Mobile sympathy.
**Dependencies:** E2, E5.
**Estimated coding time:** 1.5 h
**Stories:**
- `story-mediarecorder-capture` — browser-side `useAudioCapture` hook + opus webm upload via multipart POST.
- `story-utterance-route` — Fastify `/audio/utterance` endpoint → SDK `transcribe()` → returns transcript + duration.
- `story-tts-playback` — server pushes opus chunks over WS; UI queues + plays via `<audio>`.
- `story-voice-fallback` — espeak-ng escape hatch if Supertonic arm64 fails.

## Epic 9 — Web UI
**Business value:** This is what the judges see for 4 of the 5 demo minutes. The UI design lives in `ux-spec.md`; this epic builds it.
**Dependencies:** E2 (for WS schema); can run in parallel with E5–E8 against fakes.
**Estimated coding time:** 2 h
**Stories:**
- `story-vite-scaffold` — Vite + React + Tailwind + tokens.
- `story-case-console-shell` — header, footer, single-column layout, routing.
- `story-protocol-step-card` — component + WS frame handling.
- `story-citation-chip-drawer` — chip + drawer with the quoted chunk.
- `story-escalation-banner` — purple banner + collapsed thinking trace accordion.
- `story-classification-and-referral` — verdict card + referral modal.
- `story-audit-viewer` — `/audit` route: KPI tiles + streaming table + export.
- `story-mesh-status-pill` — header pill bound to heartbeat events.

## Epic 10 — Pi packaging (AP mode + mDNS + systemd)
**Business value:** Reproducibility — judges need to clone+run on a Pi. The AP-mode + `lifeline.local` story is also the demo's most physical moment.
**Dependencies:** E2 (we want the audit log up on the Pi from boot), E9 (the web bundle must be built).
**Estimated coding time:** 1.5 h
**Stories:**
- `story-hostapd-dnsmasq` — `infra/pi/hostapd.conf` + `dnsmasq.conf` + provision steps.
- `story-mdns-avahi` — `avahi-lifeline.service` → `lifeline.local`.
- `story-systemd-unit` — `lifeline-junior.service` with env file.
- `story-install-script` — `infra/pi/install.sh` idempotent provisioner.

## Epic 11 — Bench harness + submission artefacts + video
**Business value:** The submission requires structured logs, hardware proof, demo video, and reproduction steps. This epic produces all of them and the README that turns them into a story a judge can verify in 5 minutes.
**Dependencies:** E2–E10.
**Estimated coding time:** 2 h
**Stories:**
- `story-bench-pi5` — `scripts/bench/pi5.mjs` runs the 20-case eval on junior alone and junior+senior, writes `submission/bench-pi5.json`.
- `story-bench-laptop` — `scripts/bench/laptop.mjs` on senior, writes `submission/bench-laptop.json`.
- `story-audit-aggregate` — `scripts/audit/aggregate.mjs` rolls NDJSON → `submission/audit-log.json` matching schema.
- `story-remote-apis-file` — committed `remote-apis.json = []` with schema validation.
- `story-readme-and-screenshots` — root README (PRD pitch, hardware specs + screenshots placeholders, reproduce steps, video link).
- `story-video-script` — `submission/README.demo.md` — 5-min shot list + on-screen captions.
- `story-build-in-public-checklist` — Discord thread + X hashtag + 3 update posts cadence committed.

---

## Total estimated coding time
~ 18.5 h, well within scope. Buffer goes to: KB curation (manual), tool-call reliability tuning if the 1.7B falls below 80 % on eval, video production.

## Story status tracking
All story states live in `sprint-status.yaml`. Status flow: `PENDING → IN_PROGRESS → COMPLETE`.
