import { auth } from "../../server/auth";

/**
 * Better Auth catch-all — every /api/auth/* endpoint (magic link, Google
 * OAuth, session, updateUser, changeEmail, ...) is served by this one
 * function. Better Auth's handler speaks web-standard Request/Response,
 * which is exactly Vercel's Node-runtime function signature.
 */
const handler = (request: Request) => auth.handler(request);

export { handler as GET, handler as POST };
