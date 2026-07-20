import { createAuthClient } from "better-auth/react";
import {
  inferAdditionalFields,
  magicLinkClient,
} from "better-auth/client/plugins";

export const authClient = createAuthClient({
  // No baseURL: same-origin, and the server mounts Better Auth at the default
  // /api/auth base path (api/auth/[...all].ts) — reachable identically under
  // vercel dev, the dev:web proxy, and production.
  plugins: [
    magicLinkClient(),
    // MUST mirror user.additionalFields in server/auth.ts — kept as a schema
    // literal on purpose: an `inferAdditionalFields<typeof auth>()` import
    // would drag server sources (drizzle, node env) into the client build.
    // Update both files together.
    inferAdditionalFields({
      user: {
        username: { type: "string", required: false },
        firstName: { type: "string", required: false },
        lastName: { type: "string", required: false },
        onboardingComplete: { type: "boolean", required: false },
      },
    }),
  ],
});

/** The fully-typed Better Auth session user (core + additional fields). */
export type SessionUser = typeof authClient.$Infer.Session.user;
