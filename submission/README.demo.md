# Demo video — shot list (≤ 5:00)

Upload to YouTube as **unlisted**; link in the DoraHacks submission. Open with the
on-screen line: *"Synthetic cases — research/demonstration only."*

| # | Time | Shot | On-screen caption | What it proves |
|---|------|------|-------------------|----------------|
| 1 | 0:00–0:25 | Photo of a rural clinic / camp; narrator | "No doctor. No internet. Today they use a paper booklet." | The problem + the offline constraint |
| 2 | 0:25–0:35 | Pi 5 on the desk (no screen) + a phone joining Wi-Fi `LifelineMesh`, opening `http://lifeline.local:8787` | "An $80 Raspberry Pi. Phone joins its Wi-Fi. No internet." | Real edge hardware, zero infra |
| 3 | 0:35–1:30 | CHW speaks a sick-child case; on the phone, the assessment appears with the **classification** and a **citation card** open at "WHO IMCI · p.6" | "It follows the WHO protocol and shows its source." | Voice + RAG + deterministic IMCI + citation, on the Pi |
| 4 | 1:30–2:45 | A hard/severe case → "Escalating to senior brain" banner → **cut to the laptop ~3 m away**; **pull the router cable on camera**; the senior MedPsy-4B reviews and the answer returns to the phone | "The hard case crosses a local-only mesh to a bigger model — with the internet unplugged." | **The wow moment**: real P2P delegation, no cloud |
| 5 | 2:45–3:20 | One tap → structured **SBAR referral note** populated from the case, with citations | "It even writes the referral letter." | Real-world utility, offline |
| 6 | 3:20–4:10 | Open the audit view / `submission/audit-log.json`: model loads, TTFT, tokens/sec, which device ran each call | "Every inference logged: TTFT, tokens/sec, on-device GPU." | Auditability + the mandated artifact |
| 7 | 4:10–4:40 | The `scripts/bench/eval.mjs` run: 80% IMCI accuracy, 100% cited; note the escalation safety net | "80% on the small model — hard cases escalate to the 4B." | Honest performance + the mesh's purpose |
| 8 | 4:40–5:00 | Close on hardware specs + "Apache-2.0 · MedPsy + QVAC SDK · Internet: 0 bytes." | — | Reproducibility + sponsor-native |

**Must be unmistakable on screen:** (3) the cited WHO page, (4) the router-cable pull + mesh escalation, (5) the referral note, (6) the audit log.

**Artifacts to attach alongside the video:** `submission/audit-log.json` (inference log), `remote-apis.json` (empty), hardware system-profiler screenshots, this repo.
