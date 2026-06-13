#!/usr/bin/env bash
# Lifeline Mesh — idempotent Raspberry Pi 5 (64-bit) provisioner.
# Turns a fresh Raspberry Pi OS Lite install into a running clinic box:
# system deps -> Wi-Fi AP + mDNS -> build the junior node -> systemd service.
#
#   sudo bash infra/pi/install.sh           # provision (idempotent; safe to re-run)
#   bash infra/pi/install.sh --check        # dry-run: validate prerequisites only
set -euo pipefail

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
INSTALL_DIR="/opt/lifeline-mesh"
NODE_MAJOR="22"
SYS_DEPS=(hostapd dnsmasq avahi-daemon ffmpeg espeak-ng)

log() { printf '\033[1;36m[lifeline]\033[0m %s\n' "$1"; }
err() { printf '\033[1;31m[lifeline] ERROR:\033[0m %s\n' "$1" >&2; }

check_prereqs() {
  local ok=0
  log "checking prerequisites…"
  if [ "$(uname -s)" != "Linux" ]; then err "must run on Linux (Raspberry Pi OS 64-bit)"; ok=1; fi
  if [ "$(uname -m)" != "aarch64" ]; then err "expected aarch64 (64-bit Pi OS); found $(uname -m)"; ok=1; fi
  command -v apt-get >/dev/null 2>&1 || { err "apt-get not found (Debian/Pi OS required)"; ok=1; }
  if [ -f "$REPO_DIR/package.json" ]; then log "repo found at $REPO_DIR"; else err "run from inside the cloned repo"; ok=1; fi
  if [ "$ok" -eq 0 ]; then log "prerequisites OK"; else err "prerequisite check failed"; fi
  return "$ok"
}

require_root() {
  if [ "$(id -u)" -ne 0 ]; then err "provisioning needs root: sudo bash infra/pi/install.sh"; exit 1; fi
}

install_node_pnpm() {
  if ! command -v node >/dev/null 2>&1 || [ "$(node -v | sed 's/v\([0-9]*\).*/\1/')" -lt "$NODE_MAJOR" ]; then
    log "installing Node.js ${NODE_MAJOR}…"
    curl -fsSL "https://deb.nodesource.com/setup_${NODE_MAJOR}.x" | bash -
    apt-get install -y nodejs
  else
    log "Node.js $(node -v) already present"
  fi
  command -v pnpm >/dev/null 2>&1 || { log "installing pnpm…"; npm install -g pnpm@10; }
}

install_sys_deps() {
  log "installing system packages: ${SYS_DEPS[*]}"
  apt-get update -y
  apt-get install -y "${SYS_DEPS[@]}"
}

sync_repo() {
  log "syncing repo to ${INSTALL_DIR}"
  mkdir -p "$INSTALL_DIR"
  rsync -a --delete --exclude node_modules --exclude .git "$REPO_DIR/" "$INSTALL_DIR/"
}

ensure_swap() {
  # The full @qvac/sdk install pulls native prebuilds for every addon and can OOM a
  # 4 GB Pi during install/build (verified: OOM-killed in a memory-limited arm64 VM).
  # Ensure at least ~2 GB swap so the install survives.
  local have_kb
  have_kb=$(awk '/SwapTotal/ {print $2}' /proc/meminfo 2>/dev/null || echo 0)
  if [ "${have_kb:-0}" -lt 1500000 ] && [ ! -f /swapfile-lifeline ]; then
    log "adding 2 GB swap for the install (low default swap on Pi OS)…"
    fallocate -l 2G /swapfile-lifeline || dd if=/dev/zero of=/swapfile-lifeline bs=1M count=2048
    chmod 600 /swapfile-lifeline
    mkswap /swapfile-lifeline && swapon /swapfile-lifeline
  fi
}

build_app() {
  ensure_swap
  log "installing deps + building (this pulls the QVAC SDK native ARM64 prebuilds)…"
  # Lower install concurrency to keep the memory spike down on constrained hardware.
  ( cd "$INSTALL_DIR" && pnpm install --frozen-lockfile --child-concurrency=1 && pnpm build )
  if [ ! -f "$INSTALL_DIR/infra/pi/lifeline.env" ]; then
    cp "$INSTALL_DIR/infra/pi/lifeline.env.example" "$INSTALL_DIR/infra/pi/lifeline.env"
    log "created infra/pi/lifeline.env from the example — edit it to set LIFELINE_SENIOR_KEY"
  fi
}

configure_network() {
  log "configuring Wi-Fi AP (LifelineMesh) + mDNS (lifeline.local)…"
  install -m 0644 "$INSTALL_DIR/infra/pi/hostapd.conf" /etc/hostapd/hostapd.conf
  install -m 0644 "$INSTALL_DIR/infra/pi/dnsmasq.conf" /etc/dnsmasq.d/lifeline.conf
  install -m 0644 "$INSTALL_DIR/infra/pi/avahi-lifeline.service" /etc/avahi/services/lifeline.service
  # Static IP for the AP interface; hostapd reads /etc/hostapd/hostapd.conf via DAEMON_CONF.
  grep -q 'DAEMON_CONF=.*hostapd.conf' /etc/default/hostapd 2>/dev/null \
    || echo 'DAEMON_CONF="/etc/hostapd/hostapd.conf"' >> /etc/default/hostapd
  systemctl unmask hostapd 2>/dev/null || true
  systemctl enable hostapd dnsmasq avahi-daemon
}

install_service() {
  log "installing systemd unit lifeline-junior.service"
  sed "s#/opt/lifeline-mesh#${INSTALL_DIR}#g" "$INSTALL_DIR/infra/pi/lifeline-junior.service" \
    > /etc/systemd/system/lifeline-junior.service
  systemctl daemon-reload
  systemctl enable --now lifeline-junior.service
  log "lifeline-junior enabled. Status: systemctl status lifeline-junior"
}

main() {
  if [ "${1:-}" = "--check" ]; then check_prereqs; exit $?; fi
  require_root
  check_prereqs || exit 1
  install_node_pnpm
  install_sys_deps
  sync_repo
  build_app
  configure_network
  install_service
  log "done. Join Wi-Fi 'LifelineMesh' and open http://lifeline.local:8787"
}

main "$@"
