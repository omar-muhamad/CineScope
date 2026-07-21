import { auth } from "./auth.js";

/** The `{ code, message }` error body the client expects (see src/lib/api.ts). */
export const errorJson = (status: number, code: string, message: string) =>
  Response.json({ code, message }, { status });

/**
 * Session-cookie auth for app routes (the serverless sibling of the old
 * Fastify requireAuth preHandler). Returns the user or null — callers 401.
 *
 * disableCookieCache: these endpoints write user data, so a session revoked
 * in the DB must lose access immediately — not after the cookieCache's
 * 5-minute maxAge. The extra session lookup is fine here; every caller is
 * about to hit the DB anyway.
 */
export const requireUser = async (request: Request) => {
  const session = await auth.api.getSession({
    headers: request.headers,
    query: { disableCookieCache: true },
  });
  return session?.user ?? null;
};

/**
 * Wrap a route handler so unexpected failures (DB down, driver errors)
 * still answer with the `{ code, message }` shape the client parses —
 * the serverless sibling of the old Fastify setErrorHandler.
 */
export const withErrorBody =
  (handler: (request: Request) => Promise<Response>) =>
  async (request: Request): Promise<Response> => {
    try {
      return await handler(request);
    } catch (error) {
      console.error(error);
      return errorJson(500, "INTERNAL", "Something went wrong. Try again.");
    }
  };
