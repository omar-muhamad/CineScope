import { defineConfig } from "drizzle-kit";
import { config } from "dotenv";

// drizzle-kit runs in Node and doesn't read Vite's .env files, so load them
// here. .env.local (gitignored, where secrets live) wins over .env.
config({ path: [".env.local", ".env"] });

/**
 * Drizzle migration tooling config. Build-time / CI only.
 *
 * `DATABASE_URL` is the Supabase **direct / session pooler** connection string
 * (port 5432, NOT the 6543 transaction pooler — migrations need a session-level
 * connection). It carries the DB password, so it must NEVER be `VITE_`-prefixed
 * (Vite inlines every `VITE_*` var into the client bundle). Provide it via the
 * shell or a CI secret, e.g. `DATABASE_URL=... npm run db:migrate`.
 *
 * Use `db:generate` + `db:migrate` (never `push`): `push` diffs the live DB and
 * would drop the hand-written RLS policies / FK / CHECKs it doesn't know about.
 */
export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./supabase/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
