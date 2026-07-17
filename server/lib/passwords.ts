import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scryptAsync = promisify(scrypt) as (
  password: string,
  salt: Buffer,
  keylen: number,
) => Promise<Buffer>;

const KEY_LENGTH = 64;

/**
 * Password hashing via Node's built-in scrypt (memory-hard, no native deps).
 * Stored format: `scrypt:<salt hex>:<derived key hex>` — self-describing so
 * the algorithm can be swapped later without a migration.
 */
export const hashPassword = async (password: string): Promise<string> => {
  const salt = randomBytes(16);
  const derived = await scryptAsync(password, salt, KEY_LENGTH);
  return `scrypt:${salt.toString("hex")}:${derived.toString("hex")}`;
};

/**
 * Hash of a random throwaway password nobody knows. Login verifies against
 * this when the identifier doesn't resolve to a password account, burning
 * the same scrypt cost either way — otherwise the fast "no such user" path
 * would let response timing reveal which accounts exist.
 */
export const DUMMY_PASSWORD_HASH =
  "scrypt:96cc13e806b0ccbd06f59bfc8809c9fd:77aba062f80a196311cd192df89987b1dad63e9a5e852af901f8ecd05182ffbb8fd1902851156ee274ab49a0ef9195a3a88771dd2f1f3e2385bccaeb3c0b8534";

export const verifyPassword = async (
  password: string,
  stored: string,
): Promise<boolean> => {
  const [scheme, saltHex, keyHex] = stored.split(":");
  if (scheme !== "scrypt" || !saltHex || !keyHex) return false;
  const derived = await scryptAsync(
    password,
    Buffer.from(saltHex, "hex"),
    KEY_LENGTH,
  );
  const expected = Buffer.from(keyHex, "hex");
  return (
    derived.length === expected.length && timingSafeEqual(derived, expected)
  );
};
