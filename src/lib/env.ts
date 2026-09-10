import "server-only";

import { z } from "zod";

/**
 * Server-side environment.
 *
 * Parsed once, at first access, so a missing or malformed variable fails with a
 * readable message instead of surfacing as `undefined` three layers deep at
 * request time. `server-only` makes importing this from a client component a
 * build error, which keeps DATABASE_URL out of the browser bundle.
 */
const serverEnvSchema = z.object({
  DATABASE_URL: z
    .string()
    .min(1, "DATABASE_URL is required. Copy .env.example to .env and set it.")
    .refine(
      (value) => value.startsWith("postgres://") || value.startsWith("postgresql://"),
      "DATABASE_URL must be a PostgreSQL connection string.",
    ),

  /**
   * Sent to the geocoding provider so our traffic is attributable. Nominatim's
   * usage policy requires a descriptive User-Agent — see docs/PLAN.md §9.
   */
  GEOCODING_USER_AGENT: z.string().min(1).default("co-fe/0.1 (+https://github.com/laryts/cofe)"),

  GEOCODING_BASE_URL: z.string().url().default("https://nominatim.openstreetmap.org"),

  /**
   * Shared secret gating the moderation queue.
   *
   * Optional so a fresh clone runs without it — but when unset, moderation is
   * unavailable rather than open. Failing closed means a missing variable can
   * never silently expose the queue. Generate one with:
   *   openssl rand -base64 32
   */
  MODERATION_TOKEN: z
    .string()
    .min(
      24,
      "MODERATION_TOKEN should be at least 24 characters. Generate one with: openssl rand -base64 32",
    )
    .optional(),

  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

let cached: ServerEnv | undefined;

export function getServerEnv(): ServerEnv {
  if (cached) return cached;

  const parsed = serverEnvSchema.safeParse(process.env);

  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((issue) => `  • ${issue.path.join(".") || "(root)"}: ${issue.message}`)
      .join("\n");
    throw new Error(`Invalid environment configuration:\n${issues}`);
  }

  cached = parsed.data;
  return cached;
}
