# Story — `story-hostapd-dnsmasq`

**Epic:** Epic 10 — Pi packaging · **Depends on:** none · **Est:** 25 min

## Why
The CHW's phone joins the box's own Wi-Fi (`LifelineMesh`) with zero infra — the demo's first physical moment and the real deployment shape.

## BDD acceptance criteria
```
Given infra/pi/hostapd.conf
Then it defines SSID "LifelineMesh" (from AP.SSID) on the Pi's wlan in AP mode

Given infra/pi/dnsmasq.conf
Then it serves DHCP on the AP subnet and resolves the box to a stable IP

Given the provisioning doc
Then the steps to enable AP mode on Pi OS Bookworm are listed and idempotent

Given a config lint
Then `node scripts/check-infra.mjs` asserts SSID matches AP.SSID constant and required keys exist
```

## File modification map
- `infra/pi/hostapd.conf`, `infra/pi/dnsmasq.conf` — NEW.
- `scripts/check-infra.mjs` — NEW — asserts config↔constants consistency.

## Shell verification
```bash
node scripts/check-infra.mjs   # SSID matches constant, exit 0
```
