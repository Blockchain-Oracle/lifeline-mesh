# Story — `story-voice-fallback`

**Epic:** Epic 8 — Voice pipeline · **Depends on:** `story-tts-playback` · **Est:** 15 min

## Why
If Supertonic's arm64 prebuild fails to load on the Pi (day-1 risk), the demo must still speak. `espeak-ng` is a zero-RAM, apt-installable fallback.

## BDD acceptance criteria
```
Given the TtsPort
When the Supertonic model fails to load
Then the adapter transparently falls back to an espeak-ng TtsPort implementation and logs a warn

Given the fallback
Then textToSpeech still returns a playable audio buffer

Given config TTS_BACKEND=espeak
Then espeak is used directly (for testing on machines without the model)

Given tests
Then ≥3 assertions: fallback on load failure, buffer returned, config override
```

## File modification map
- `packages/core/src/inference.ts` — UPDATE — TTS load try/catch → espeak fallback (still within the adapter seam).
- `apps/junior-node/src/voice.ts` — UPDATE — espeak helper.
- `packages/core/src/inference.test.ts` — UPDATE — ≥3 assertions.

## Shell verification
```bash
pnpm --filter @lifeline/core test inference   # fallback assertions pass
```
