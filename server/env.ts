import { config } from "dotenv";

// The server runs in Node and doesn't read Vite's .env files, so load them
// here. .env.local (gitignored, where secrets live) wins over .env, and real
// shell env vars win over both (dotenv never overrides existing vars).
config({ path: [".env.local", ".env"] });

const required = (name: string): string => {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
};

/**
 * Optional var where an empty string means unset — dashboards (e.g. Render's
 * Blueprint prompts) store vars left blank as "", which must fall back to
 * the default rather than yield port 0 / an empty From address.
 */
const optional = (name: string): string | undefined =>
  process.env[name] || undefined;

export const env = {
  /** Postgres connection string. Server-side only — never VITE_-prefixed. */
  databaseUrl: required("DATABASE_URL"),
  /** Secret for signing HS256 access tokens. Generate with `openssl rand -hex 32`. */
  jwtSecret: required("JWT_SECRET"),
  /**
   * Google OAuth web client ID — the `aud` we accept on Google ID tokens.
   * Must match the VITE_GOOGLE_CLIENT_ID the frontend renders the button with,
   * so it falls back to that var to avoid configuring the same value twice.
   */
  googleClientId:
    optional("GOOGLE_CLIENT_ID") ?? optional("VITE_GOOGLE_CLIENT_ID") ?? "",

  port: Number(optional("PORT") ?? 3001),
  /** Frontend origin — used to build email links (and CORS if ever split-origin). */
  appOrigin: optional("APP_ORIGIN") ?? "http://localhost:5173",

  accessTokenTtlSeconds: Number(process.env.ACCESS_TOKEN_TTL_SECONDS ?? 900), // 15 min
  refreshTokenTtlDays: Number(process.env.REFRESH_TOKEN_TTL_DAYS ?? 30),
  verificationTokenTtlHours: Number(
    process.env.VERIFICATION_TOKEN_TTL_HOURS ?? 24,
  ),
  // Reset links are deliberately shorter-lived than verification links — they
  // grant control of the account, not just activation.
  passwordResetTokenTtlMinutes: Number(
    process.env.PASSWORD_RESET_TOKEN_TTL_MINUTES ?? 60,
  ),

  /** SMTP transport for verification emails. Unset host = log links instead. */
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
