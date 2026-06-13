# Story — `story-case-console-shell`

**Epic:** Epic 9 — Web UI · **Depends on:** `story-vite-scaffold` · **Est:** 30 min
**Design note:** behavior + layout regions + routing only; final look from the designer.

## Why
The `/` Case Console structure + the WebSocket case stream that all sub-components hang off.

## BDD acceptance criteria
```
Given routes /, /audit, /case/:id, /about
Then react-router renders each without error

Given apps/web/src/hooks/useCaseStream.ts connecting to /ws/case
When the server sends frames (transcript, step, citation, escalation, tool, verdict, tts-audio, error)
Then the hook reduces them into a typed CaseState the console renders

Given a dropped WS
Then it reconnects and surfaces a connection state (never crashes)

Given tests (mocked WS)
Then ≥5 assertions: each frame type reduces correctly, reconnect, route rendering
```

## File modification map
- `apps/web/src/routes/{CaseConsole,Audit,CaseReplay,About}.tsx` — NEW (shells).
- `apps/web/src/hooks/{useWebSocket,useCaseStream}.ts` — NEW.
- `apps/web/src/lib/ws-client.ts` — NEW.
- `apps/web/src/hooks/useCaseStream.test.ts` — NEW — ≥5 assertions.

## Shell verification
```bash
pnpm --filter web test useCaseStream   # ≥5 pass
```
