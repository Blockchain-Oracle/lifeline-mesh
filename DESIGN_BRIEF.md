# Lifeline Mesh — Design Brief

A brief for the designer. Its job is to hand you **deep context, every surface, and every user flow** — and then get out of your way. It deliberately specifies **no colours, no typefaces, no spacing, no component styling, no animation choices**. Those are yours. Where this doc describes a "feeling" or "priority," treat it as the problem to solve, not a visual instruction.

If anything here is thin, ask — better a question than a guess.

---

## 1. What this is, in one breath

**Lifeline Mesh is an offline "clinic-in-a-box."** In places with no doctor and no internet, it walks a community health worker through official WHO medical protocols **by voice**, shows its sources, writes the referral letter, and — when a case is too hard — silently hands it across a **local-only wireless mesh** to a more powerful AI running on the supervisor's laptop. Everything runs on the devices in the room. Nothing is ever sent to the cloud.

It's built for a hackathon (Tether QVAC, "Unleash Edge AI"), but the problem is real and the product should feel real — not like a demo toy.

---

## 2. The world it lives in (domain knowledge)

Picture a rural health post, a refugee camp clinic, or a disaster zone after a flood:

- **No doctor on site.** The person running it is a **community health worker (CHW)** — trained for weeks, not years. They can take a temperature, count breaths, give first aid. They are *not* a physician. The nearest doctor may be hours away.
- **No internet, or it comes and goes.** Cloud apps are useless here. This is the entire reason the product exists.
- **Today they use paper.** The World Health Organization publishes step-by-step protocol booklets (the most important is called **IMCI** — Integrated Management of Childhood Illness). Followed correctly, these booklets measurably save children's lives. In practice, a stressed CHW flips paper pages and guesses.
- **The stakes are high and human.** A wrong call about a feverish child has real consequences. The product's job is to make the CHW *more reliable and more confident*, never to replace their judgment.

There is a documented, life-and-death need here. The design should carry that weight with **dignity and calm** — this serves people in hard moments, on cheap devices, in bright sun, often one-handed. It should feel **trustworthy and humane**, not corporate, not flashy, not "Silicon Valley." But *how* that's expressed visually is entirely your call.

---

## 3. Who uses it (the cast)

| Persona | Device they hold | What they need from the design |
|---|---|---|
| **Community Health Worker (CHW)** — primary user | A cheap Android phone (browser), connected to the box's own Wi-Fi | Calm, voice-first guidance under stress. Big targets. One free hand (the other is with the patient). May read slowly or in a second language. Must never feel lost. |
| **Supervisor / nurse** — secondary user | A laptop in the same camp | Oversight: which hard cases got escalated to them, and confidence that the system is working. |
| **The patient / caregiver** — present, not a user | — | Never sees a screen of their own, but the CHW may turn the phone toward them. Nothing on screen should embarrass or alarm a caregiver looking over a shoulder. |
| **The hackathon judge / evaluator** — a viewer | Watching a 5-minute video, then maybe visiting the site | Needs to *instantly* grasp what this is and why it's hard/impressive, and to trust that it's genuinely offline and on-device. |

The judge matters more than usual: a big slice of success is a judge understanding and believing the product in five minutes. The **public landing site** (section 6) is largely for them and for "building in public."

---

## 4. The core experience, told as a story (the main user flow)

This is the flow the whole product is built around. Read it as a screenplay; design the surfaces that make it feel inevitable.

1. **Connect.** A mother brings in a 2-year-old with fever and fast breathing. The CHW picks up their phone, joins the box's Wi-Fi network, and opens the app. No login, no setup. (Identity/auth: see section 8.)
2. **Speak the problem.** The CHW taps to talk: *"Child, about two years old, fever for three days, breathing fast, not eating."* The app hears them (on-device speech-to-text) and begins.
3. **Get walked through the protocol, one step at a time.** The app asks for exactly one thing at a time: *"Count the breaths for one full minute. Was it more than 40?"* … *"Does the skin pull in below the ribs when the child breathes?"* The CHW answers by voice or tap. This is the heart of the product: **a single, clear question per moment**, never a wall of text.
4. **See the source.** Every conclusion the app reaches is backed by a citation to the actual WHO page it came from (e.g. "WHO IMCI Chart Booklet, p. 23"). The CHW (and the judge) can open and read the exact passage. **Trust is built by showing sources**, not by sounding confident.
5. **Reach a verdict.** The app states a classification the CHW is trained to act on: e.g. *"Severe pneumonia — danger signs present. Give the first dose now and refer urgently."*
6. **The mesh moment (the showpiece).** Some cases are too hard for the small model. When that happens, the app shows that it is **escalating the case across the local mesh to the supervisor's laptop**, where a bigger medical model thinks it through and sends back a better-reasoned answer — *with the internet physically unplugged, on camera.* Then both answers can be seen together. This single moment is the product's "wow." It must read clearly even to someone who knows nothing about AI: *small device asked the big device for help, across the room, with no internet.*
7. **Get the paperwork done.** With one action, the app writes a structured **referral note** for the district hospital, filled in from the conversation — a task that's a real, documented pain for CHWs.
8. **(For the curious / the judge) See the receipts.** A separate view shows the live "telemetry": every AI step, how fast it ran, and which device (the box or the laptop) did the work. This is proof the thing is real and on-device.

---

## 5. The surfaces — Part A: the on-device app

This is the web app **served from the box itself** and opened in a phone browser on the box's own Wi-Fi. It is the product. It is **voice-first**; the screen supports the voice, it doesn't compete with it.

Routes / surfaces:

- **`/` — Case Console.** The screen from the story above. The CHW lives here. It must hold, over the course of one case: a way to start/speak, the current single protocol step, the running transcript of what was understood, inline source citations, the escalation moment, the final classification, and the entry to the referral note. **Your biggest decision space is here:** how much shows at once vs. one-thing-at-a-time; whether steps stack as a history or replace each other; how the "listening / thinking / speaking" states are felt; whether the source citation is a peek, a drawer, a modal, a footnote. There are no wrong instincts yet — you have the full functional list, so choose what keeps a stressed person oriented.
- **The Referral Note.** The generated hospital letter, structured into clear clinical sections, each traceable to its source. The CHW needs to read it back, trust it, and share/print/save it. Decide: is this a full screen, a modal over the console, a printable sheet? What makes a non-expert confident enough to hand it to a hospital?
- **`/audit` — Telemetry / "the receipts."** A live view of every AI operation: which device ran it, time-to-first-word, words-per-second, whether it was escalated. Includes a few headline numbers up top. This is half engineering dashboard, half trust-builder for a skeptical viewer. Decide how to make raw performance data legible and even a little compelling, without turning the CHW's tool into a cockpit.
- **`/case/:id` — Case Replay.** A read-only retelling of a completed case (what was asked, what was decided, sources, whether it escalated). For review/handover. Single screen.
- **`/about` — The box.** What hardware this is running on, which AI models, the knowledge sources and their licenses, and the safety disclaimer ("for demonstration / research, not a substitute for clinical judgment"). Static.

Functional elements that exist on these surfaces (described by *what they do*, not how they look — you decide the form):

- A **talk control** the CHW uses to speak (press-and-hold is the current assumption; challenge it if you have a better idea for one-handed use). It needs obvious states for idle / listening / processing.
- A **single protocol-step prompt** with a question and a small number of answers (often just yes/no, or a number to enter).
- A **transcript / "what I heard"** element so the CHW can catch mis-hearings.
- A **source citation** element wherever the app makes a claim — and a way to open the exact quoted passage.
- An **escalation indicator** for the mesh moment — including the sense of "reaching across to the laptop," a wait, and the arrival of the senior answer (which can include the bigger model's visible reasoning).
- A **classification / verdict** element, including the case where there are **danger signs** that demand urgent action — this needs to feel appropriately serious without panicking a caregiver who's watching.
- A **mesh/connection status** element: is the supervisor's laptop reachable right now, or is the box working alone? Crucial: **working alone is normal and fine, not an error state.** Offline is the whole point; never make "no internet" look like a failure.

---

## 6. The surfaces — Part B: the public project site (landing + docs)

A separate, web-hosted site whose audience is judges, the wider community, and "building in public." Its job: make someone *get it* fast, *believe it's real*, and be able to dig in.

Likely routes (refine as you see fit):

- **`/` — Landing.** Communicate, in order: the human problem (no doctor, no internet) → what Lifeline Mesh does → **the mesh moment** as the centerpiece → that it's genuinely offline / on-device / private → the tracks it targets and that it's open-source → a clear path to the demo video and the code. This is where you decide the whole narrative shape: hero, scrollytelling, sectioning, whether the mesh handoff is animated or illustrated, how the "offline" claim is dramatized.
- **Demo video.** A ≤5-minute video is the heart of the submission; the landing should give it pride of place. Decide how it's framed and where it sits.
- **`/how-it-works` (or sections of the landing).** The two-tier "box → laptop" architecture, explained for a smart non-specialist. There's a real diagram opportunity here (the mesh, the devices, the flow of a hard case).
- **`/docs` — Reproduce & Documentation.** How to set up the box and run it, the hardware used, the knowledge sources, the performance numbers. More utilitarian; needs to be skimmable and credible. (Some of this can lean on the GitHub README; decide the split.)

Decisions that are yours here: is this one long scrolling story or a multi-page site? How much motion? How technical does the landing get before handing off to docs? How do you convey "private / on-device / no cloud" as a *feeling*, not just a claim?

---

## 7. Cross-cutting realities that should shape (not dictate) design

These are constraints from the real world. They influence decisions; they are **not** style instructions.

- **Cheap devices, weak browsers.** The app runs in a low-end Android phone browser. Lean, fast, forgiving.
- **Hostile environments.** Bright outdoor light; dusty; the user may be tired or stressed; the patient is the real focus, the screen is secondary.
- **One-handed, glanceable.** Big targets; the next action obvious without reading a paragraph.
- **Voice-first, screen-second.** Anything doable by voice should also be doable by touch, and vice-versa; the screen confirms and orients.
- **Reading load is a safety issue.** Users may read slowly or in a second language (content is English for now). Plain words, one idea at a time. Avoid jargon unless it's the clinical term the CHW is trained on.
- **Calm under high stakes.** Danger / urgency must be communicable clearly, but the default tone is steady and reassuring. A caregiver may be watching the screen — nothing should frighten or shame.
- **Offline is normal.** Never style "no connection" as an error; it's the expected, designed-for state.
- **Trust through transparency.** The product earns trust by showing its sources and its performance, not by hiding the machinery. Lean into that.
- **The demo must shine.** In the 5-minute video, these must be unmistakable on screen: the voice intake, the one-step-at-a-time guidance, the **source citations**, the **escalation-to-laptop moment with internet unplugged**, the **referral note**, and the **telemetry/receipts**.

---

## 8. Identity, auth & security (so you're not surprised)

- **There is no traditional login.** The box is a trusted, single-purpose device on its own private Wi-Fi; the CHW just opens the app. Don't design sign-up / sign-in screens unless we later decide a lightweight "who is this CHW" selector adds value (open question — your input welcome).
- **The box ↔ laptop pairing** is handled by a security key under the hood (so only the right supervisor laptop can receive cases). This is mostly invisible, but the **mesh status** element (section 5) is where any of it surfaces to a user — e.g. "linked to supervisor" vs "working alone."
- **Patient data never leaves the room** and isn't stored long-term. Each case lives for the session. No accounts, no patient database. This privacy stance is a *selling point* and worth expressing on the public site.

---

## 9. What the designer decides (non-exhaustive)

You have full information now, so these are yours to make:

- The entire visual language: colour, type, spacing, iconography, imagery, motion. (This brief intentionally says nothing about them.)
- Whether the case console stacks steps as history or replaces them one at a time.
- How a source citation is revealed: inline, peek, drawer, modal.
- How the **mesh / escalation moment** is dramatized in both the app and the landing page — arguably the single most important design decision in the project.
- Whether the referral note is a modal, a page, or a printable sheet.
- Landing page shape: one scrolling narrative vs. multi-page; how much animation; how "offline/private" is made to *feel*.
- How performance/telemetry is made legible and even persuasive.
- The diagram(s) for the two-tier architecture.

---

## 10. References & links

- **Code (GitHub):** https://github.com/Blockchain-Oracle/lifeline-mesh — the README, this brief, and screenshots live here. (Early scaffold; the front-end is intentionally minimal/placeholder and will be rebuilt to match your designs.)
- **Full product spec (for deeper context if you want it):** the team maintains a PRD, architecture doc, and per-screen UX notes. Ask the team for `research/qvac-2026/docs/PRD.md` and `ux-spec.md` if you want the engineering-side detail — **but treat any colours/fonts in those internal notes as placeholders, not direction.** This brief supersedes them for design.
- **Demo video:** link to follow.
- **WHO IMCI (the protocol the product encodes), for domain flavor:** the WHO "Integrated Management of Childhood Illness chart booklet" — public WHO material, useful if you want to feel what a CHW is working from on paper today.

---

## 11. How we'll work together

Design leads the UI. Once you've designed a surface, the team will (re)build the front-end to match yours — anything already prototyped in code is a throwaway placeholder and will be replaced by your work.

**Suggested order:** scope **both** the on-device app and the public site, but do the **on-device app first** — it's the product judges score hardest on — then the public landing/docs site. Within the app, the **Case Console** is the place to start; on the public site, the **mesh moment** is the centerpiece to nail.
