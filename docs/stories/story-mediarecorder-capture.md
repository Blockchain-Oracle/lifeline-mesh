# Story — `story-mediarecorder-capture`

**Epic:** Epic 8 — Voice pipeline · **Depends on:** `story-vite-scaffold` · **Est:** 25 min
**Design note:** behavior/wiring only; final visuals come from the designer.

## Why
Browser-side capture of the CHW's utterance, uploaded as one file (ADR-011: whole-utterance HTTP POST is the locked path; streaming is a stretch).

## BDD acceptance criteria
```
Given apps/web/src/hooks/useAudioCapture.ts
When the talk control is pressed and released
Then it records via MediaRecorder (opus/webm) and resolves a Blob

Given release
Then it POSTs multipart to /audio/utterance and resolves the returned transcript

Given mic permission denied
Then it surfaces a typed error state (not a crash) the UI can show

Given playback is active (TTS)
Then capture is disabled to prevent feedback

Given tests (jsdom + mocked MediaRecorder/fetch)
Then ≥4 assertions: record→blob, POST shape, permission-denied state, disabled-during-playback
```

## File modification map
- `apps/web/src/hooks/useAudioCapture.ts` — NEW.
- `apps/web/src/lib/audio-utils.ts` — NEW.
- `apps/web/src/hooks/useAudioCapture.test.ts` — NEW — ≥4 assertions.

## Shell verification
```bash
pnpm --filter web test useAudioCapture   # ≥4 pass
```
