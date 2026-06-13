# Designer brief — two README images (banner + architecture diagram)

Thanks for the prototypes and brand kit — they're great. This is a small follow-up: **two images for the project's GitHub README**. People skim READMEs visually, so these two carry a lot. Keep it to these two (no more — we don't want to bombard the page).

Please match the brand you already established:

- **Logo:** the ECG/heartbeat line between two nodes (`brand/lifeline-mark.svg`, `brand/lifeline-lockup.svg`). The "pulse line is the mesh link" idea is the whole identity — lean into it.
- **Primary teal:** `#1F8A82` · **senior/indigo accent:** `#5B63C9` · **mesh-green:** `#62D39B`
- **Warm neutrals:** paper `#FBFAF6`, sand `#E4DFD4`, ink `#23211D`, muted `#5C574E`
- **Type:** Hanken Grotesk (UI/labels) + Newsreader (the serif, for the motto/headline)
- **Motto (use this exact line):** *"When there's no signal, when the network goes down, care shouldn't."*
- **Repo URL (small, for the banner):** github.com/Blockchain-Oracle/lifeline-mesh

---

## Image 1 — README banner

A **wide, short** GitHub banner (the kind that sits at the very top of a README — long horizontally, not tall).

- **Size:** **1280 × 320 px** (4:1). Export @2x (2560×640) PNG + an SVG if easy.
- **Logo:** the lockup/mark in the **top-right corner, bold and confident.**
- **Centre/left:** the product name **Lifeline Mesh** and the **motto** set in Newsreader. A one-line sub-tag underneath in Hanken Grotesk is welcome, e.g. *"Offline, voice-guided WHO care that escalates over a local mesh."*
- **Bottom-left (small):** the repo URL.
- **Feel:** calm, clinical-but-humane, warm paper background with the teal pulse line as a quiet motif running across it. Not corporate, not flashy. The heartbeat line can literally trace across the banner and "connect" two small nodes (a Pi node and a laptop node) — reinforcing the mesh.

## Image 2 — architecture diagram

A **broad, detailed** diagram that explains how the system actually works. This is the one technical readers will study, so it can carry real labels.

- **Size:** **~1600 × 1000 px** (16:10), PNG @2x + SVG if possible.
- **Logo:** **top-right corner, bold.** **Motto** along the **bottom** in Newsreader.
- **Background:** warm paper; use the teal/indigo/green accents from the kit.

**What to depict (left → right data flow):**

1. **The Community Health Worker + phone** (left). Speaks a case by voice; opens the app over the box's own Wi-Fi (`LifelineMesh` / `lifeline.local`). Label: *"voice in, cited guidance out — no app install."*

2. **Junior node — Raspberry Pi 5** (centre-left, the hero box). Inside it, show the on-device pipeline as a small stack:
   - **MedPsy-1.7B** (the small medical model)
   - **Offline RAG** over the **WHO IMCI booklet** (embeddings + a local vector store) → produces **citations to exact pages**
   - **Deterministic IMCI engine** (the rules — this is what actually classifies; label it *"rules, not guesses → every answer cited"*)
   - **Voice**: whisper (speech-to-text) + Supertonic (text-to-speech)
   - Tag the whole box: **"100% on-device · 0 bytes to the cloud."**

3. **The mesh link** (centre, the dramatic part). A **dashed teal pulse line** from the Pi to the laptop labelled **"local-only P2P mesh (Hyperswarm) — no internet, no server."** Draw a small **cut/unplugged internet/cloud icon crossed out** above the link to make "no cloud" unmistakable. Note on the link: *"hard or severe cases escalate."*

4. **Senior node — supervisor's laptop** (right). **MedPsy-4B** (the bigger model) reviewing the escalated case and sending the answer back. Use the **indigo accent** for "senior brain." Label: *"reviews the hard cases."*

5. **Fallback path** (small, under the mesh link): a curved arrow back into the Pi labelled **"laptop unreachable → the box keeps working alone (never goes dark)."**

6. **Outputs** (bottom strip, small icons): **cited IMCI classification**, **referral letter (SBAR)**, **audit log (TTFT / tokens-sec)** — to show what the CHW and the system produce.

**Tone:** it should read as *"this genuinely works offline on a $80 computer, and gets help from a bigger brain across the room when it needs to — with the internet physically off."* Accurate over decorative; a smart non-specialist should follow it.

---

That's it — banner + architecture. If you have spare energy, a tiny **favicon/app-icon** crop of the mark is a nice-to-have, but not required. Thank you!
