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
   * Clerk secret key. Optional so a fresh clone runs without an account.
   *
   * When absent every visitor is anonymous: browsing and contributing still
   * work, and moderation is unavailable rather than open — the same
   * fail-closed rule the whole privileged surface follows.
   */
  CLERK_SECRET_KEY: z.string().min(1).optional(),

  /**
   * Emails granted the moderator role on sign-in, comma separated.
   *
   * Bootstrapping only: a fresh deployment has no moderators and no way to
   * appoint one. Removing an email here does not demote an existing moderator —
   * see resolveRole in domain/auth.
   */
  MODERATOR_EMAILS: z.string().optional(),

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
