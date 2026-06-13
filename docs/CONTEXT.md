# Lifeline Mesh — Spec Index

You're reading the project spec set. This file points to the four canonical documents and lists everything that's been decided versus everything still open.

## Read these in order

1. **PRD.md** — what we're building and the 5-minute demo. Start here.
2. **architecture.md** — the locked stack, the 400-line cap rule, the ports/adapters seam, ADRs, CI workflow, banned patterns, repo layout, constants.
3. **ux-spec.md** — anchor product (Community Health Toolkit), design tokens, route shape, components, voice flow.
4. **epics.md** — 11 epics, dependency graph, time estimates.
5. **sprint-status.yaml** — every story, its dependencies, its status. The orchestrator updates this.
6. **stories/** — one file per story. Two are written today as the format anchor (`story-eslint-400-line-cap.md`, `story-escalation-policy.md`); the rest are expanded after Abu's review gate.

## What's locked
- Project name: **Lifeline Mesh**.
- Tracks: **Tinkerer (primary) + Psy Models (secondary)**.
- Hardware target: **Raspberry Pi 5 4 GB** (junior) + **any laptop ≥ 8 GB** (senior).
- Models: **MedPsy-1.7B Q4_K_M** (Pi), **MedPsy-4B Q4_K_M** (laptop), **Qwen3-Embedding-0.6B Q4**, **whisper.cpp base.en**, **Supertonic** TTS (espeak-ng fallback).
- Stack: **TypeScript + pnpm + Node 22 + Fastify + Vite/React + Tailwind + pino + vitest + @qvac/sdk 0.12.2**.
- Engineering rules: **400-line file cap (ESLint + CI shell guard), no magic numbers, no console.log, no any, SDK only through the adapter, pino logger, named constants**.
- Audit log: **SDK's `completionStats` event → NDJSON → aggregated submission JSON** (no internals hacking).
- RAG: **pre-curated chunks committed in `kb/chunks/`, embedded at build time on the laptop, SQLite workspace shipped to the Pi**. ADR-005/006.
- Escalation: **deterministic policy (danger signs / confidence < 0.7 / mechanical signals)** — not an LLM. ADR-008.
- Tool dialect: **hermes** (MedPsy is Qwen3-based). ADR-012.
- Demo headline: **the router-cable pull moment** + audit log proof.

## Open items (day-1 hardware verification, tracked in stories)
1. `@qvac/transcription-whispercpp` and `@qvac/tts-ggml` linux-arm64 prebuilds present.
2. Combined RAM under steady load ≤ 3.4 GB on Pi 5 4 GB.
3. `completionStats` populated on delegated completions.
4. MedPsy-1.7B hermes tool-call adherence ≥ 80 % on 20-case eval.
5. SQLite RAG workspace built on x86 opens on arm64.
6. Browser-pushed audio → `transcribe()` works (else push-to-talk HTTP POST is the locked path).

## Where research lives
Above this folder: `research/qvac-2026/`.
- `CONTEXT.md` (the research entrypoint, separate from this spec entrypoint)
- `13-architecture-validation.md` (the source of every ADR here)
- `11-resources-clinic-mesh.md` (the resource pack)
- `08-tool-calling-deep-dive.md` (the SDK internals findings)
- `09-idea-landscape.md` (why this idea, not others)
- `12-head-to-head.md` (the wedge decision record)

## Review gate
This spec is presented to Abu for review **before** the orchestrator fires. After approval the remaining ~48 stories are expanded into individual story files using the format anchored by the two existing examples.
