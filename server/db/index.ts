import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { env } from "../env";
import * as schema from "./schema";

/**
 * Transaction-mode poolers (PgBouncer and friends) hand each statement a
 * different backend connection, which breaks postgres.js's named prepared
 * statements. Detect the common pooled-URL conventions — Supabase's
 * `?pgbouncer=true` flag and Neon's `-pooler` host — and disable them.
 */
const isPooledUrl = (url: string) => {
  try {
    const parsed = new URL(url);
    return (
      parsed.searchParams.get("pgbouncer") === "true" ||
      parsed.hostname.includes("-pooler")
    );
  } catch {
    return false;
  }
};

const client = postgres(env.databaseUrl, {
  prepare: !isPooledUrl(env.databaseUrl),
});

export const db = drizzle(client, { schema });

/** Close the underlying pool — used on graceful shutdown. */
export const closeDb = () => client.end();
