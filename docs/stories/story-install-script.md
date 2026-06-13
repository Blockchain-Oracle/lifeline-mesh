# Story — `story-install-script`

**Epic:** Epic 10 — Pi packaging · **Depends on:** `story-hostapd-dnsmasq`, `story-mdns-avahi`, `story-systemd-unit` · **Est:** 30 min

## Why
One idempotent script turns a fresh Pi OS Lite install into a running Lifeline box — the backbone of the reproducibility the judges require.

## BDD acceptance criteria
```
Given infra/pi/install.sh
When run on Raspberry Pi OS Lite 64-bit
Then it installs Node 22, pnpm, system deps (hostapd, dnsmasq, avahi-daemon, ffmpeg, espeak-ng), configures AP + mDNS, builds junior-node, installs+enables the systemd unit

Given a second run
Then it is idempotent (no duplicate config, no errors)

Given a dry-run flag
Then `install.sh --check` validates prerequisites and exits without mutating

Given shellcheck
Then install.sh passes with no errors
```

## File modification map
- `infra/pi/install.sh` — NEW — idempotent provisioner with `--check`.
- `docs/PI-DAY1.md` — UPDATE — link the script + the day-1 verification checklist.

## Shell verification
```bash
shellcheck infra/pi/install.sh && bash infra/pi/install.sh --check   # exit 0
```
