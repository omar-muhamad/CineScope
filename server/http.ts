import { auth } from "./auth";

/** The `{ code, message }` error body the client expects (see src/lib/api.ts). */
export const errorJson = (status: number, code: string, message: string) =>
  Response.json({ code, message }, { status });

/**
 * Session-cookie auth for app routes (the serverless sibling of the old
 * Fastify requireAuth preHandler). Returns the user or null — callers 401.
 */
export const requireUser = async (request: Request) => {
  const session = await auth.api.getSession({ headers: request.headers });
  return session?.user ?? null;
};
