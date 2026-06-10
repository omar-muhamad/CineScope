import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  fetchFavorites,
  fetchWatchlist,
  getAccountStates,
  setFavorite,
  setWatchlist,
  type AccountStates,
  type MediaType,
} from "@/api/tmdb";
import { queryKeys } from "@/lib/queryKeys";
import { useAuth } from "@/auth/useAuth";
import type { MediaItem } from "@/types";

/** The signed-in user's full favorites list. Disabled without a TMDB account. */
export const useFavorites = () => {
  const { tmdb } = useAuth();
  return useQuery({
    queryKey: queryKeys.favorites(tmdb?.account_id),
    queryFn: () => fetchFavorites(tmdb!.account_id, tmdb!.session_id),
    enabled: Boolean(tmdb),
  });
};

/** The signed-in user's full watch-later list. Disabled without a TMDB account. */
export const useWatchlist = () => {
  const { tmdb } = useAuth();
  return useQuery({
    queryKey: queryKeys.watchlist(tmdb?.account_id),
    queryFn: () => fetchWatchlist(tmdb!.account_id, tmdb!.session_id),
    enabled: Boolean(tmdb),
  });
};

/**
 * Whether a single title is favorited / watchlisted by the signed-in user.
 * Both SaveToggles on a card share this key, so it's fetched once per title.
 */
export const useAccountStates = (mediaType: MediaType, id: number) => {
  const { tmdb } = useAuth();
  return useQuery({
    queryKey: queryKeys.accountStates(mediaType, id, tmdb?.session_id),
    queryFn: () => getAccountStates(mediaType, id, tmdb!.session_id),
    enabled: Boolean(tmdb),
  });
};

export type ToggleVars = { mediaType: MediaType; id: number; next: boolean };

type ToggleContext = {
  statesKey: ReturnType<typeof queryKeys.accountStates>;
  previous: AccountStates | undefined;
  listKey: readonly unknown[];
  previousList: MediaItem[] | undefined;
};

/**
 * Shared toggle factory for favorite / watch-later. Optimistically flips the
 * cached account-states for the title (so the icon updates instantly) and, when
 * removing, drops the item from the cached list page immediately (matching the
 * old slice's local filter, so an unfavorited title doesn't briefly reappear if
 * TMDB's list endpoint lags). Rolls both back on error, and on settle
 * invalidates BOTH the per-title account-states AND the list to reconcile with
 * the server.
 */
const useToggle = (kind: "favorite" | "watchlist") => {
  const { tmdb } = useAuth();
  const qc = useQueryClient();

  const write = kind === "favorite" ? setFavorite : setWatchlist;
  const listKey = () =>
    kind === "favorite"
      ? queryKeys.favorites(tmdb?.account_id)
      : queryKeys.watchlist(tmdb?.account_id);

  return useMutation<unknown, Error, ToggleVars, ToggleContext>({
    mutationFn: ({ mediaType, id, next }) =>
      write(tmdb!.account_id, tmdb!.session_id, mediaType, id, next),
    onMutate: async ({ mediaType, id, next }) => {
      const statesKey = queryKeys.accountStates(
        mediaType,
        id,
        tmdb?.session_id,
      );
      const key = listKey();
      await Promise.all([
        qc.cancelQueries({ queryKey: statesKey }),
        qc.cancelQueries({ queryKey: key }),
      ]);

      const previous = qc.getQueryData<AccountStates>(statesKey);
      const optimistic: AccountStates = {
        favorite: kind === "favorite" ? next : (previous?.favorite ?? false),
        watchlist: kind === "watchlist" ? next : (previous?.watchlist ?? false),
      };
      qc.setQueryData<AccountStates>(statesKey, optimistic);

      // When removing, drop it from the cached list right away.
      const previousList = qc.getQueryData<MediaItem[]>(key);
      if (!next && previousList) {
        qc.setQueryData<MediaItem[]>(
          key,
          previousList.filter((item) => item.id !== id),
        );
      }

      return { statesKey, previous, listKey: key, previousList };
    },
    onError: (_err, _vars, context) => {
      if (!context) return;
      qc.setQueryData(context.statesKey, context.previous);
      qc.setQueryData(context.listKey, context.previousList);
    },
    onSettled: (_data, _err, { mediaType, id }) => {
      qc.invalidateQueries({
        queryKey: queryKeys.accountStates(mediaType, id, tmdb?.session_id),
      });
      qc.invalidateQueries({ queryKey: listKey() });
    },
  });
};

export const useToggleFavorite = () => useToggle("favorite");
export const useToggleWatchlist = () => useToggle("watchlist");
