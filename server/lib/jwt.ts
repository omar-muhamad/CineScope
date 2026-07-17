import { SignJWT, jwtVerify } from "jose";

import { env } from "../env";

const secret = new TextEncoder().encode(env.jwtSecret);

/**
 * Short-lived HS256 access token. The only claim the API relies on is `sub`
 * (the user id) — everything else is re-read from the DB per request where it
 * matters (e.g. email verification state can change mid-session).
 */
export const signAccessToken = (userId: string): Promise<string> =>
  new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime(`${env.accessTokenTtlSeconds}s`)
    .sign(secret);

/** Returns the user id, or null for any invalid/expired token. */
export const verifyAccessToken = async (
  token: string,
): Promise<string | null> => {
  try {
    const { payload } = await jwtVerify(token, secret, {
      algorithms: ["HS256"],
    });
    return payload.sub ?? null;
  } catch {
    return null;
  }
};
