import { api } from "@/lib/api";
import type { MediaType } from "@/lib/tmdb";
import type { SavedMeta } from "@/api/saved";
import type { MediaItem } from "@/types";

/**
 * Watch-history rows as the server returns them. Movies and show-level manual
 * marks use the (season 0, episode 0) sentinel; real TV episodes are 1-based.
 * The cache stores raw rows — pages/badges derive their shapes from them.
 * Unlike the saved lists, DELETE here uses query params on purpose, so no
 * vercel.json rewrite is involved.
 */
export type HistoryRow = {
  mediaId: number;
  mediaType: string;
  season: number;
  episode: number;
  title: string | null;
  posterPath: string | null;
  releaseDate: string | null;
  voteAverage: number | null;
  watchedAt: string; // ISO timestamp
};

export type RecordWatchVars = {
  mediaType: MediaType;
  mediaId: number;
  season?: number;
  episode?: number;
  /** Card metadata persisted so the history page renders without TMDB. */
  meta: SavedMeta;
};

/** Denormalize a row into the card-shaped MediaItem the UI already consumes. */
export const historyRowToMediaItem = (row: HistoryRow): MediaItem => ({
  id: row.mediaId,
  media_type: row.mediaType,
  poster_path: row.posterPath ?? undefined,
  vote_average: row.voteAverage ?? undefined,
  ...(row.mediaType === "movie"
    ? {
        title: row.title ?? undefined,
        release_date: row.releaseDate ?? undefined,
      }
    : {
        name: row.title ?? undefined,
        first_air_date: row.releaseDate ?? undefined,
      }),
});

/** The signed-in user's full watch history (most recently watched first). */
export const fetchHistory = async (): Promise<HistoryRow[]> => {
  const { data } = await api.get<{ items: HistoryRow[] }>("/history");
  return data.items;
};

/** Record a watch. Rewatching bumps watched_at server-side (upsert). */
export const recordWatch = async ({
  mediaType,
  mediaId,
  season = 0,
  episode = 0,
  meta,
}: RecordWatchVars): Promise<void> => {
  await api.post("/history", {
    mediaType,
    mediaId,
    season,
    episode,
    title: meta.title,
    posterPath: meta.poster_path,
    releaseDate: meta.release_date,
    voteAverage: meta.vote_average,
  });
};

/** Remove every history row for a title (all episodes for a TV show). */
export const removeHistoryFor = async (
  mediaType: MediaType,
  mediaId: number,
): Promise<void> => {
  await api.delete("/history", { params: { mediaType, mediaId } });
};

/** Remove a single episode row. */
export const removeHistoryEpisode = async (
  mediaType: MediaType,
  mediaId: number,
  season: number,
  episode: number,
): Promise<void> => {
  await api.delete("/history", {
    params: { mediaType, mediaId, season, episode },
  });
};

/** Clear the user's entire watch history. */
export const clearHistory = async (): Promise<void> => {
  await api.delete("/history", { params: { all: true } });
};
