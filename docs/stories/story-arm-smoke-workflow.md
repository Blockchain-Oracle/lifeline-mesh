# Story — `story-arm-smoke-workflow`

**Epic:** Epic 1 — Scaffold + CI/CD · **Depends on:** `story-ci-workflow` · **Est:** 20 min

## Why
Proves the `@qvac/sdk` linux-arm64 native prebuild actually loads and runs on real arm64 — the core bet of the Tinkerer track — using free `ubuntu-24.04-arm` runners. Great build-in-public signal. Non-blocking so SDK/model flakiness never blocks merges.

## BDD acceptance criteria
```
Given .github/workflows/arm-smoke.yml
When dispatched on ubuntu-24.04-arm
Then it installs the SDK, loads the built-in DEV_LLM (QWEN3_1_7B_INST_Q4), runs one completion, and prints the output

Given the job fails (model download flake, prebuild issue)
Then the workflow is marked continue-on-error and does NOT block any PR

Given a repeat run
Then model weights are restored from actions/cache (key qvac-arm-smoke-dev-llm-v1)
```

## File modification map
- `.github/workflows/arm-smoke.yml` — NEW — `ubuntu-24.04-arm`, `continue-on-error: true`, `workflow_dispatch` + daily cron, model cache.
- `packages/core/src/smoke/arm-smoke.ts` — NEW — loads `MODELS.DEV_LLM` via the adapter, one completion, asserts non-empty output, exits 0/1. (Imports `@qvac/sdk` only through the adapter.)

## Shell verification
```bash
# locally on any arch (will download the tiny model):
pnpm --filter @lifeline/core exec node dist/smoke/arm-smoke.js   # prints a completion, exit 0
```

## Risks
- arm64 runner availability / model download time — mitigated by cache + non-blocking.
