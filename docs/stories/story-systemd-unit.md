# Story — `story-systemd-unit`

**Epic:** Epic 10 — Pi packaging · **Depends on:** `story-route-by-state` · **Est:** 20 min

## Why
The junior app must come up on boot and restart on failure — a clinic box can't need a developer to start it.

## BDD acceptance criteria
```
Given infra/pi/lifeline-junior.service
Then it runs apps/junior-node on boot, restart=on-failure, with an EnvironmentFile holding QVAC_HYPERSWARM_SEED + LOG_LEVEL

Given the unit
Then it waits for network-online and the AP to be up before starting

Given check-infra
Then it asserts the ExecStart path and EnvironmentFile reference are present and the env file is gitignored

Given the env example
Then infra/pi/lifeline.env.example documents required vars (no secrets committed)
```

## File modification map
- `infra/pi/lifeline-junior.service` — NEW.
- `infra/pi/lifeline.env.example` — NEW.
- `scripts/check-infra.mjs` — UPDATE.

## Shell verification
```bash
node scripts/check-infra.mjs   # unit assertions pass
```
