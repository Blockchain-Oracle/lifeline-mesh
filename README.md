# Lifeline Mesh

**An offline "clinic-in-a-box": it walks a community health worker through WHO clinical protocols by voice, cites the exact guideline page, writes the referral letter, and — when a case is hard — escalates it across a local-only P2P mesh to a bigger medical model on the supervisor's laptop. 100% on-device. Zero bytes to the cloud.**

Tether **QVAC "Unleash Edge AI"** hackathon · Tracks: **Tinkerer** (Raspberry Pi 5) + **Psy Models** (MedPsy) · License: **Apache-2.0**
Repo: https://github.com/Blockchain-Oracle/lifeline-mesh

All AI — LLM, embeddings/RAG, structured extraction, STT, TTS, and P2P delegation — runs on [`@qvac/sdk`](https://qvac.tether.io). No cloud APIs. `remote-apis.json` is empty and CI-enforced.

---

## The problem

In rural clinics, refugee camps, and disaster zones there is often **no doctor and no internet**. A community health worker (CHW) — trained for weeks, not years — flips through a paper WHO **IMCI** booklet (Integrated Management of Childhood Illness) and guesses. Mistakes cost children's lives. Cloud AI is useless where there's no connectivity, and sending patient data to the cloud is a non-starter.

## What it does

A two-tier, fully offline system:

- **Junior node (Raspberry Pi 5):** MedPsy-1.7B + RAG over the real WHO IMCI booklet + voice. The CHW speaks a case; the box assesses it against the protocol, **shows the exact page it cites**, and writes a structured referral letter — all on a ~$80 computer.
- **Senior node (the supervisor's laptop):** MedPsy-4B. When the junior is uncertain or the case is severe, the Pi **escalates over a local-only Hyperswarm P2P mesh** — no server, no internet — and the bigger model reviews it. If the laptop is unreachable, the box keeps working alone.

## Architecture: assess by structured extraction, classify by deterministic engine

The clinically load-bearing decision is **not** left to a 1.7B model's free text. Instead:

1. **Grammar-constrained extraction** (`responseFormat: json_schema`): the model fills a structured findings form (which symptoms are present, danger signs, vitals) — reliable even on a 1.7B. A deterministic keyword detector backs it up so an explicit "52 breaths/min" is never missed.
2. **Deterministic IMCI engine** (pure, unit-tested code) does the classification across all symptom paths and **owns the cited result**. Rules over vibes.
3. **Escalation policy** (deterministic): severe or uncertain cases route to the senior 4B over the mesh.

This is why every answer is correct-by-construction and carries a real WHO citation — and why the small model's reading variance is bounded by an explicit escalation path, not hidden.

```
 CHW phone ──Wi-Fi──> Raspberry Pi 5 (junior)               Supervisor laptop (senior)
  voice/UI            MedPsy-1.7B + EmbeddingGemma RAG        MedPsy-4B
                      deterministic IMCI engine  ──Hyperswarm P2P (no internet)──>  review
                      whisper STT / Supertonic TTS            (fallback: junior works alone)
```

## Verified results (on this dev laptop, real models)

| What | Result |
|---|---|
| IMCI classification accuracy (junior MedPsy-1.7B, 20-case eval) | **80%**, **100% valid structured extraction**, **100% cited** |
| RAG retrieval | demo query → correct WHO **p.6** protocol, top-ranked |
| P2P mesh | real 2-process delegation over Hyperswarm (no internet) + graceful local fallback |
| Voice | Supertonic TTS → whisper STT round-trip on real audio |
| Referral note | clinically-accurate SBAR letter, cited, offline |
| Perf (laptop, Metal GPU) | ~85–98 tok/s, TTFT ~70–130 ms on MedPsy-1.7B |

The remaining ~20% is the 1.7B's free-text reading variance — exactly what the senior-4B escalation is for. The deterministic engine itself is provably correct (covered by unit tests).

> On-Pi numbers (RAM, arm64 TTFT/tok-s) are captured per `docs/PI-DAY1.md` on the physical Pi.

## Run it

**On a laptop (dev / senior node):**
```bash
git clone https://github.com/Blockchain-Oracle/lifeline-mesh.git && cd lifeline-mesh
pnpm install && pnpm build
node scripts/demo.mjs        # one case end-to-end: RAG -> assess -> classify -> cited result
node scripts/bench/eval.mjs  # the 20-case IMCI accuracy eval
pnpm --filter @lifeline/junior-node start   # the serving app at http://localhost:8787
```

**On the Raspberry Pi 5 (Raspberry Pi OS Lite 64-bit):** see `docs/PI-DAY1.md`
```bash
sudo bash infra/pi/install.sh   # deps + Wi-Fi AP + mDNS + build + systemd service
# join Wi-Fi "LifelineMesh", open http://lifeline.local:8787
```

**The P2P mesh (two machines):**
```bash
# laptop (senior): prints a provider key
QVAC_HYPERSWARM_SEED=<64-hex> pnpm --filter @lifeline/senior-node start
# Pi (junior): set LIFELINE_SENIOR_KEY=<that key> in infra/pi/lifeline.env
```

## Engineering

TypeScript pnpm monorepo. Enforced in CI: 400-line file cap, no magic numbers, no stray console, `@qvac/sdk` import confined to one adapter seam, lint + 110+ tests must pass. The SDK runs on the Bare runtime — see `.npmrc` (`node-linker=hoisted` + `require-asset`) for the required setup.

- `packages/core` — SDK adapter seam (LLM/embed/STT/TTS/mesh), audit log, ports + fakes
- `packages/rag` — section-aware WHO chunker, sqlite-wasm vector store, citation resolver
- `packages/tools` — deterministic IMCI classifiers (provably correct)
- `packages/agents` — extraction case runner + referral generator
- `packages/mesh` — escalation policy, heartbeat, routing
- `apps/{junior,senior}-node` — the two devices · `apps/web` — placeholder UI (designer in progress)

## Disclaimer
For research and demonstration only — **not** a substitute for professional clinical judgement. All demo cases are synthetic.
