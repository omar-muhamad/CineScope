import { useCallback, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import { fetchAvatar } from "@/api/avatar";
import { authClient, type SessionUser } from "@/lib/auth-client";
import { queryClient } from "@/lib/queryClient";
import { queryKeys } from "@/lib/queryKeys";

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

const toAuthUser = (
  raw: SessionUser,
  uploadedAvatar: string | null,
): AuthUser => ({
  id: raw.id,
  email: raw.email,
  emailVerified: raw.emailVerified,
  username: raw.username ?? null,
  firstName: raw.firstName ?? null,
  lastName: raw.lastName ?? null,
  // An uploaded avatar wins over the provider photo left in `image`.
  avatarUrl: uploadedAvatar ?? raw.image ?? null,
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

  // Uploaded avatars are split out of the session payload (avatarData,
  // returned:false) so the cookieCache cookie stays small — fetch once per
  // sign-in and keep it until logout; avatar edits write through with
  // setQueryData (Profile, onboarding AvatarStep) rather than refetching.
  const { data: uploadedAvatar } = useQuery({
    queryKey: queryKeys.avatar(raw?.id),
    queryFn: fetchAvatar,
    enabled: !!raw,
    staleTime: Infinity,
  });

  const user = useMemo<AuthUser | null>(
    () => (raw ? toAuthUser(raw, uploadedAvatar ?? null) : null),
    [raw, uploadedAvatar],
  );

  const signOut = useCallback(async () => {
    await authClient.signOut();
    // Drop the previous user's cached lists so they don't leak to the next one.
    queryClient.clear();
  }, []);

  return { user, loading: isPending, signOut, refetchSession: refetch };
};
