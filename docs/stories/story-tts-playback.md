# Story — `story-tts-playback`

**Epic:** Epic 8 — Voice pipeline · **Depends on:** `story-mediarecorder-capture`, `story-utterance-route` · **Est:** 25 min
**Design note:** behavior/wiring only.

## Why
The app speaks protocol steps aloud. Server runs Supertonic TTS (`TTS_EN_SUPERTONIC_Q4_0`) and streams audio to the phone over WS; UI queues and plays it in order.

## BDD acceptance criteria
```
Given the server textToSpeech via TtsPort
When a protocol step is emitted
Then audio chunks are pushed over WS as tts-audio frames

Given apps/web playback queue
Then frames play in arrival order and the mic stays disabled until playback ends

Given a TTS failure
Then the step still shows as text (degrade gracefully) and an audit op="tts" error is recorded

Given tests
Then ≥4 assertions: frames queued/ordered, mic disabled during playback, text fallback on tts error, audit on tts
```

## File modification map
- `apps/junior-node/src/ws-routes.ts` — UPDATE — emit tts-audio frames.
- `apps/web/src/hooks/useTtsPlayback.ts` — NEW.
- `apps/web/src/hooks/useTtsPlayback.test.ts` + server test — NEW — ≥4 assertions.

## Shell verification
```bash
pnpm --filter web test useTtsPlayback && pnpm --filter junior-node test tts   # ≥4 pass total
```
