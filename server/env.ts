import { config } from "dotenv";

// On Vercel the platform injects env vars directly. Everywhere else (vercel
// dev, drizzle-kit, the Better Auth CLI) load Vite's .env files. .env.local
// (gitignored, where secrets live) wins over .env, and real shell env vars
// win over both (dotenv never overrides existing vars).
if (!process.env.VERCEL) {
  config({ path: [".env.local", ".env"] });
}

const required = (name: string): string => {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
};

/**
 * Optional var where an empty string means unset — dashboard-created vars left
 * blank are stored as "", which must fall back to the default rather than
 * yield an empty From address or a bogus port.
 */
const optional = (name: string): string | undefined =>
  process.env[name] || undefined;

/**
 * The origin the BROWSER sees — Better Auth derives everything from it: the
 * magic-link URLs, the Google redirect_uri, secure-cookie mode, and the
 * auto-trusted origin. Production sets BETTER_AUTH_URL explicitly; preview
 * deployments fall back to VERCEL_URL (magic-link works there, Google doesn't
 * — its redirect URI isn't registered per-preview); local dev is the Vite
 * server on port 5173 (/api proxies to vercel dev on 3000).
 */
const baseUrl =
  optional("BETTER_AUTH_URL") ??
  (process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "http://localhost:5173");

export const env = {
  /**
   * Postgres connection string — must be the Neon POOLER endpoint
   * (`...-pooler.<region>.aws.neon.tech`): Vercel scales function instances
   * concurrently and the direct endpoint's connection cap can't absorb that.
   * Server-side only — never VITE_-prefixed.
   */
  databaseUrl: required("DATABASE_URL"),
  /** Better Auth signing secret. Generate with `openssl rand -base64 32`. */
  betterAuthSecret: required("BETTER_AUTH_SECRET"),

  baseUrl,
  trustedOrigins: [
    baseUrl,
    // Keep direct vercel-dev access (npm run dev, port 3000) passing origin
    // checks; cookies ignore ports so localhost sessions work on both.
    ...(process.env.NODE_ENV === "production" ? [] : ["http://localhost:3000"]),
  ],

  /** Google OAuth web client (server-side redirect flow). Empty = Google
   *  sign-in disabled; magic link still works. */
  googleClientId: optional("GOOGLE_CLIENT_ID") ?? "",
  googleClientSecret: optional("GOOGLE_CLIENT_SECRET") ?? "",

  /** SMTP transport for auth emails. Unset host = log links to the console. */
  smtp: {
    host: process.env.SMTP_HOST ?? "",
    port: Number(optional("SMTP_PORT") ?? 587),
    user: process.env.SMTP_USER ?? "",
    pass: process.env.SMTP_PASS ?? "",
    // The From address must align with the sending domain or receivers flag
    // the mail as spoofed, so default to the authenticated SMTP account.
    from:
      optional("MAIL_FROM") ??
      (process.env.SMTP_USER
        ? `CineScope <${process.env.SMTP_USER}>`
        : "CineScope <no-reply@cinescope.local>"),
  },

  isProduction: process.env.NODE_ENV === "production",
};
