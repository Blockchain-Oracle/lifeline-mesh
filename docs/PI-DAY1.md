# Raspberry Pi 5 — day-1 setup & verification checklist

The on-laptop pipeline is fully verified (see commit history / README). These items
must be confirmed on the **actual Pi 5 (4 GB), Raspberry Pi OS Lite 64-bit, Node 22**
before the submission. They cannot be checked on the dev laptop.

## Provision

```bash
git clone https://github.com/Blockchain-Oracle/lifeline-mesh.git
cd lifeline-mesh
bash infra/pi/install.sh --check     # validate prerequisites (no changes)
sudo bash infra/pi/install.sh        # provision: deps, AP, mDNS, build, service
```

Then join Wi-Fi **LifelineMesh** and open **http://lifeline.local:8787**.

## Verify (record results for the submission bench)

1. [ ] `@qvac/sdk` loads + MedPsy-1.7B runs on arm64 (the service starts; `systemctl status lifeline-junior`).
2. [ ] Combined-load RAM stays ≤ ~3.4 GB: `free -m` while a case is running (LLM + embed + RAG resident).
3. [ ] Measure + record TTFT and tokens/sec: `node scripts/bench/eval.mjs` (or a single `scripts/demo.mjs` run) on the Pi.
4. [ ] whisper (`WHISPER_EN_BASE_Q8_0`) and Supertonic TTS arm64 prebuilds load (run the voice round-trip).
5. [ ] The committed `kb/workspace.sqlite` (built on x86) opens and searches on arm64 (it should — sqlite-wasm is arch-independent).
6. [ ] AP + mDNS work: a phone joins `LifelineMesh` and reaches `http://lifeline.local:8787`.
7. [ ] Delegated `completionStats` present when escalating to the laptop senior over the mesh.

## Fallbacks if RAM is tight (4 GB)
- Lighter STT: `WHISPER_EN_TINY_Q8_0`.
- Smaller embedder by URL: `Qwen3-Embedding-0.6B-Q4` (rebuild `kb/workspace.sqlite`, EMBED_DIM→1024).
- Sequential model load/unload between turns; `espeak-ng` instead of Supertonic.
- Reduce `CTX.SENIOR` (8192) toward 4096 for the junior loop.

## Known install risk (found via arm64 container test, 2026-06-13)
The full `@qvac/sdk` install pulls native prebuilds for **every** addon (llm, embed,
whisper, tts, diffusion, ocr, vla, classification, parakeet) — extracting them spiked
memory and was **OOM-killed in a memory-limited arm64 VM**. `infra/pi/install.sh` now
adds 2 GB swap and lowers install concurrency before `pnpm install` to survive on a
4 GB Pi. If install still OOMs: add more swap, or run `pnpm install` once with the Pi
otherwise idle. (Runtime RAM for inference is separate — see item 2 above.)
