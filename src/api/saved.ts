import { api } from "@/lib/api";
import type { MediaType } from "@/lib/tmdb";
import type { MediaItem } from "@/types";

export type { MediaType };

export type ListType = "favorite" | "watchlist";

/**
 * Card metadata captured at save time so the favorites / watch-later pages can
 * render without re-hitting TMDB. A single normalized `title` / `release_date`
 * is denormalized back into the `MediaItem` shape on read (see rowToMediaItem).
 */
export type SavedMeta = {
  title?: string;
  poster_path?: string;
  release_date?: string;
  vote_average?: number;
};

type SavedRow = {
  mediaId: number;
  mediaType: string;
  title: string | null;
  posterPath: string | null;
  releaseDate: string | null;
  voteAverage: number | null;
};

/** Denormalize a row into the card-shaped MediaItem the UI already consumes. */
const rowToMediaItem = (row: SavedRow): MediaItem => ({
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

const fetchList = async (listType: ListType): Promise<MediaItem[]> => {
  const { data } = await api.get<{ items: SavedRow[] }>("/saved", {
    params: { list: listType },
  });
  return data.items.map(rowToMediaItem);
};

/** The signed-in user's full favorites list (newest first). */
export const fetchFavorites = () => fetchList("favorite");

/** The signed-in user's full watch-later list (newest first). */
export const fetchWatchlist = () => fetchList("watchlist");

/** Add a title to a list. The server scopes the row to the current user. */
export const addSaved = async (
  listType: ListType,
  mediaType: MediaType,
  mediaId: number,
  meta: SavedMeta,
): Promise<void> => {
  await api.post("/saved", {
    listType,
    mediaType,
    mediaId,
    title: meta.title,
    posterPath: meta.poster_path,
    releaseDate: meta.release_date,
    voteAverage: meta.vote_average,
  });
};

/** Remove a title from a list. The server scopes the delete to the user. */
export const removeSaved = async (
  listType: ListType,
  mediaType: MediaType,
  mediaId: number,
): Promise<void> => {
  await api.delete(`/saved/${listType}/${mediaType}/${mediaId}`);
};
