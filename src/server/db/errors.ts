/**
 * Turning database failures into instructions.
 *
 * A contributor who forgets `pnpm db:migrate` should be told that in one line,
 * not have to read a Drizzle stack trace to find `relation "cafes" does not
 * exist` buried in the middle of it. The setup promise in the README is five
 * minutes; a wall of stack trace on the first stumble is how that promise gets
 * broken.
 */

/** PostgreSQL error codes we can give better advice about. */
const UNDEFINED_TABLE = "42P01";
const CONNECTION_REFUSED = new Set(["ECONNREFUSED", "ENOTFOUND", "ETIMEDOUT"]);

interface PostgresLikeError {
  code?: string;
  cause?: { code?: string };
}

function codeOf(error: unknown): string | undefined {
  if (typeof error !== "object" || error === null) return undefined;
  const candidate = error as PostgresLikeError;
  return candidate.code ?? candidate.cause?.code;
}

/**
 * A short, actionable explanation, or null when we have nothing better to say
 * than the original error.
 */
export function explainDatabaseError(error: unknown): string | null {
  const code = codeOf(error);

  if (code === UNDEFINED_TABLE) {
    return [
      "The database has no tables yet.",
      "",
      "Run the migrations first:",
      "  pnpm db:migrate",
    ].join("\n");
  }

  if (code && CONNECTION_REFUSED.has(code)) {
    return [
      "Could not reach the database.",
      "",
      "Check that it is running and that DATABASE_URL is right:",
      "  docker compose up -d db",
    ].join("\n");
  }

  return null;
}

/**
 * Report a failure from a standalone script and set a failing exit code.
 *
 * Prints the explanation when there is one and the raw error when there is not,
 * so an unrecognised failure is never swallowed.
 */
export function reportScriptFailure(prefix: string, error: unknown): void {
  const explanation = explainDatabaseError(error);

  if (explanation) {
    console.error(`\n✗ ${prefix}\n\n${explanation}\n`);
  } else {
    console.error(`✗ ${prefix}`, error);
  }

  process.exitCode = 1;
}
