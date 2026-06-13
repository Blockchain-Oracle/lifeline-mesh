# UX Spec — Lifeline Mesh

## Anchor product
**Community Health Toolkit (CHT)** by Medic — `https://github.com/medic/cht-core`. We borrow:
- **Single-action task cards** (one decision per screen) suited to a CHW with one free hand.
- **Bottom-anchored primary actions** for thumb reach on phones.
- **High-contrast, low-density** layouts that work in bright sun + low-end Android browsers.

Secondary anchor: **Linear**'s citation/footnote chips for inline source pills.

## Design tokens (locked in `apps/web/src/styles/tokens.css`)

```
--color-bg:           #0B1220   /* near-black blue, low-glare in low-light clinics */
--color-surface:      #131C2E
--color-surface-2:    #1B2741
--color-border:       #29365A
--color-text:         #E6ECF7
--color-text-muted:   #94A3B8
--color-primary:      #2DD4BF   /* teal — distinct from medical red */
--color-primary-ink:  #04231F
--color-danger:       #EF4444   /* danger-sign cards only */
--color-warning:      #F59E0B
--color-success:      #22C55E
--color-citation:     #60A5FA   /* citation pills */
--color-senior:       #A855F7   /* "senior brain" badges — purple = supervisor */

--radius-sm: 8px
--radius-md: 12px
--radius-lg: 16px

--space-1: 4px  /* tokens via tailwind 4px scale, defaults */

--font-sans:  "Inter Variable", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif
--font-mono:  "JetBrains Mono", ui-monospace, monospace
--font-size-base: 16px      /* never below 16 on the CHW card surface */
--font-size-step: 18px
--font-size-citation: 13px
```

Tailwind config exposes these as `theme.colors.lifeline.*`. **Banned Tailwind classes:** `from-purple-* to-pink-*` / any default rainbow gradient, `font-sans` Inter without our weight overrides, `bg-gray-50` on the case surface (too low contrast on phones in sun), `text-sm` below 14 on primary content.

## Route shape

| Route | Purpose | Notes |
|---|---|---|
| `/` | Case console — voice + visible protocol steps | The CHW lives here |
| `/audit` | Live audit log viewer + KPI tiles (TTFT, tok/s, delegations) | Toggled via header — also the judging artifact view |
| `/case/:caseId` | Read-only case replay (post-case review) | Single screen, no nav |
| `/about` | Hardware + model + KB version + license disclaimer | Static |

There is no separate "settings" route — `QVAC_HYPERSWARM_SEED`, KB version, etc. live in the systemd env and are surfaced read-only on `/about`. Anything mutable goes through ENV vars deliberately.

## Screen shapes

### `/` — Case console (the demo screen)
- **Header (sticky)**: left = Lifeline Mesh wordmark + KB version chip; centre = current case ID + age/sex bubble; right = **mesh status pill** (`local` / `senior link OK 12 ms` / `senior offline — local only`), audit log toggle.
- **Main column** (single scrolling column, max-width 480 px on phone, no sidebars):
  - **Protocol step card** (one at a time). Top half: the question or instruction ("Count the breaths for one minute. Was it more than 40?"). Bottom half: yes/no buttons + "speak answer" mic FAB.
  - **Inline citation chip** under any model claim: `[WHO IMCI · p. 23 · §Cough]` clickable → opens the **citation card** drawer with the exact quoted chunk.
  - **Status row** (small, above the step card): live transcript bubble while listening, "thinking" indicator (tok/s ticker) while generating.
  - **Escalation banner** (sticky, appears mid-case): purple, "Senior brain reviewing — 0:23". Shows the senior's `captureThinking` trace inside a collapsed accordion.
  - **Classification verdict card** (when reached): big classification name, danger-sign badge if any, primary CTA = "Generate referral note", secondary = "Continue protocol".
- **Footer** (always visible): voice button (push-and-hold) + "Restart case" outline button + "Resolve case" primary button on the right when terminal.

### Referral note view (modal over `/`)
- Big SBAR-structured card (Situation, Background, Assessment, Recommendation). Each field shows source citations. Print/share via Web Share API; download as `.json` and `.pdf`.

### `/audit` — Live audit viewer
- Three KPI tiles at the top: **TTFT p50/p95** (junior vs senior), **tok/s** (junior vs senior), **delegations** count + success ratio.
- Streaming NDJSON table below (auto-scroll, pause on hover). Columns: ts, op, node, model, prompt tokens, gen tokens, TTFT ms, tok/s, delegated, citation count. Each row expands to show the raw record.
- "Export submission JSON" button — runs `scripts/audit/aggregate.mjs` server-side.

## Voice interaction shape

- **Push-and-hold mic**, not always-on. Web Audio + MediaRecorder, opus webm container. On release: POST `/audio/utterance` (multipart) → server runs `transcribe()` → returns text + `{transcribedAt, durationMs}` → UI shows the transcript bubble → server kicks the agent.
- Stretch: WS streaming via `transcribeStream` with browser-pushed PCM chunks. ADR-011 says HTTP whole-utterance is the locked default for demo safety.
- Server responses: streaming WS frames. Frame types: `transcript`, `step`, `citation`, `escalation`, `tool`, `verdict`, `tts-audio` (base64 OPUS chunks), `error`.
- TTS playback: the UI plays incoming `tts-audio` frames in order; while playing, the mic button is disabled to prevent barge-in feedback (a stretch is barge-in via VAD on the server).

## Component contract (shadcn/ui copies, no runtime dep)

In `apps/web/src/components/`:

- `ProtocolStepCard` — props `{ question, options, onAnswer, isWaiting }`.
- `CitationChip` + `CitationDrawer` — props `{ docId, section, page, quote }`.
- `EscalationBanner` — props `{ peerName, elapsedMs, thinking? }`.
- `ClassificationVerdict` — props `{ name, dangerSigns: string[], next: "referral"|"continue" }`.
- `MicButton` — push-and-hold, large hit area (≥ 64 px); shows recording level.
- `MeshStatusPill` — props `{ status: "local"|"linked"|"offline", latencyMs? }`.
- `AuditRow` + `AuditKpiTile` — atoms for `/audit`.

## Accessibility + clinical-environment realities

- WCAG AA minimum on every text colour.
- Voice-first design: every action that can be triggered by tap must also be triggerable by a clear voice command. Visible labels echo the voice command (e.g. button label: "Yes (or say 'yes')").
- Animations under 200 ms, no parallax, no auto-scroll surprises. Reduce-motion respected.
- Offline indicator is **never red by default** — local-only is the design centre, not an error.
- All hit targets ≥ 44 × 44 CSS px.
- Demo-safety: a footer chip "Synthetic case — research only" on every case screen during the hackathon build.

## Demo shape rule (sacred)
The 5-minute video flow follows the PRD's demo walkthrough exactly. The UI MUST surface, in order on camera: (1) voice intake, (2) cited protocol steps, (3) escalation banner + visible router-cable pull, (4) referral note, (5) the `/audit` view. If a component is not used in the demo it ships, but it does not block.
