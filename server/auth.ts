import { betterAuth, type User } from "better-auth";
import { APIError } from "better-auth/api";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { magicLink } from "better-auth/plugins";
import { eq } from "drizzle-orm";

import { db } from "./db";
import * as schema from "./db/schema";
import { env } from "./env";
import {
  sendChangeEmailVerificationEmail,
  sendMagicLinkEmail,
  sendVerificationEmail,
} from "./mailer";

const normalizeUsername = (value: unknown): string | null =>
  typeof value === "string" && value.trim() ? value.trim().toLowerCase() : null;

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
    // cookieCache stays OFF deliberately: Better Auth serializes the whole
    // user object — including our data-URL avatar in `image` — into chunked
    // cookies, ~100KB of headers on every request. Every getSession therefore
    // does one Neon roundtrip; acceptable at this scale.
  },

  rateLimit: {
    // Default is prod-only; force on so limits are testable in dev. Memory
    // storage is useless on serverless (one store per invocation), so limits
    // live in the DB (adds a `rateLimit` table to the generated schema).
    enabled: true,
    storage: "database",
    customRules: {
      // The email-sending endpoint is the abuse target — keep it tight.
      "/sign-in/magic-link": { window: 60 * 15, max: 5 },
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
      sendMagicLink: async ({ email, url }) => {
        await sendMagicLinkEmail(email, url);
      },
    }),
  ],

  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          const username = normalizeUsername(
            (user as Record<string, unknown>).username,
          );
          if (username) await assertUsernameFree(username);
          return {
            data: { ...user, email: user.email.toLowerCase(), username },
          };
        },
      },
      update: {
        before: async (data, ctx) => {
          if (!("username" in data)) return { data };
          const username = normalizeUsername(
            (data as Record<string, unknown>).username,
          );
          if (username) {
            await assertUsernameFree(username, ctx?.context.session?.user.id);
          }
          return { data: { ...data, username } };
        },
      },
    },
  },
});
