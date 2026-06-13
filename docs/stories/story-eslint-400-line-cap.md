# Story — `story-eslint-400-line-cap`

**Epic:** Epic 1 — Scaffold + CI/CD
**Depends on:** `story-monorepo-bootstrap`
**Estimated coding time:** 25 min

## Why
Abu's non-negotiable engineering rule: no file may exceed 400 lines of code. Setting this gate up at scaffold time, not later, prevents debt accumulation and gives every story a clean failure signal when a file is creeping past the cap.

## BDD acceptance criteria

```
Given the repository at HEAD has eslint.config.js with the max-lines rule
When `pnpm lint` runs against a 401-line .ts file with no blank lines and no comments
Then eslint exits non-zero
And the error message contains "max-lines"

Given the repository at HEAD has eslint.config.js
When `pnpm lint` runs against a 400-line .ts file with no blank lines and no comments
Then eslint exits zero

Given the repository at HEAD has the `no-magic-numbers` rule configured with `ignore: [0, 1, -1, 2]`
When `pnpm lint` runs against a file containing `setTimeout(fn, 5000)`
Then eslint exits non-zero with rule id `no-magic-numbers`

Given the repository at HEAD has the `no-console` rule
When `pnpm lint` runs against `apps/junior-node/src/foo.ts` containing `console.log("x")`
Then eslint exits non-zero with rule id `no-console`

Given the repository at HEAD has the `no-restricted-imports` rule banning `@qvac/sdk` outside `packages/core/src/inference.ts`
When `pnpm lint` runs against `apps/junior-node/src/foo.ts` containing `import { loadModel } from "@qvac/sdk"`
Then eslint exits non-zero with rule id `no-restricted-imports`

Given `apps/junior-node/src/index.ts` imports `loadModel` from `@qvac/sdk`
When `pnpm lint` runs (this file is an inference adapter entry, but lives outside packages/core)
Then eslint exits non-zero (the rule has no per-file allowlist outside the adapter)

Given `packages/core/src/inference.ts` imports `loadModel` from `@qvac/sdk`
When `pnpm lint` runs
Then eslint exits zero

Given a CI run is triggered on a PR
When the workflow reaches the "400-line shell guard" step
Then the step counts SLOC (non-blank, non-`//` lines) for every `.ts|.tsx|.js|.mjs` under apps/, packages/, scripts/ and fails the build if any file exceeds 400
```

## File modification map
- `eslint.config.js` — NEW — flat config with: `@typescript-eslint`, `import`, `max-lines: ["error", { max: 400, skipBlankLines: true, skipComments: true }]`, `no-console: error`, `no-magic-numbers: ["error", { ignore: [0, 1, -1, 2] }]`, `@typescript-eslint/no-explicit-any: error`, `no-restricted-imports: ["error", { paths: [{ name: "@qvac/sdk", message: "Import @qvac/sdk only inside packages/core/src/inference.ts." }] }]`, with an override that *unbans* `@qvac/sdk` for `packages/core/src/inference*.ts` only.
- `package.json` — UPDATE — adds `"lint": "eslint . --max-warnings=0"`, devDeps `eslint@9`, `typescript-eslint@8`, `@eslint/js`, `eslint-plugin-import`.
- `.prettierrc` — NEW — width 100, single quotes, trailing-comma all, no semicolons-or-yes (pick one and lock).
- `tests/eslint-rules.spec.ts` — NEW — vitest snapshot suite executing eslint programmatically against 7 fixture strings (one per BDD bullet above) under `tests/fixtures/eslint/`.
- `tests/fixtures/eslint/*.ts` — NEW — 7 fixture files covering every rule above.
- `.github/workflows/ci.yml` — UPDATE (or NEW; coordinate with `story-ci-workflow`) — adds the "400-line shell guard" step using `find` + `awk` over SLOC. The exact shell snippet:
  ```bash
  OVER=$(
    find apps packages scripts -type f \( -name '*.ts' -o -name '*.tsx' -o -name '*.js' -o -name '*.mjs' \) -print0 \
    | xargs -0 -I{} sh -c 'sloc=$(grep -cvE "^\s*(//|$)" "{}"); if [ "$sloc" -gt 400 ]; then echo "{}: $sloc"; fi'
  )
  if [ -n "$OVER" ]; then printf "Files over 400 SLOC:\n%s\n" "$OVER"; exit 1; fi
  ```

## Shell verification (the coding agent must paste outputs in the PR)
```bash
pnpm lint                                                # exits 0 on the scaffolded repo
node -e "require('child_process').execSync('pnpm lint tests/fixtures/eslint/long-file.ts', {stdio:'inherit'})" 2>&1 | grep -q "max-lines"  # must succeed (i.e. message present)
pnpm test -- tests/eslint-rules.spec.ts                  # at least 7 behavioural assertions pass
bash -c '...the 400-line shell guard from above...'      # exits 0 on the scaffolded repo
```

## Non-goals
- The story does NOT enforce the rule on the existing partial scaffold; only future files. (We will refactor anything that creeps over the cap when it appears.)
- The story does NOT add Prettier conflicts with eslint — `eslint-config-prettier` is added to silence overlapping rules.

## Risks
- ESLint 9 flat config + plugin compatibility — pin `@typescript-eslint@8.x` (flat-config-ready).
