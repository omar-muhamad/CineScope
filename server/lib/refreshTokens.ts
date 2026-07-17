import { createHash, randomBytes } from "node:crypto";
import { and, eq, isNull } from "drizzle-orm";

import { db } from "../db";
import { refreshTokens } from "../db/schema";
import { env } from "../env";

/** Only the SHA-256 of a refresh token ever touches the DB. */
const hashToken = (token: string) =>
  createHash("sha256").update(token).digest("hex");

const ttlMs = () => env.refreshTokenTtlDays * 24 * 60 * 60 * 1000;

export type IssuedRefreshToken = {
  token: string;
  expiresAt: Date;
};

/** Mint a new opaque refresh token for the user and persist its hash. */
export const issueRefreshToken = async (
  userId: string,
): Promise<IssuedRefreshToken> => {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + ttlMs());
  await db.insert(refreshTokens).values({
    userId,
    tokenHash: hashToken(token),
    expiresAt,
  });
  return { token, expiresAt };
};

export type RotationResult =
  | { ok: true; userId: string; next: IssuedRefreshToken }
  | { ok: false };

/**
 * Rotate a presented refresh token: revoke it and mint a replacement.
 *
 * Reuse detection: a token that exists but is already revoked means someone
 * replayed an old token (theft, or a very stale client). We can't tell which
 * party is legitimate, so every session for that user is revoked and both
 * sides must log in again.
 */
export const rotateRefreshToken = async (
  token: string,
): Promise<RotationResult> => {
  const [row] = await db
    .select()
    .from(refreshTokens)
    .where(eq(refreshTokens.tokenHash, hashToken(token)))
    .limit(1);

  if (!row) return { ok: false };

  if (row.revokedAt) {
    await revokeAllForUser(row.userId);
    return { ok: false };
  }

  if (row.expiresAt.getTime() <= Date.now()) return { ok: false };

  await db
    .update(refreshTokens)
    .set({ revokedAt: new Date() })
    .where(eq(refreshTokens.id, row.id));

  const next = await issueRefreshToken(row.userId);
  return { ok: true, userId: row.userId, next };
};

/** Revoke one token (logout). No-op if it doesn't exist. */
export const revokeRefreshToken = async (token: string): Promise<void> => {
  await db
    .update(refreshTokens)
    .set({ revokedAt: new Date() })
    .where(
      and(
        eq(refreshTokens.tokenHash, hashToken(token)),
        // Leave the original revocation timestamp intact on double-logout.
        isNull(refreshTokens.revokedAt),
      ),
    );
};

export const revokeAllForUser = async (userId: string): Promise<void> => {
  await db
    .update(refreshTokens)
    .set({ revokedAt: new Date() })
    .where(eq(refreshTokens.userId, userId));
};
