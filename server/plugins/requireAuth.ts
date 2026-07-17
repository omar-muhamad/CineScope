import type { FastifyReply, FastifyRequest } from "fastify";

import { verifyAccessToken } from "../lib/jwt";

declare module "fastify" {
  interface FastifyRequest {
    /** Set by `requireAuth` — the authenticated user's id (JWT `sub`). */
    userId: string;
  }
}

/**
 * preHandler guard for protected routes: validates the `Authorization: Bearer`
 * access token and exposes the user id as `request.userId`. Responds 401 and
 * short-circuits the route on any missing/invalid/expired token — the client
 * treats 401 as "refresh the access token and retry".
 */
export const requireAuth = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const header = request.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : null;
  const userId = token ? await verifyAccessToken(token) : null;

  if (!userId) {
    return reply
      .code(401)
      .send({ code: "UNAUTHORIZED", message: "Not authenticated." });
  }

  request.userId = userId;
};
