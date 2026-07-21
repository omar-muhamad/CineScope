import { betterAuth, type User } from "better-auth";
import { APIError } from "better-auth/api";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { magicLink } from "better-auth/plugins";
import { eq } from "drizzle-orm";

import { db } from "./db/index.js";
import * as schema from "./db/schema.js";
import { env } from "./env.js";
import {
  sendChangeEmailVerificationEmail,
  sendMagicLinkEmail,
  sendVerificationEmail,
} from "./mailer.js";

const normalizeUsername = (value: unknown): string | null =>
  typeof value === "string" && value.trim() ? value.trim().toLowerCase() : null;

// Server-side field constraints (the DB columns are unbounded text; these are
// the real limits). Oversized username/name values would also inflate the
// cookieCache session_data cookie past the ~4KB browser cap and break the
// user's own session.
const USERNAME_PATTERN = /^[a-z0-9._]{3,30}$/;
const MAX_NAME_LENGTH = 50;
const MAX_AVATAR_DATA_LENGTH = 700_000; // ~512KB image as base64
const AVATAR_DATA_PATTERN = /^data:image\/(png|jpe?g|webp);base64,/;

const invalidField = (code: string, message: string) =>
  new APIError("UNPROCESSABLE_ENTITY", { code, message });

/**
 * Validate client-writable profile fields. `strict` rejects oversized names
 * (client-driven updates); non-strict truncates them instead — user creation
 * runs on OAuth callbacks where a long Google display name must not be able
 * to fail the whole sign-in.
 */
const validateProfileFields = <T extends Record<string, unknown>>(
  data: T,
  { strict }: { strict: boolean },
): T => {
  if (data.avatarData != null) {
    const avatar = data.avatarData;
    if (
      typeof avatar !== "string" ||
      avatar.length > MAX_AVATAR_DATA_LENGTH ||
      !AVATAR_DATA_PATTERN.test(avatar)
    ) {
      throw invalidField(
        "AVATAR_INVALID",
        "Avatar must be a PNG, JPEG or WebP image under 512KB.",
      );
    }
  }
  const out: Record<string, unknown> = { ...data };
  for (const field of ["firstName", "lastName", "name"] as const) {
    const value = out[field];
    if (typeof value === "string" && value.length > MAX_NAME_LENGTH) {
      if (strict) {
        throw invalidField(
          "NAME_TOO_LONG",
          `Names are limited to ${MAX_NAME_LENGTH} characters.`,
        );
      }
      out[field] = value.slice(0, MAX_NAME_LENGTH);
    }
  }
  return out as T;
};

const assertUsernameFormat = (username: string) => {
  if (!USERNAME_PATTERN.test(username)) {
    throw invalidField(
      "USERNAME_INVALID",
      "Usernames are 3-30 characters: letters, numbers, dots or underscores.",
    );
  }
};

/**
 * Pre-check username uniqueness so the client gets a clean USERNAME_TAKEN
 * error instead of an opaque 500 from the DB unique constraint (which stays
 * as the race-condition backstop).
 */
const assertUsernameFree = async (username: string, selfId?: string) => {
  const [existing] = await db
    .select({ id: schema.user.id })
    .from(schema.user)
    .where(eq(schema.user.username, username))
    .limit(1);
  if (existing && existing.id !== selfId) {
    throw new APIError("UNPROCESSABLE_ENTITY", {
      code: "USERNAME_TAKEN",
      message: "That username is already taken.",
    });
  }
};

export const auth = betterAuth({
  // The origin the BROWSER sees. Everything derives from it: magic-link URLs,
  // the Google redirect_uri (`${baseURL}/api/auth/callback/google`),
  // secure-cookie mode (https => Secure), and the auto-trusted origin.
  baseURL: env.baseUrl,
  secret: env.betterAuthSecret,
  trustedOrigins: env.trustedOrigins,

  database: drizzleAdapter(db, { provider: "pg", schema }),

  session: {
    expiresIn: 60 * 60 * 24 * 30, // 30 days, matches the old refresh-token TTL
    updateAge: 60 * 60 * 24,
    // Safe to cache the user in a cookie because the only large field —
    // the data-URL avatar — lives in `avatarData` (returned: false, stripped
    // from responses and this cookie alike); `image` only ever holds small
    // provider photo URLs. getSession answers from the signed session_data
    // cookie (~1KB) without touching the session/user tables (the DB-backed
    // rate limiter still does one small read+write per HTTP auth request);
    // updateUser rewrites it, so profile edits are never stale. Trade-off:
    // a revoked session keeps working for up to maxAge on routes that don't
    // disableCookieCache — the /api data endpoints opt out via requireUser.
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5,
    },
  },

  rateLimit: {
    // Default is prod-only; force on so limits are testable in dev. Memory
    // storage is useless on serverless (one store per invocation), so limits
    // live in the DB (adds a `rateLimit` table to the generated schema).
    enabled: true,
    storage: "database",
    customRules: {
      // The email-sending endpoint is the abuse target — keep it tight.
      // NOTE: the database storage prunes rate_limit rows older than the
      // largest BUILT-IN window (60s); customRules windows are not included
      // in that cutoff, so any window over 60s silently degrades to ~60s.
      // Keep the window at 60s so enforcement is exact. 2/min also matches
      // the client's 30s resend cooldown, so legit resends never 429.
      "/sign-in/magic-link": { window: 60, max: 2 },
    },
  },

  advanced: {
    ipAddress: {
      // Vercel sets these platform-trusted headers. Without them Better Auth
      // can't key rate limits per client and falls back to ONE shared bucket
      // for all users (it logs a warning saying so).
      ipAddressHeaders: ["x-vercel-forwarded-for", "x-forwarded-for"],
    },
  },

  user: {
    changeEmail: {
      enabled: true,
      // The approval link goes to the CURRENT address (the one that can prove
      // ownership); the change applies once it's opened.
      sendChangeEmailVerification: async ({
        user,
        newEmail,
        url,
      }: {
        user: User;
        newEmail: string;
        url: string;
      }) => {
        await sendChangeEmailVerificationEmail(user.email, newEmail, url);
      },
    },
    additionalFields: {
      // Nullable until onboarding sets it; uniqueness is pre-checked in the
      // databaseHooks below and enforced by the DB unique constraint.
      username: { type: "string", required: false, unique: true, input: true },
      firstName: { type: "string", required: false, input: true },
      lastName: { type: "string", required: false, input: true },
      // Gates the mandatory onboarding wizard; the client sets it true on the
      // final step. Client-writable by design — it protects UX, not data.
      onboardingComplete: {
        type: "boolean",
        required: false,
        defaultValue: false,
        input: true,
      },
      // Uploaded avatar as a ~50-100KB data URL. returned: false keeps it out
      // of every session response AND the cookieCache cookie — which is what
      // makes cookieCache viable at all. `image` stays reserved for small
      // provider photo URLs (Google). Read path: GET /api/avatar.
      avatarData: {
        type: "string",
        required: false,
        returned: false,
        input: true,
      },
    },
  },

  // Covers any flow where a (changed) address must be re-verified.
  emailVerification: {
    sendVerificationEmail: async ({ user, url }) => {
      await sendVerificationEmail(user.email, url);
    },
  },

  // Without Google creds (e.g. a fresh clone) the server still boots and
  // magic link works alone — mirrors the SMTP console fallback ethos.
  socialProviders:
    env.googleClientId && env.googleClientSecret
      ? {
          google: {
            clientId: env.googleClientId,
            clientSecret: env.googleClientSecret,
            prompt: "select_account",
          },
        }
      : {},

  account: {
    accountLinking: {
      enabled: true,
      // Google asserts email_verified, so a Google sign-in whose email matches
      // an existing (magic-link-created) user links to that user instead of
      // creating a duplicate. The reverse needs no config: magic-link verify
      // looks the user up by email and signs into the Google-created account.
      trustedProviders: ["google"],
    },
  },

  plugins: [
    magicLink({
      expiresIn: 60 * 10, // keep the mailer copy in sync (10 minutes)
      // Store only a hash at rest so a DB leak/backup doesn't yield live
      // sign-in links (same posture as the old SHA-256 token scheme).
      storeToken: "hashed",
      sendMagicLink: async ({ email, url }) => {
        await sendMagicLinkEmail(email, url);
      },
    }),
  ],

  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          // Non-strict: creation runs on OAuth callbacks, where an oversized
          // Google display name gets truncated rather than failing sign-in.
          const validated = validateProfileFields(
            user as Record<string, unknown>,
            { strict: false },
          );
          const username = normalizeUsername(validated.username);
          if (username) {
            assertUsernameFormat(username);
            await assertUsernameFree(username);
          }
          return {
            data: {
              ...user,
              ...validated,
              email: user.email.toLowerCase(),
              username,
            },
          };
        },
      },
      update: {
        before: async (data, ctx) => {
          const validated = validateProfileFields(
            data as Record<string, unknown>,
            { strict: true },
          );
          if (!("username" in validated))
            return { data: { ...data, ...validated } };
          const username = normalizeUsername(validated.username);
          if (username) {
            assertUsernameFormat(username);
            await assertUsernameFree(username, ctx?.context.session?.user.id);
          }
          return { data: { ...data, ...validated, username } };
        },
      },
    },
  },
});
