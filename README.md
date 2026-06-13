# Lifeline Mesh

**An offline clinic-in-a-box that walks community health workers through WHO clinical protocols by voice, and escalates hard cases over a local-only P2P mesh to a "senior brain" on the supervisor's laptop — 100% on-device.**

Built for the Tether **QVAC "Unleash Edge AI"** hackathon · Tracks: **Tinkerer** (Raspberry Pi 5) + **Psy Models** (MedPsy) · License: **Apache-2.0**

All AI inference, RAG, voice, and P2P delegation run on [`@qvac/sdk`](https://qvac.tether.io). No cloud. No internet at runtime.

## Why
In places where the nearest doctor is hours away and the internet is dead, a community health worker (CHW) flips through a paper WHO chart booklet and guesses. Lifeline Mesh turns an $80 Raspberry Pi + the village nurse's laptop into a two-tier care system: a small medical model (MedPsy-1.7B) on the Pi walks the CHW through the official WHO IMCI protocol by voice, cites the page it's reading from, generates the referral note, and — when the case is too hard — silently escalates it across a local-only P2P mesh to MedPsy-4B on the supervisor's laptop. Nothing leaves the room.

## Status
Early scaffold. See `../research/qvac-2026/docs/` for the full spec (PRD, architecture, epics, stories).

## Hardware (target)
- **Junior node:** Raspberry Pi 5 (4 GB), Raspberry Pi OS Lite 64-bit, Node 22.
- **Senior node:** any laptop ≥ 8 GB RAM.

## Reproduce
_Filled in as the build lands (see Epic 11). Will include: clone, `pnpm i`, model fetch, `infra/pi/install.sh`, two-machine mesh demo, and the on-device benchmark + audit-log generation._

## Disclaimer
For research and demonstration only — not a substitute for professional clinical judgement.
