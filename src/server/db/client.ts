import "server-only";

import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { getServerEnv } from "@/lib/env";

import * as schema from "./schema";

/**
 * Database client.
 *
 * ★ Connection setup is deferred until the first query, not done at module
 * evaluation. That matters for two reasons:
 *
 *  1. **The build must not need a database.** Next.js imports every route module
 *     while collecting page data, so a client created at module scope throws
 *     during `next build` whenever DATABASE_URL is absent — which is the normal
 *     state of a CI or preview environment. Wrapping the *call sites* in
 *     try/catch cannot help, because the failure happens at import time, before
 *     any of that code runs.
 *  2. **A cold start should not pay for a pool it may not use.** A request
 *     served entirely from cache never touches Postgres.
 *
 * The proxy keeps call sites written as plain `db.select(...)`.
 */
type Schema = typeof schema;
export type Database = PostgresJsDatabase<Schema>;

/**
 * Cached on globalThis so Next.js hot reloads in development reuse one pool
 * instead of opening a new one on every edit and exhausting Postgres.
 */
const globalForDb = globalThis as unknown as {
  cofeSql?: ReturnType<typeof postgres>;
  cofeDb?: Database;
};

function createDatabase(): Database {
  const { DATABASE_URL, NODE_ENV } = getServerEnv();

  const client =
    globalForDb.cofeSql ??
    postgres(DATABASE_URL, {
      max: NODE_ENV === "production" ? 10 : 4,
      idle_timeout: 20,
      connect_timeout: 10,
    });

  if (NODE_ENV !== "production") globalForDb.cofeSql = client;

  return drizzle(client, { schema });
}

function getDatabase(): Database {
  const existing = globalForDb.cofeDb;
  if (existing) return existing;

  const database = createDatabase();
  globalForDb.cofeDb = database;
  return database;
}

export const db = new Proxy({} as Database, {
  get(_target, property) {
    const database = getDatabase();
    const value = database[property as keyof Database];

    // Drizzle's query builders rely on `this`, so hand back a bound function
    // rather than a detached one.
    return typeof value === "function" ? value.bind(database) : value;
  },
});

export { schema };
