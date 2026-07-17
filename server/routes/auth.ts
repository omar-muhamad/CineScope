import type { FastifyInstance, FastifyReply } from "fastify";
import { OAuth2Client } from "google-auth-library";
import { eq } from "drizzle-orm";

import { db } from "../db";
import { users, type User } from "../db/schema";
import { env } from "../env";
import { signAccessToken } from "../lib/jwt";
import { hashPassword, verifyPassword } from "../lib/passwords";
import {
  issueRefreshToken,
  revokeRefreshToken,
  rotateRefreshToken,
  type IssuedRefreshToken,
} from "../lib/refreshTokens";
import {
  consumeVerificationToken,
  issueVerificationToken,
} from "../lib/verificationTokens";
import { sendVerificationEmail } from "../lib/mailer";
import { requireAuth } from "../plugins/requireAuth";

const REFRESH_COOKIE = "cine_refresh";

/**
 * The refresh token only ever travels to the auth endpoints, so the cookie is
 * scoped to this route prefix — the rest of the API never sees it.
 */
const refreshCookieOptions = {
  httpOnly: true,
  sameSite: "lax",
  secure: env.isProduction,
  path: "/api/auth",
} as const;

const setRefreshCookie = (reply: FastifyReply, issued: IssuedRefreshToken) =>
  reply.setCookie(REFRESH_COOKIE, issued.token, {
    ...refreshCookieOptions,
    expires: issued.expiresAt,
  });

const clearRefreshCookie = (reply: FastifyReply) =>
  reply.clearCookie(REFRESH_COOKIE, refreshCookieOptions);

/** The user shape the client sees — never includes hashes or provider ids. */
const publicUser = (user: User) => ({
  id: user.id,
  email: user.email,
  emailVerified: user.emailVerified,
  name: user.name,
  avatarUrl: user.avatarUrl,
});

const normalizeEmail = (email: string) => email.trim().toLowerCase();

const findUserByEmail = async (email: string) => {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  return user;
};

const findUserById = async (id: string) => {
  const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return user;
};

/** Sign the pair of tokens, set the refresh cookie, and shape the response. */
const issueSession = async (reply: FastifyReply, user: User) => {
  const accessToken = await signAccessToken(user.id);
  setRefreshCookie(reply, await issueRefreshToken(user.id));
  return { user: publicUser(user), accessToken };
};

// Body schemas (Fastify's built-in Ajv validation). The email pattern is a
// sanity check only — real ownership is proven by the verification email.
const EMAIL_PATTERN = "^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$";

const credentialsSchema = {
  type: "object",
  required: ["email", "password"],
  properties: {
    email: { type: "string", maxLength: 254, pattern: EMAIL_PATTERN },
    password: { type: "string", minLength: 8, maxLength: 128 },
  },
} as const;

type Credentials = { email: string; password: string };

export const authRoutes = (app: FastifyInstance) => {
  /** Create an email/password account. Login stays blocked until verified. */
  app.post<{ Body: Credentials }>(
    "/register",
    { schema: { body: credentialsSchema } },
    async (request, reply) => {
      const email = normalizeEmail(request.body.email);

      const existing = await findUserByEmail(email);
      if (existing) {
        // Never attach a password to an existing account from an unauthenticated
        // request — for Google-only accounts that would let anyone who knows the
        // email hijack it. Linking works the other way (Google onto password).
        return reply.code(409).send({
          code: "EMAIL_TAKEN",
          message: existing.passwordHash
            ? "An account with this email already exists. Try logging in."
            : "This email is registered via Google. Continue with Google instead.",
        });
      }

      const [user] = await db
        .insert(users)
        .values({
          email,
          passwordHash: await hashPassword(request.body.password),
        })
        .returning();

      try {
        await sendVerificationEmail(
          email,
          await issueVerificationToken(user.id),
        );
      } catch (error) {
        // The account exists either way; the user can hit "resend" from the UI.
        app.log.error(error, "verification email failed to send");
      }

      return reply.code(201).send({
        message: "Account created. Check your email for a verification link.",
      });
    },
  );

  /** Email + password login. */
  app.post<{ Body: Credentials }>(
    "/login",
    { schema: { body: credentialsSchema } },
    async (request, reply) => {
      const email = normalizeEmail(request.body.email);
      const user = await findUserByEmail(email);

      // Same response for unknown email and wrong password — no enumeration.
      const passwordOk =
        user?.passwordHash != null &&
        (await verifyPassword(request.body.password, user.passwordHash));
      if (!user || !passwordOk) {
        return reply.code(401).send({
          code: "INVALID_CREDENTIALS",
          message: "Incorrect email or password.",
        });
      }

      if (!user.emailVerified) {
        return reply.code(403).send({
          code: "EMAIL_NOT_VERIFIED",
          message: "Verify your email before logging in.",
        });
      }

      return issueSession(reply, user);
    },
  );

  /**
   * Google sign-in: the client posts the ID token (`credential`) produced by
   * @react-oauth/google's GoogleLogin button; we verify it against our client
   * id. Existing password accounts with the same (Google-verified) email are
   * auto-linked; brand-new emails get a fresh account.
   */
  app.post<{ Body: { credential: string } }>(
    "/google",
    {
      schema: {
        body: {
          type: "object",
          required: ["credential"],
          properties: { credential: { type: "string", minLength: 1 } },
        },
      },
    },
    async (request, reply) => {
      if (!env.googleClientId) {
        return reply.code(500).send({
          code: "GOOGLE_NOT_CONFIGURED",
          message: "Google sign-in is not configured on the server.",
        });
      }

      let payload;
      try {
        const ticket = await new OAuth2Client().verifyIdToken({
          idToken: request.body.credential,
          audience: env.googleClientId,
        });
        payload = ticket.getPayload();
      } catch {
        payload = undefined;
      }
      if (!payload?.sub || !payload.email || payload.email_verified !== true) {
        return reply.code(401).send({
          code: "INVALID_GOOGLE_TOKEN",
          message: "Google sign-in could not be verified.",
        });
      }

      const email = normalizeEmail(payload.email);
      let user =
        (await db
          .select()
          .from(users)
          .where(eq(users.googleId, payload.sub))
          .limit(1)
          .then((rows) => rows[0])) ?? (await findUserByEmail(email));

      if (user) {
        // Link + refresh profile bits Google knows better than we do. Google
        // verified the address, so a pending password signup becomes verified.
        [user] = await db
          .update(users)
          .set({
            googleId: payload.sub,
            emailVerified: true,
            name: user.name ?? payload.name ?? null,
            avatarUrl: user.avatarUrl ?? payload.picture ?? null,
            updatedAt: new Date(),
          })
          .where(eq(users.id, user.id))
          .returning();
      } else {
        [user] = await db
          .insert(users)
          .values({
            email,
            googleId: payload.sub,
            emailVerified: true,
            name: payload.name ?? null,
            avatarUrl: payload.picture ?? null,
          })
          .returning();
      }

      return issueSession(reply, user);
    },
  );

  /**
   * Exchange the refresh cookie for a fresh access token (and a rotated
   * refresh token). This is also the silent session restore on page load.
   */
  app.post("/refresh", async (request, reply) => {
    const presented = request.cookies[REFRESH_COOKIE];
    if (!presented) {
      return reply
        .code(401)
        .send({ code: "NO_SESSION", message: "Not signed in." });
    }

    const rotation = await rotateRefreshToken(presented);
    if (!rotation.ok) {
      clearRefreshCookie(reply);
      return reply
        .code(401)
        .send({ code: "SESSION_EXPIRED", message: "Session expired." });
    }

    const user = await findUserById(rotation.userId);
    if (!user) {
      clearRefreshCookie(reply);
      return reply
        .code(401)
        .send({ code: "SESSION_EXPIRED", message: "Session expired." });
    }

    const accessToken = await signAccessToken(user.id);
    setRefreshCookie(reply, rotation.next);
    return { user: publicUser(user), accessToken };
  });

  /** Revoke the current session and drop the cookie. Always succeeds. */
  app.post("/logout", async (request, reply) => {
    const presented = request.cookies[REFRESH_COOKIE];
    if (presented) await revokeRefreshToken(presented);
    clearRefreshCookie(reply);
    return reply.code(204).send();
  });

  /** The authenticated user's profile. */
  app.get("/me", { preHandler: requireAuth }, async (request, reply) => {
    const user = await findUserById(request.userId);
    if (!user) {
      return reply
        .code(401)
        .send({ code: "UNAUTHORIZED", message: "Not authenticated." });
    }
    return { user: publicUser(user) };
  });

  /** Consume an emailed verification token. */
  app.post<{ Body: { token: string } }>(
    "/verify-email",
    {
      schema: {
        body: {
          type: "object",
          required: ["token"],
          properties: { token: { type: "string", minLength: 1 } },
        },
      },
    },
    async (request, reply) => {
      const ok = await consumeVerificationToken(request.body.token);
      if (!ok) {
        return reply.code(400).send({
          code: "INVALID_TOKEN",
          message: "This verification link is invalid or has expired.",
        });
      }
      return { message: "Email verified. You can log in now." };
    },
  );

  /** Re-send the verification link. Always 200 — no account enumeration. */
  app.post<{ Body: { email: string } }>(
    "/resend-verification",
    {
      schema: {
        body: {
          type: "object",
          required: ["email"],
          properties: {
            email: { type: "string", maxLength: 254, pattern: EMAIL_PATTERN },
          },
        },
      },
    },
    async (request) => {
      const user = await findUserByEmail(normalizeEmail(request.body.email));
      if (user && !user.emailVerified) {
        try {
          await sendVerificationEmail(
            user.email,
            await issueVerificationToken(user.id),
          );
        } catch (error) {
          app.log.error(error, "verification email failed to send");
        }
      }
      return {
        message: "If that address needs verification, an email is on its way.",
      };
    },
  );
};
