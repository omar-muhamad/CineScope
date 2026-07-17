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
  revokeAllForUser,
  revokeRefreshToken,
  rotateRefreshToken,
  type IssuedRefreshToken,
} from "../lib/refreshTokens";
import {
  consumeVerificationToken,
  issueVerificationToken,
} from "../lib/verificationTokens";
import {
  consumePasswordResetToken,
  issuePasswordResetToken,
} from "../lib/passwordResetTokens";
import { sendPasswordResetEmail, sendVerificationEmail } from "../lib/mailer";
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
  username: user.username,
  firstName: user.firstName,
  lastName: user.lastName,
  avatarUrl: user.avatarUrl,
});

const normalizeEmail = (email: string) => email.trim().toLowerCase();
const normalizeUsername = (username: string) => username.trim().toLowerCase();

const findUserByEmail = async (email: string) => {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  return user;
};

const findUserByUsername = async (username: string) => {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.username, username))
    .limit(1);
  return user;
};

/**
 * Login accepts either identifier in one field. Usernames can't contain "@"
 * (see USERNAME_PATTERN), so its presence reliably picks the email path.
 */
const findUserByIdentifier = (identifier: string) =>
  identifier.includes("@")
    ? findUserByEmail(normalizeEmail(identifier))
    : findUserByUsername(normalizeUsername(identifier));

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
// No "@" allowed, so a login identifier is never ambiguous between the two.
const USERNAME_PATTERN = "^[A-Za-z0-9._]{3,30}$";

const passwordSchema = { type: "string", minLength: 8, maxLength: 128 };

const registerSchema = {
  type: "object",
  required: ["email", "password", "firstName", "lastName", "username"],
  properties: {
    email: { type: "string", maxLength: 254, pattern: EMAIL_PATTERN },
    password: passwordSchema,
    firstName: { type: "string", minLength: 1, maxLength: 50 },
    lastName: { type: "string", minLength: 1, maxLength: 50 },
    username: { type: "string", pattern: USERNAME_PATTERN },
    // Optional small avatar, uploaded as an image data URL (client resizes to
    // ~256px before sending; ~700KB of base64 stays well under the body cap).
    avatar: {
      type: "string",
      maxLength: 700_000,
      pattern: "^data:image/(png|jpe?g|webp);base64,",
    },
  },
} as const;

type RegisterBody = {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  username: string;
  avatar?: string;
};

const loginSchema = {
  type: "object",
  required: ["identifier", "password"],
  properties: {
    // Email or username — resolved by findUserByIdentifier.
    identifier: { type: "string", minLength: 3, maxLength: 254 },
    password: passwordSchema,
  },
} as const;

type LoginBody = { identifier: string; password: string };

// Per-IP limits (@fastify/rate-limit, registered global:false in app.ts).
// Credential endpoints absorb guessing; the email-sending ones are tighter
// because each request costs real mail and sender reputation.
const credentialRateLimit = {
  rateLimit: { max: 10, timeWindow: "1 minute" },
};
const emailRateLimit = {
  rateLimit: { max: 5, timeWindow: "15 minutes" },
};

export const authRoutes = (app: FastifyInstance) => {
  /** Create an email/password account. Login stays blocked until verified. */
  app.post<{ Body: RegisterBody }>(
    "/register",
    { schema: { body: registerSchema }, config: credentialRateLimit },
    async (request, reply) => {
      const email = normalizeEmail(request.body.email);
      const username = normalizeUsername(request.body.username);

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

      if (await findUserByUsername(username)) {
        return reply.code(409).send({
          code: "USERNAME_TAKEN",
          message: "This username is already taken. Pick another one.",
        });
      }

      const [user] = await db
        .insert(users)
        .values({
          email,
          username,
          firstName: request.body.firstName.trim(),
          lastName: request.body.lastName.trim(),
          avatarUrl: request.body.avatar ?? null,
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

  /** Login with email or username + password. */
  app.post<{ Body: LoginBody }>(
    "/login",
    { schema: { body: loginSchema }, config: credentialRateLimit },
    async (request, reply) => {
      const user = await findUserByIdentifier(request.body.identifier);

      // Same response for unknown account and wrong password — no enumeration.
      const passwordOk =
        user?.passwordHash != null &&
        (await verifyPassword(request.body.password, user.passwordHash));
      if (!user || !passwordOk) {
        return reply.code(401).send({
          code: "INVALID_CREDENTIALS",
          message: "Incorrect email/username or password.",
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
      config: credentialRateLimit,
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
      // Google's ID token carries a split name; fall back to slicing the
      // display name. Username stays null — Google accounts never pick one.
      const googleFirstName =
        payload.given_name ?? payload.name?.split(" ")[0] ?? null;
      const googleLastName =
        payload.family_name ??
        payload.name?.split(" ").slice(1).join(" ") ??
        null;

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
            firstName: user.firstName ?? googleFirstName,
            lastName: user.lastName ?? googleLastName,
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
            firstName: googleFirstName,
            lastName: googleLastName,
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
      config: credentialRateLimit,
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
  app.post<{ Body: { identifier: string } }>(
    "/resend-verification",
    {
      schema: {
        body: {
          type: "object",
          required: ["identifier"],
          properties: {
            // Email or username — the mail always goes to the account's
            // stored address, so accepting a username leaks nothing.
            identifier: { type: "string", minLength: 3, maxLength: 254 },
          },
        },
      },
      config: emailRateLimit,
    },
    async (request) => {
      const user = await findUserByIdentifier(request.body.identifier);
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

  /** Email a password-reset link. Always 200 — no account enumeration. */
  app.post<{ Body: { identifier: string } }>(
    "/forgot-password",
    {
      schema: {
        body: {
          type: "object",
          required: ["identifier"],
          properties: {
            // Email or username — the mail always goes to the account's
            // stored address, so accepting a username leaks nothing.
            identifier: { type: "string", minLength: 3, maxLength: 254 },
          },
        },
      },
      config: emailRateLimit,
    },
    async (request) => {
      const user = await findUserByIdentifier(request.body.identifier);
      // Google-only accounts have no password to reset; attaching one stays
      // an authenticated-only operation, same as in /register.
      if (user?.passwordHash) {
        try {
          await sendPasswordResetEmail(
            user.email,
            await issuePasswordResetToken(user.id),
          );
        } catch (error) {
          app.log.error(error, "password reset email failed to send");
        }
      }
      return {
        message: "If that account exists, a reset link is on its way.",
      };
    },
  );

  /** Consume an emailed reset token and set the new password. */
  app.post<{ Body: { token: string; password: string } }>(
    "/reset-password",
    {
      schema: {
        body: {
          type: "object",
          required: ["token", "password"],
          properties: {
            token: { type: "string", minLength: 1 },
            password: passwordSchema,
          },
        },
      },
      config: credentialRateLimit,
    },
    async (request, reply) => {
      const userId = await consumePasswordResetToken(request.body.token);
      if (!userId) {
        return reply.code(400).send({
          code: "INVALID_TOKEN",
          message: "This reset link is invalid or has expired.",
        });
      }

      await db
        .update(users)
        .set({
          passwordHash: await hashPassword(request.body.password),
          // Opening the emailed link proves address ownership — the same
          // proof verification asks for — so a pending signup unlocks here.
          emailVerified: true,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId));

      // The old password may be compromised — sign out every session.
      await revokeAllForUser(userId);

      return { message: "Password updated. You can log in now." };
    },
  );
};
