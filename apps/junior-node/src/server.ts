import { readFileSync, existsSync } from "node:fs";
import Fastify, { type FastifyInstance } from "fastify";
import fastifyStatic from "@fastify/static";
import { getAppLogger } from "@lifeline/core";
import type { CaseResult } from "@lifeline/agents";
import type { CaseService } from "./case-service.js";

const log = getAppLogger("junior.server");
const AUDIT_TAIL = 200;
const HTTP_BAD_REQUEST = 400;
const HTTP_NO_CONTENT = 204;

interface AssessBody {
  utterance: string;
  ageMonths: number;
  sex?: string;
}
interface ReferralBody {
  case: CaseResult;
  ageMonths: number;
  sex?: string;
  dateIso: string;
}

export function buildServer(service: CaseService, opts: { webDir?: string; auditPath: string }): FastifyInstance {
  const app = Fastify({ logger: false });

  app.get("/favicon.ico", async (_req, reply) => reply.code(HTTP_NO_CONTENT).send());

  app.get("/api/health", async () => ({ ok: true }));

  app.get("/api/mesh", async () => service.meshState());

  app.post<{ Body: AssessBody }>("/api/case", async (req, reply) => {
    const { utterance, ageMonths, sex } = req.body;
    if (!utterance || typeof ageMonths !== "number") {
      return reply.code(HTTP_BAD_REQUEST).send({ error: "utterance and ageMonths are required" });
    }
    return service.assess({ utterance, ageMonths, sex: sex ?? "unknown" });
  });

  app.post<{ Body: ReferralBody }>("/api/referral", async (req, reply) => {
    const { case: caseResult, ageMonths, sex, dateIso } = req.body;
    if (!caseResult || typeof ageMonths !== "number") {
      return reply.code(HTTP_BAD_REQUEST).send({ error: "case and ageMonths are required" });
    }
    const markdown = await service.referral(caseResult, ageMonths, sex ?? "unknown", dateIso);
    return { markdown };
  });

  app.get("/api/audit/recent", async () => {
    if (!existsSync(opts.auditPath)) return { entries: [] };
    const lines = readFileSync(opts.auditPath, "utf8").trim().split("\n").filter(Boolean);
    const entries = lines
      .slice(-AUDIT_TAIL)
      .map((l) => {
        try {
          return JSON.parse(l) as unknown;
        } catch {
          return null;
        }
      })
      .filter(Boolean);
    return { entries };
  });

  if (opts.webDir && existsSync(opts.webDir)) {
    void app.register(fastifyStatic, { root: opts.webDir });
    log.info({ webDir: opts.webDir }, "serving web UI");
  }

  return app;
}
