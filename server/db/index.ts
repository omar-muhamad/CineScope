import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { env } from "../env.js";
import * as schema from "./schema.js";

/**
 * Serverless-tuned Postgres client. The module-level singleton is reused
 * across warm invocations of one function instance; cold instances open
 * fresh connections. DATABASE_URL must be Neon's -pooler endpoint
 * (transaction-mode PgBouncer), which hands each statement a different
 * backend connection — named prepared statements break there, so they stay
 * off. (Better Auth's flows also need real transactions, which is why this
 * is postgres-js over TCP and not Neon's HTTP driver.)
 */
const client = postgres(env.databaseUrl, {
  prepare: false,
  // A fluid-compute instance serves concurrent requests — don't serialize
  // them on a single connection, but stay far under the pooler's limits.
  max: 5,
  // Release idle connections between request bursts.
  idle_timeout: 20,
  // Ride out Neon's scale-to-zero resume (~500ms–2s after idle).
  connect_timeout: 30,
});

export const db = drizzle(client, { schema });
