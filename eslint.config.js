import js from "@eslint/js";
import tseslint from "typescript-eslint";
import prettier from "eslint-config-prettier";
import globals from "globals";

/**
 * Enforced engineering standards (see docs/architecture.md §2).
 * The 400-line cap is non-negotiable and also guarded in CI by scripts/check-sloc.mjs.
 */
export default tseslint.config(
  {
    ignores: ["**/dist/**", "**/node_modules/**", "**/*.config.js", "**/*.config.ts", "tests/fixtures/**"],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  prettier,
  {
    rules: {
      "max-lines": ["error", { max: 400, skipBlankLines: true, skipComments: true }],
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
      "no-console": "error",
      "no-magic-numbers": [
        "error",
        { ignore: [0, 1, -1, 2], ignoreArrayIndexes: true, enforceConst: true },
      ],
      "@typescript-eslint/no-explicit-any": "error",
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "@qvac/sdk",
              message: "Import @qvac/sdk only inside packages/core/src/inference*.ts (the adapter seam).",
            },
          ],
        },
      ],
    },
  },
  {
    // The adapter seam is the ONLY place @qvac/sdk may be imported.
    files: ["packages/core/src/inference*.ts"],
    rules: { "no-restricted-imports": "off" },
  },
  {
    // Scripts are human-facing Node CLIs: console output and literals are fine.
    files: ["scripts/**/*.mjs", "scripts/**/*.ts"],
    languageOptions: { globals: { ...globals.node } },
    rules: { "no-console": "off", "no-magic-numbers": "off" },
  },
  {
    // Tests and in-memory fakes are test scaffolding: literals are fine.
    files: ["**/*.test.ts", "**/*.spec.ts", "**/*.fakes.ts"],
    rules: { "no-magic-numbers": "off" },
  },
);
