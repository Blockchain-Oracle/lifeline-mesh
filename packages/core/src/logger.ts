import pino, { type Logger } from "pino";

// App logs and the audit log are two separate streams (docs/architecture.md §9).
// No component uses console — everything goes through a namespaced pino child.

let rootLogger: Logger | undefined;

function root(): Logger {
  if (!rootLogger) {
    rootLogger = pino({ level: process.env["LOG_LEVEL"] ?? "info" });
  }
  return rootLogger;
}

export function getAppLogger(component: string): Logger {
  return root().child({ component });
}

export interface AuditLoggerOptions {
  destination?: string;
  consoleOutput?: boolean;
}

// A dedicated pino instance for the mandated inference audit log (NDJSON).
// base:null strips pid/hostname so each line is a clean audit record.
export function getAuditLogger(opts: AuditLoggerOptions = {}): Logger {
  const options = { level: "info", base: null };
  if (opts.destination) {
    return pino(options, pino.destination({ dest: opts.destination, sync: false }));
  }
  return pino(options);
}
