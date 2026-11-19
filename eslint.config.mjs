import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import designSystem from "./eslint/design-system.mjs";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // The design system: shared controls and token colours only (see eslint/design-system.mjs).
  {
    files: ["src/**/*.{ts,tsx}"],
    ignores: ["src/components/ui/**"],
    plugins: { "design-system": designSystem },
    rules: {
      "design-system/use-ui-controls": "error",
      "design-system/use-tokens": "error",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
