# Story — `story-mdns-avahi`

**Epic:** Epic 10 — Pi packaging · **Depends on:** none · **Est:** 15 min

## Why
So the CHW opens `http://lifeline.local` instead of an IP — a small thing that makes the demo feel finished.

## BDD acceptance criteria
```
Given infra/pi/avahi-lifeline.service
Then it advertises hostname "lifeline.local" (from AP.HOSTNAME) over mDNS

Given the junior HTTP port (PORTS.JUNIOR_HTTP)
Then the service advertises an _http._tcp record on that port

Given check-infra
Then it asserts the hostname matches AP.HOSTNAME and the port matches PORTS.JUNIOR_HTTP
```

## File modification map
- `infra/pi/avahi-lifeline.service` — NEW.
- `scripts/check-infra.mjs` — UPDATE — hostname/port assertions.

## Shell verification
```bash
node scripts/check-infra.mjs   # hostname + port match constants
```
