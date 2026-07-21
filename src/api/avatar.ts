import { api } from "@/lib/api";

/**
 * The signed-in user's uploaded avatar (a small data URL), or null.
 *
 * Uploaded avatars live in the `avatarData` field, which the server marks
 * returned:false so session responses — and the cookieCache session cookie —
 * stay tiny. This endpoint is the only read path: useAuth fetches it once per
 * sign-in (react-query, staleTime Infinity) and avatar edits write through
 * the cache with setQueryData instead of refetching.
 */
export const fetchAvatar = async (): Promise<string | null> => {
  const { data } = await api.get<{ avatar: string | null }>("/avatar");
  return data.avatar ?? null;
};
