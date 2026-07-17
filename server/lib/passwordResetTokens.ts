import { createHash, randomBytes } from "node:crypto";
import { eq } from "drizzle-orm";

import { db } from "../db";
import { passwordResetTokens } from "../db/schema";
import { env } from "../env";

const hashToken = (token: string) =>
  createHash("sha256").update(token).digest("hex");

/**
 * Mint a single-use password-reset token and return the raw value (only its
 * hash is stored). Any previous unused tokens for the user are dropped so
 * exactly one link is valid at a time.
 */
export const issuePasswordResetToken = async (
  userId: string,
): Promise<string> => {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(
    Date.now() + env.passwordResetTokenTtlMinutes * 60 * 1000,
  );
  await db
    .delete(passwordResetTokens)
    .where(eq(passwordResetTokens.userId, userId));
  await db.insert(passwordResetTokens).values({
    userId,
    tokenHash: hashToken(token),
    expiresAt,
  });
  return token;
};

/**
 * Consume a reset token: marks it used and returns the owning user's id.
 * Returns null for unknown, expired, or already-used tokens. The caller is
 * responsible for actually updating the password.
 */
export const consumePasswordResetToken = async (
  token: string,
): Promise<string | null> => {
  const [row] = await db
    .select()
    .from(passwordResetTokens)
    .where(eq(passwordResetTokens.tokenHash, hashToken(token)))
    .limit(1);

  if (!row || row.usedAt || row.expiresAt.getTime() <= Date.now()) {
    return null;
  }

  await db
    .update(passwordResetTokens)
    .set({ usedAt: new Date() })
    .where(eq(passwordResetTokens.id, row.id));
  return row.userId;
};
