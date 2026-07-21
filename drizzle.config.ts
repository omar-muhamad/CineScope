import { defineConfig } from "drizzle-kit";
import { config } from "dotenv";

// drizzle-kit runs in Node and doesn't read Vite's .env files, so load them
// here. .env.local (gitignored, where secrets live) wins over .env.
config({ path: [".env.local", ".env"] });

/**
 * Drizzle migration tooling config. Build-time / CI only.
 *
 * `DATABASE_URL` is the app's Postgres connection string. It carries the DB
 * password, so it must NEVER be `VITE_`-prefixed (Vite inlines every `VITE_*`
 * var into the client bundle). Set it in .env.local or via the shell/CI:
 * `DATABASE_URL=... npm run db:migrate`.
 *
 * Use `db:generate` + `db:migrate` (never `push`) so schema history stays in
 * checked-in migration files.
 */
export default defineConfig({
  schema: ["./server/db/schema.ts", "./server/db/auth-schema.ts"],
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    // Migrations prefer Neon's direct (unpooled) endpoint; the app itself
    // always connects through the -pooler URL (see server/db/index.ts).
    url: process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL!,
  },
});
