import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

/**
 * Architectural boundaries.
 *
 * These mirror the dependency rule documented in docs/ARCHITECTURE.md. They are
 * enforced here rather than left to discipline, because a layering rule that is
 * only written down is a layering rule that decays on a busy Friday.
 *
 *   app ──▶ server/services ──▶ server/repositories ──▶ server/db
 *    │             │                     │
 *    └─────────────┴─────────────────────┴──────────▶ domain
 *   components ──────────────────────────────────────▶ domain
 */
const boundaries = defineConfig([
  {
    // The domain layer is pure: no framework, no I/O, no rendering.
    // If something in here needs the database, the design is wrong.
    files: ["src/domain/**/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: [
                "@/app/*",
                "@/server/*",
                "@/components/*",
                "next",
                "next/*",
                "react",
                "react-dom",
              ],
              message:
                "domain/ must stay pure TypeScript so it can be reused by the API, tests and a future mobile client. Move framework or I/O concerns into server/ or components/.",
            },
          ],
        },
      ],
    },
  },
  {
    // Presentational components receive data as props. They never reach for it.
    files: ["src/components/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/server/*"],
              message:
                "components/ must not touch the server layer. Fetch in a Server Component under app/ and pass data down as props.",
            },
          ],
        },
      ],
    },
  },
  {
    // Routes and pages talk to services, never straight to SQL.
    files: ["src/app/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/server/db", "@/server/db/*", "@/server/repositories/*"],
              message:
                "app/ must go through @/server/services so use cases stay reusable and testable outside the request lifecycle.",
            },
          ],
        },
      ],
    },
  },
  {
    // The seed and migration scripts are the one legitimate exception: they are
    // standalone entry points that own their own database connection.
    files: ["src/server/db/**/*.ts", "*.config.ts", "*.config.mts"],
    rules: {
      "no-restricted-imports": "off",
    },
  },
]);

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // Quality gates from docs/PLAN.md §17. `any` and silenced errors hide bugs
      // and are the two easiest things to let slip in review.
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/ban-ts-comment": [
        "error",
        { "ts-expect-error": "allow-with-description", "ts-ignore": true, "ts-nocheck": true },
      ],
      "@typescript-eslint/consistent-type-imports": [
        "error",
        { prefer: "type-imports", fixStyle: "inline-type-imports" },
      ],
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_", caughtErrorsIgnorePattern: "^_" },
      ],
      "no-console": ["warn", { allow: ["warn", "error"] }],
      eqeqeq: ["error", "always", { null: "ignore" }],
    },
  },
  ...boundaries,
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts", "src/server/db/migrations/**"]),
]);

export default eslintConfig;
