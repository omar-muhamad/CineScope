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
    process.env.GOOGLE_CLIENT_ID ?? process.env.VITE_GOOGLE_CLIENT_ID ?? "",

  port: Number(process.env.PORT ?? 3001),
  /** Frontend origin — used to build email links (and CORS if ever split-origin). */
  appOrigin: process.env.APP_ORIGIN ?? "http://localhost:5173",

  accessTokenTtlSeconds: Number(process.env.ACCESS_TOKEN_TTL_SECONDS ?? 900), // 15 min
  refreshTokenTtlDays: Number(process.env.REFRESH_TOKEN_TTL_DAYS ?? 30),
  verificationTokenTtlHours: Number(
    process.env.VERIFICATION_TOKEN_TTL_HOURS ?? 24,
  ),

  /** SMTP transport for verification emails. Unset host = log links instead. */
  smtp: {
    host: process.env.SMTP_HOST ?? "",
    port: Number(process.env.SMTP_PORT ?? 587),
    user: process.env.SMTP_USER ?? "",
    pass: process.env.SMTP_PASS ?? "",
    from: process.env.MAIL_FROM ?? "CineScope <no-reply@cinescope.local>",
  },

  isProduction: process.env.NODE_ENV === "production",
};
