# Story — `story-utterance-route`

**Epic:** Epic 8 — Voice pipeline · **Depends on:** `story-inference-adapter` · **Est:** 25 min

## Why
Server endpoint that turns an uploaded utterance into text via the SDK whisper model. Verified shape: `transcribe({ modelId, audioChunk, metadata:true })`; `audioChunk` accepts a file path; built-in `WHISPER_EN_BASE_Q8_0` constant.

## BDD acceptance criteria
```
Given apps/junior-node/src/http-routes.ts POST /audio/utterance
When a multipart opus/webm blob is uploaded
Then it is decoded to f32le (SDK decoder-audio / ffmpeg), written to a temp file, transcribed, and the JSON { transcript, durationMs } returned

Given AUDIO.LANGUAGE/FORMAT constants
Then the whisper model is loaded with audio_format f32le, language en

Given a non-audio upload
Then it returns 400 with a typed error (no crash)

Given the transcription
Then an audit entry op="transcribe" is written

Given tests with SttPort fake
Then ≥5 assertions: happy path JSON, decode invoked, bad-input 400, audit written, temp file cleaned up
```

## File modification map
- `apps/junior-node/src/http-routes.ts` — NEW/UPDATE — the route.
- `apps/junior-node/src/voice.ts` — NEW — decode+transcribe helper.
- `apps/junior-node/src/http-routes.test.ts` — NEW — ≥5 assertions (fastify inject + SttPort fake).
- `apps/junior-node/{package.json,tsconfig.json}` — NEW (if first app file).

## Shell verification
```bash
pnpm --filter junior-node test utterance   # ≥5 pass
```
