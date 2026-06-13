# Story — `story-mesh-heartbeat`

**Epic:** Epic 7 — Mesh + delegation + escalation · **Depends on:** `story-senior-provider` · **Est:** 20 min

## Why
The Pi must know if the senior laptop is reachable before routing a hard case there. There is no auto-reconnect in the SDK, so we own a heartbeat + cached state (drives the mesh status pill + the route decision).

## BDD acceptance criteria
```
Given packages/mesh/src/heartbeat.ts probe(providerPublicKey)
When the provider is reachable
Then it returns { reachable: true, latencyMs } within TIMEOUTS_MS.HEARTBEAT

When the provider is down
Then it returns { reachable: false } without throwing, within the timeout

Given repeated probes
Then state is cached and exposed via getMeshState() for the UI/route layer

Given the heartbeat uses the SDK heartbeat() via MeshPort only
Then no direct @qvac/sdk import outside the adapter

Given tests with FakeMeshPort
Then ≥5 assertions: reachable path, unreachable path, timeout respected, cache freshness, no-throw on failure
```

## File modification map
- `packages/mesh/src/heartbeat.ts` — NEW.
- `packages/mesh/src/heartbeat.test.ts` — NEW — ≥5 assertions.
- `packages/mesh/{package.json,tsconfig.json}` — NEW.

## Shell verification
```bash
pnpm --filter @lifeline/mesh test heartbeat   # ≥5 pass
```
