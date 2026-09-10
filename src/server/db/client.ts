import "server-only";

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { getServerEnv } from "@/lib/env";

import * as schema from "./schema";

/**
 * Database client.
 *
 * Cached on globalThis so that Next.js hot reloads in development do not open a
 * new pool on every edit and exhaust Postgres connections.
 */
const globalForDb = globalThis as unknown as {
  cofeSql?: ReturnType<typeof postgres>;
};

function createClient() {
  const { DATABASE_URL, NODE_ENV } = getServerEnv();

  return postgres(DATABASE_URL, {
    max: NODE_ENV === "production" ? 10 : 4,
    idle_timeout: 20,
    connect_timeout: 10,
  });
}

const client = globalForDb.cofeSql ?? createClient();

if (process.env.NODE_ENV !== "production") {
  globalForDb.cofeSql = client;
}

export const db = drizzle(client, { schema });

export type Database = typeof db;
export { schema };
