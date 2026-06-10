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
};

/**
 * Shared toggle factory for favorite / watch-later. Optimistically flips the
 * cached account-states for the title (so the icon updates instantly), rolls
 * back on error, and on settle invalidates BOTH the per-title account-states
 * AND the relevant full list so the list pages stay in sync.
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
      await qc.cancelQueries({ queryKey: statesKey });
      const previous = qc.getQueryData<AccountStates>(statesKey);
      const optimistic: AccountStates = {
        favorite: kind === "favorite" ? next : (previous?.favorite ?? false),
        watchlist: kind === "watchlist" ? next : (previous?.watchlist ?? false),
      };
      qc.setQueryData<AccountStates>(statesKey, optimistic);
      return { statesKey, previous };
    },
    onError: (_err, _vars, context) => {
      if (context) qc.setQueryData(context.statesKey, context.previous);
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
