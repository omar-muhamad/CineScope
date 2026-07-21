import { auth } from "../../server/auth";

/**
 * Better Auth catch-all — every /api/auth/* endpoint (magic link, Google
 * OAuth, session, updateUser, changeEmail, ...) is served by this one
 * function. Better Auth's handler speaks web-standard Request/Response,
 * which is exactly Vercel's Node-runtime function signature.
 *
 * Vercel compiles `[...all]` to a SINGLE path segment, so multi-segment
 * paths (/api/auth/sign-in/magic-link, /api/auth/callback/google) only
 * reach this function through the vercel.json rewrite, which smuggles the
 * real path in `__ba_path`. Restore it before handing off to Better Auth —
 * without this, every multi-segment auth route 404s on deployed Vercel
 * (`vercel dev` preserves the original path, so local testing won't catch
 * it). Vercel merges the original query string into the rewrite target, so
 * the remaining params (e.g. magic-link ?token=) survive intact.
 */
const handler = async (request: Request): Promise<Response> => {
  const url = new URL(request.url);
  const baPath = url.searchParams.get("__ba_path");
  if (!baPath || !baPath.startsWith("/api/auth/")) return auth.handler(request);

  url.pathname = baPath;
  url.searchParams.delete("__ba_path");
  const body =
    request.method === "GET" || request.method === "HEAD"
      ? undefined
      : await request.arrayBuffer();
  return auth.handler(
    new Request(url, {
      method: request.method,
      headers: request.headers,
      body,
    }),
  );
};

export { handler as GET, handler as POST };
