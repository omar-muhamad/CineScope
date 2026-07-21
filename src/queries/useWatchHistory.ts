import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  clearHistory,
  fetchHistory,
  historyRowToMediaItem,
  recordWatch,
  removeHistoryEpisode,
  removeHistoryFor,
  type HistoryRow,
  type RecordWatchVars,
} from "@/api/history";
import type { MediaType } from "@/lib/tmdb";
import { queryKeys } from "@/lib/queryKeys";
import { useAuth } from "@/auth/useAuth";
import type { MediaItem } from "@/types";

/**
 * The signed-in user's full watch history as raw rows, newest watch first.
 * Fetched once and shared via the query cache — badges, the episode list and
 * the history page all derive from it. Disabled when logged out.
 */
export const useWatchHistory = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: queryKeys.history(user?.id),
    queryFn: fetchHistory,
    enabled: Boolean(user),
  });
};

// Module-level so the select identity is stable and react-query memoizes the
// derived Set per observer (one O(n) pass per data change, not per render).
const toWatchedSet = (rows: HistoryRow[]) =>
  new Set(rows.map((row) => `${row.mediaType}:${row.mediaId}`));

/**
 * Whether a title has any watch history (for a TV show: any episode, or a
 * show-level manual mark). Derived from the cached history — no per-card
 * network call, same idea as useSavedState.
 */
export const useIsWatched = (mediaType: string, id: number) => {
  const { user } = useAuth();
  const { data } = useQuery({
    queryKey: queryKeys.history(user?.id),
    queryFn: fetchHistory,
    enabled: Boolean(user),
    select: toWatchedSet,
  });
  return data?.has(`${mediaType}:${id}`) ?? false;
};

/**
 * The watched episodes of one show as a Set of "season:episode" keys,
 * excluding the (0,0) show-level sentinel. Computed once by the watch page
 * and passed down, so episode rows do a plain Set lookup.
 */
export const useWatchedEpisodes = (showId: number) => {
  const history = useWatchHistory();
  return useMemo(() => {
    const set = new Set<string>();
    for (const row of history.data ?? []) {
      if (row.mediaType === "tv" && row.mediaId === showId && row.season > 0) {
        set.add(`${row.season}:${row.episode}`);
      }
    }
    return set;
  }, [history.data, showId]);
};

/**
 * The most recently watched episode of one show (rows are newest-first),
 * excluding the (0,0) show-level sentinel. The watch page resumes bare
 * /watch/tv/:id URLs here; isLoading lets it hold that redirect until the
 * history fetch settles (false when logged out — the query never runs).
 */
export const useLastWatchedEpisode = (showId: number) => {
  const history = useWatchHistory();
  const lastWatched = useMemo(() => {
    const row = (history.data ?? []).find(
      (r) => r.mediaType === "tv" && r.mediaId === showId && r.season > 0,
    );
    return row ? { season: row.season, episode: row.episode } : undefined;
  }, [history.data, showId]);
  return { lastWatched, isLoading: history.isLoading };
};

/**
 * History rows deduped to one card per title (rows are newest-first, so the
 * first occurrence carries the latest watched_at), in MediaItem shape for the
 * shared grid page.
 */
export const useHistoryItems = () => {
  const history = useWatchHistory();
  const items = useMemo(() => {
    const seen = new Set<string>();
    const result: MediaItem[] = [];
    for (const row of history.data ?? []) {
      const key = `${row.mediaType}:${row.mediaId}`;
      if (seen.has(key)) continue;
      seen.add(key);
      result.push(historyRowToMediaItem(row));
    }
    return result;
  }, [history.data]);
  return { items, isLoading: history.isLoading };
};

export type ContinueWatchingEntry = {
  item: MediaItem;
  /** Season/episode of the newest row — (0,0) for movies and show-level marks. */
  season: number;
  episode: number;
};

/**
 * The newest few titles from history with their latest season/episode, for
 * the home page's continue-watching row. Cards link to bare /watch URLs and
 * lean on the useLastWatchedEpisode resume redirect, so the (0,0) sentinel
 * needs no special handling here beyond hiding the episode label.
 */
export const useContinueWatching = (limit = 5) => {
  const history = useWatchHistory();
  const entries = useMemo(() => {
    const seen = new Set<string>();
    const result: ContinueWatchingEntry[] = [];
    for (const row of history.data ?? []) {
      const key = `${row.mediaType}:${row.mediaId}`;
      if (seen.has(key)) continue;
      seen.add(key);
      result.push({
        item: historyRowToMediaItem(row),
        season: row.season,
        episode: row.episode,
      });
      if (result.length >= limit) break;
    }
    return result;
  }, [history.data, limit]);
  return { entries, isLoading: history.isLoading };
};

type HistoryContext = {
  key: readonly unknown[];
  previous: HistoryRow[] | undefined;
};

/**
 * Shared mutation factory: writes to the app API and optimistically patches
 * the cached raw rows (badges and pages re-derive instantly). Rolls back on
 * error, invalidates on settle to reconcile with the server — the same
 * protocol as useBookmarks' useToggle.
 */
const useHistoryMutation = <TVars>(
  mutationFn: (vars: TVars) => Promise<void>,
  patch: (rows: HistoryRow[], vars: TVars) => HistoryRow[],
) => {
  const { user } = useAuth();
  const qc = useQueryClient();

  return useMutation<unknown, Error, TVars, HistoryContext>({
    mutationFn,
    onMutate: async (vars) => {
      const key = queryKeys.history(user?.id);
      await qc.cancelQueries({ queryKey: key });

      const previous = qc.getQueryData<HistoryRow[]>(key);
      if (previous) {
        qc.setQueryData<HistoryRow[]>(key, patch(previous, vars));
      }

      return { key, previous };
    },
    onError: (_err, _vars, context) => {
      if (!context) return;
      qc.setQueryData(context.key, context.previous);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: queryKeys.history(user?.id) });
    },
  });
};

const sameRow = (
  row: HistoryRow,
  mediaType: string,
  mediaId: number,
  season: number,
  episode: number,
) =>
  row.mediaType === mediaType &&
  row.mediaId === mediaId &&
  row.season === season &&
  row.episode === episode;

/** Record a watch: optimistic move-to-top upsert, mirroring the server. */
export const useRecordWatch = () =>
  useHistoryMutation<RecordWatchVars>(recordWatch, (rows, vars) => {
    const { mediaType, mediaId, season = 0, episode = 0, meta } = vars;
    const without = rows.filter(
      (row) => !sameRow(row, mediaType, mediaId, season, episode),
    );
    return [
      {
        mediaId,
        mediaType,
        season,
        episode,
        title: meta.title ?? null,
        posterPath: meta.poster_path ?? null,
        releaseDate: meta.release_date ?? null,
        voteAverage: meta.vote_average ?? null,
        watchedAt: new Date().toISOString(),
      },
      ...without,
    ];
  });

/** Remove every row for a title (a TV show's episodes included). */
export const useRemoveFromHistory = () =>
  useHistoryMutation<{ mediaType: MediaType; mediaId: number }>(
    ({ mediaType, mediaId }) => removeHistoryFor(mediaType, mediaId),
    (rows, { mediaType, mediaId }) =>
      rows.filter(
        (row) => !(row.mediaType === mediaType && row.mediaId === mediaId),
      ),
  );

/** Remove a single episode row. */
export const useRemoveEpisodeFromHistory = () =>
  useHistoryMutation<{
    mediaType: MediaType;
    mediaId: number;
    season: number;
    episode: number;
  }>(
    ({ mediaType, mediaId, season, episode }) =>
      removeHistoryEpisode(mediaType, mediaId, season, episode),
    (rows, { mediaType, mediaId, season, episode }) =>
      rows.filter((row) => !sameRow(row, mediaType, mediaId, season, episode)),
  );

/** Clear the entire history. */
export const useClearHistory = () =>
  useHistoryMutation<void>(
    () => clearHistory(),
    () => [],
  );
