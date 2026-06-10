import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  addSaved,
  fetchFavorites,
  fetchWatchlist,
  removeSaved,
  type ListType,
  type MediaType,
  type SavedMeta,
} from "@/api/saved";
import { queryKeys } from "@/lib/queryKeys";
import { useAuth } from "@/auth/useAuth";
import type { MediaItem } from "@/types";

/** The signed-in user's full favorites list. Disabled when logged out. */
export const useFavorites = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: queryKeys.favorites(user?.id),
    queryFn: fetchFavorites,
    enabled: Boolean(user),
  });
};

/** The signed-in user's full watch-later list. Disabled when logged out. */
export const useWatchlist = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: queryKeys.watchlist(user?.id),
    queryFn: fetchWatchlist,
    enabled: Boolean(user),
  });
};

/**
 * Whether a single title is in the user's favorites / watch-later, derived from
 * the already-fetched list (no per-title network call). Both lists are fetched
 * once and shared via the query cache, so this is cheap for every card. Matches
 * on id AND media_type — movie 123 and tv 123 are distinct titles.
 */
export const useSavedState = (
  kind: ListType,
  mediaType: MediaType,
  id: number,
) => {
  const favorites = useFavorites();
  const watchlist = useWatchlist();
  const list = kind === "favorite" ? favorites : watchlist;
  const active = (list.data ?? []).some(
    (item) => item.id === id && item.media_type === mediaType,
  );
  return { active, isLoading: list.isLoading };
};

export type ToggleVars = {
  mediaType: MediaType;
  id: number;
  next: boolean;
  /** Card metadata persisted on add so saved pages render without TMDB. */
  meta: SavedMeta;
};

type ToggleContext = {
  listKey: readonly unknown[];
  previousList: MediaItem[] | undefined;
};

/** Build the MediaItem we optimistically insert, matching rowToMediaItem. */
const buildItem = (
  mediaType: MediaType,
  id: number,
  meta: SavedMeta,
): MediaItem => ({
  id,
  media_type: mediaType,
  poster_path: meta.poster_path,
  vote_average: meta.vote_average,
  ...(mediaType === "movie"
    ? { title: meta.title, release_date: meta.release_date }
    : { name: meta.title, first_air_date: meta.release_date }),
});

/**
 * Shared toggle factory for favorite / watch-later. Writes to Supabase and
 * optimistically updates the cached list: on add it prepends the item (so the
 * derived state flips instantly and it shows up on the list page); on remove it
 * drops the matching item. Rolls back on error, and on settle invalidates the
 * list to reconcile with the server.
 */
const useToggle = (kind: ListType) => {
  const { user } = useAuth();
  const qc = useQueryClient();

  const listKey = () =>
    kind === "favorite"
      ? queryKeys.favorites(user?.id)
      : queryKeys.watchlist(user?.id);

  return useMutation<unknown, Error, ToggleVars, ToggleContext>({
    mutationFn: ({ mediaType, id, next, meta }) =>
      next
        ? addSaved(kind, mediaType, id, meta)
        : removeSaved(kind, mediaType, id),
    onMutate: async ({ mediaType, id, next, meta }) => {
      const key = listKey();
      await qc.cancelQueries({ queryKey: key });

      const previousList = qc.getQueryData<MediaItem[]>(key);
      if (previousList) {
        const without = previousList.filter(
          (item) => !(item.id === id && item.media_type === mediaType),
        );
        qc.setQueryData<MediaItem[]>(
          key,
          next ? [buildItem(mediaType, id, meta), ...without] : without,
        );
      }

      return { listKey: key, previousList };
    },
    onError: (_err, _vars, context) => {
      if (!context) return;
      qc.setQueryData(context.listKey, context.previousList);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: listKey() });
    },
  });
};

export const useToggleFavorite = () => useToggle("favorite");
export const useToggleWatchlist = () => useToggle("watchlist");
