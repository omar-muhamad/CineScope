import { eq } from "drizzle-orm";

import { db } from "../server/db/index.js";
import { user } from "../server/db/schema.js";
import { errorJson, requireUser, withErrorBody } from "../server/http.js";

/**
 * Read path for the uploaded avatar. `avatarData` is a returned:false field —
 * Better Auth strips it from every session response and from the cookieCache
 * cookie (that's what keeps the cookie ~1KB) — so the client fetches it here
 * once per sign-in and caches it (see src/api/avatar.ts).
 */
export const GET = withErrorBody(async (request: Request) => {
  const sessionUser = await requireUser(request);
  if (!sessionUser) return errorJson(401, "UNAUTHORIZED", "Not authenticated.");

  const [row] = await db
    .select({ avatarData: user.avatarData })
    .from(user)
    .where(eq(user.id, sessionUser.id))
    .limit(1);

  return Response.json({ avatar: row?.avatarData ?? null });
});
