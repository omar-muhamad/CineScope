import { useCallback, useMemo } from "react";

import { authClient, type SessionUser } from "@/lib/auth-client";
import { queryClient } from "@/lib/queryClient";

/**
 * App-facing user shape, mapped from the Better Auth session user. Keeps the
 * field names the pre-migration UI was built around (avatarUrl ← image) so
 * Navbar/SaveToggle/useBookmarks and friends never had to change.
 */
export type AuthUser = {
  id: string;
  email: string;
  emailVerified: boolean;
  /** Display handle set during onboarding. Null until then. */
  username: string | null;
  firstName: string | null;
  lastName: string | null;
  /** Data-URL avatar uploaded by the user, or the Google profile photo URL. */
  avatarUrl: string | null;
  /** False until the onboarding wizard's final step — gates the whole app. */
  onboardingComplete: boolean;
};

const toAuthUser = (raw: SessionUser): AuthUser => ({
  id: raw.id,
  email: raw.email,
  emailVerified: raw.emailVerified,
  username: raw.username ?? null,
  firstName: raw.firstName ?? null,
  lastName: raw.lastName ?? null,
  avatarUrl: raw.image ?? null,
  onboardingComplete: raw.onboardingComplete ?? false,
});

/**
 * Thin adapter over Better Auth's shared session store. All components read
 * auth state through this hook; sign-in flows call `authClient` directly
 * (Login page, Onboarding, Profile).
 */
export const useAuth = () => {
  const { data, isPending, refetch } = authClient.useSession();
  const raw = data?.user;

  const user = useMemo<AuthUser | null>(
    () => (raw ? toAuthUser(raw) : null),
    [raw],
  );

  const signOut = useCallback(async () => {
    await authClient.signOut();
    // Drop the previous user's cached lists so they don't leak to the next one.
    queryClient.clear();
  }, []);

  return { user, loading: isPending, signOut, refetchSession: refetch };
};
