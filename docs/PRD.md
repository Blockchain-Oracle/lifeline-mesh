# PRD — Lifeline Mesh

**Project:** Lifeline Mesh
**Hackathon:** Tether QVAC "Unleash Edge AI"
**Tracks targeted:** Tinkerer (primary, Raspberry Pi 5 4 GB) + Psy Models (secondary, MedPsy)
**Deadline:** 2026-06-21 23:59 UTC. Early-bird safe target: **2026-06-14** (site shows 14 in Rules, 17 in Prizes — June 14 is safe).
**Repo:** Apache 2.0, github.com/<owner>/lifeline-mesh (created Phase 1).
**One sentence:** An offline clinic-in-a-box that walks community health workers through WHO clinical protocols by voice, and escalates hard cases over a local-only P2P mesh to a "senior brain" running on the supervisor's laptop — all 100% on-device.

## Goal
In the places where children are dying because the nearest doctor is hours away and the internet is dead, Lifeline Mesh turns a $80 Raspberry Pi and the village nurse's laptop into a two-tier care system: a small medical model on the Pi walks a community health worker through the official WHO IMCI protocol by voice, cites the page it's reading from, generates the referral note, and — when the case is too hard — silently hands the case across the local mesh to a bigger medical model on the supervisor's laptop. Nothing leaves the room. The judge gets a five-minute video where a real sick-child case is handled by voice on a tiny box, the hard question hops to the laptop without internet, and the answer comes back cited and signed.

## One-line pitch
A Raspberry Pi clinic that follows WHO protocols by voice and escalates hard cases to a laptop over a local-only P2P mesh — 100% offline.

## Sponsor-native fit
- **Tinkerer track**: every AI workload runs under @qvac/sdk on a Raspberry Pi 5 with ≤ 4 GB RAM; the demo proves "wow it actually runs on that" with reproducible TTFT and tok/s.
- **Psy Models track**: MedPsy-1.7B (junior) and MedPsy-4B (senior) are the core brains — not bolted-on chatbots. The mesh is the production-grade pattern judges asked for: phone→SBC→desktop delegation, real multi-agent + tool calling, real RAG with citations.

## The five-minute demo (judge walkthrough)
1. **The setting (10 s):** narrator over a photo of a real rural health post or refugee clinic. "There's no doctor. There's no internet. Today they're flipping through a paper chart booklet. We'll change that."
2. **Voice intake (40 s):** CHW on camera, phone in hand, joins the Pi's Wi-Fi (`LifelineMesh` SSID) and opens `http://lifeline.local`. Pi is on the desk, no screen. CHW says: *"Child, about two years old, fever three days, breathing fast, not eating."* The Pi's medical model transcribes, classifies, and starts walking through the WHO IMCI flow. On the phone we see protocol steps appear as cards.
3. **Cited reasoning (45 s):** the Pi asks: *"Count breaths for one minute. Is it more than 40?"* CHW: *"Yes, 52."* The Pi declares **severe pneumonia**, with a citation card open at "WHO IMCI Chart Booklet, p. 23, §Cough/Difficult breathing." Every claim has a source.
4. **The mesh moment (60 s):** CHW asks a follow-up the small model can't confidently solve — child also on iron syrup, vomiting, dehydration markers borderline. A banner appears: *"Escalating to senior brain over local mesh."* On camera we cut to the laptop ~3 m away; the senior MedPsy-4B receives the case over Hyperswarm DHT (no internet visible — pull the router cable on screen). 25 s later the answer returns to the phone, with the senior brain's thinking trace visible, both classifications shown side by side with the same citation links.
5. **Referral note + audit log (30 s):** one tap, the Pi generates a structured SBAR referral note for the district hospital, populated from the conversation. Then the audit-log viewer opens: every model load, every inference, TTFT, tok/s, which node ran it, which delegated. The video closes with: *"Apache 2.0. Hardware: Pi 5 4 GB. Models: MedPsy-1.7B + MedPsy-4B. Inference: @qvac/sdk. Internet: 0 bytes."*

## The wow moment
A judge watching this remembers one image: the **CHW unplugging the router on camera** mid-case, and the mesh continuing to escalate the hard question across the room to the laptop and back. That single moment proves "edge AI" is more than a buzzword — proof-by-demonstration that this entire workflow has zero cloud dependency.

## Out of scope (this sprint)
- Diagnosis chatbot vibes: every answer must cite an IMCI/BEC/MSF/openFDA chunk.
- Multilingual: MedPsy is English-only; we ship English. Localisation is a stretch goal demo aside.
- iOS / Expo app: web UI only, viewed in a phone browser on the Pi's hotspot.
- Patient EHR sync, hospital integration, telemedicine.
- Anything that requires internet at runtime.
- Drug dosing recommendations beyond what's in WHO Model Formulary chunks.
- Non-IMCI/BEC/MSF clinical scenarios (we own the protocols we KB'd).
- Persistent multi-session patient history (each case is in-memory only).

## Success criteria (judging-aligned)
1. **Reproducibility**: a fresh repo clone + a single `pnpm i && pnpm bench:pi` on a Pi 5 4 GB runs the same 20-case eval and produces matching TTFT/tok-s numbers.
2. **Reality**: zero mocks in the demo path; the entire inference graph runs under @qvac/sdk.
3. **Audit artefact**: `submission/audit-log.json` produced from real runs covers every inference, with TTFT, tok/s, prompt tokens, generated tokens, delegated yes/no, which provider.
4. **Mesh proof**: video shows the router-cable moment AND the delegation profiler breakdown (connection ms vs inference ms, from `DELEGATION_BREAKDOWN_KEY`).
5. **Citation quality**: every classification and treatment claim in the demo resolves to `doc + section + page`.
6. **Build-in-public**: a thread hashtagged `#LifelineMesh` with @QVAC tagged, 3–5 updates by submission day.

## North-star metrics (numbers to publish in the README)
- Pi 5 4 GB: median TTFT on MedPsy-1.7B Q4_K_M under combined-load (LLM + small embed + whisper resident), p95 latency, tok/s.
- Senior laptop: same metrics on MedPsy-4B Q4_K_M.
- Mesh: cold-bootstrap delegation time, warm-call delegation time.
- KB: chunk count + total source pages indexed.
- Eval: 20-case IMCI scenario accuracy, 1.7B alone vs 1.7B+RAG vs 4B+RAG.

## Demo safety + framing
- All 20 eval scenarios and the demo case are **synthetic**. Disclose this in the video opening text.
- Disclaim once in the README and at the end of the video: *"For research and demonstration only — not a substitute for clinical judgement."*
- Every visible model output in the demo must show its citation; if a citation is missing in dev, that's a bug, not a UX detail.
