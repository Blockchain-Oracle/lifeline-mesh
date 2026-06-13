#!/usr/bin/env node
// Assert the Pi infra config files stay consistent with the app constants
// (SSID, hostname, junior port). Run after `pnpm build`.
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";

const ROOT = join(dirname(new URL(import.meta.url).pathname), "..");
const { AP, PORTS } = await import(join(ROOT, "packages/core/dist/constants.js"));

const read = (p) => readFileSync(join(ROOT, p), "utf8");
const checks = [];
const expect = (cond, msg) => checks.push({ ok: Boolean(cond), msg });

const hostapd = read("infra/pi/hostapd.conf");
expect(hostapd.includes(`ssid=${AP.SSID}`), `hostapd.conf SSID must be ${AP.SSID}`);

const avahi = read("infra/pi/avahi-lifeline.service");
expect(avahi.includes(`<port>${PORTS.JUNIOR_HTTP}</port>`), `avahi service port must be ${PORTS.JUNIOR_HTTP}`);

const dnsmasq = read("infra/pi/dnsmasq.conf");
expect(dnsmasq.includes(AP.HOSTNAME), `dnsmasq.conf must resolve ${AP.HOSTNAME}`);

const unit = read("infra/pi/lifeline-junior.service");
expect(unit.includes("apps/junior-node/dist/index.js"), "systemd ExecStart must run the junior node");
expect(unit.includes("EnvironmentFile="), "systemd unit must reference an EnvironmentFile");

let failed = false;
for (const c of checks) {
  console.log(`${c.ok ? "OK" : "FAIL"}: ${c.msg}`);
  if (!c.ok) failed = true;
}
process.exit(failed ? 1 : 0);
