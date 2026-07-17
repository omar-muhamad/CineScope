import { createHash, randomBytes } from "node:crypto";
import { eq } from "drizzle-orm";

import { db } from "../db";
import { emailVerificationTokens, users } from "../db/schema";
import { env } from "../env";

const hashToken = (token: string) =>
  createHash("sha256").update(token).digest("hex");

/**
 * Mint a single-use email-verification token and return the raw value (only
 * its hash is stored). Any previous unused tokens for the user are dropped so
 * exactly one link is valid at a time.
 */
export const issueVerificationToken = async (
  userId: string,
): Promise<string> => {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(
    Date.now() + env.verificationTokenTtlHours * 60 * 60 * 1000,
  );
  await db
    .delete(emailVerificationTokens)
    .where(eq(emailVerificationTokens.userId, userId));
  await db.insert(emailVerificationTokens).values({
    userId,
    tokenHash: hashToken(token),
    expiresAt,
  });
  return token;
};

/**
 * Consume a verification token: marks it used and flips the user to verified.
 * Returns false for unknown, expired, or already-used tokens.
 */
export const consumeVerificationToken = async (
  token: string,
): Promise<boolean> => {
  const [row] = await db
    .select()
    .from(emailVerificationTokens)
    .where(eq(emailVerificationTokens.tokenHash, hashToken(token)))
    .limit(1);

  if (!row || row.usedAt || row.expiresAt.getTime() <= Date.now()) {
    return false;
  }

  await db
    .update(emailVerificationTokens)
    .set({ usedAt: new Date() })
    .where(eq(emailVerificationTokens.id, row.id));
  await db
    .update(users)
    .set({ emailVerified: true, updatedAt: new Date() })
    .where(eq(users.id, row.userId));
  return true;
};
