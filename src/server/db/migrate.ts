/**
 * Migration runner.
 *
 * A standalone entry point rather than something the app does at boot: running
 * migrations from a serverless request handler is how you get two instances
 * racing the same DDL.
 */
import { config } from "dotenv";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

config({ path: ".env", quiet: true });

async function main() {
  const url = process.env.DATABASE_URL;

  if (!url) {
    throw new Error("DATABASE_URL is not set. Copy .env.example to .env and fill it in.");
  }

  // `max: 1` because migrations must run sequentially on one connection.
  const client = postgres(url, { max: 1 });

  try {
    await migrate(drizzle(client), { migrationsFolder: "./src/server/db/migrations" });
    console.warn("✓ Migrations applied");
  } finally {
    await client.end();
  }
}

main().catch((error: unknown) => {
  console.error("✗ Migration failed:", error);
  process.exitCode = 1;
});
