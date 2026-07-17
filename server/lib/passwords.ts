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
