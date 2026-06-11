import { supabase } from "@/lib/supabase";
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
  media_id: number;
  media_type: string;
  title: string | null;
  poster_path: string | null;
  release_date: string | null;
  vote_average: number | null;
};

const TABLE = "saved_items";
const COLUMNS =
  "media_id, media_type, title, poster_path, release_date, vote_average";

/** Denormalize a row into the card-shaped MediaItem the UI already consumes. */
const rowToMediaItem = (row: SavedRow): MediaItem => ({
  id: row.media_id,
  media_type: row.media_type,
  poster_path: row.poster_path ?? undefined,
  vote_average: row.vote_average ?? undefined,
  ...(row.media_type === "movie"
    ? {
        title: row.title ?? undefined,
        release_date: row.release_date ?? undefined,
      }
    : {
        name: row.title ?? undefined,
        first_air_date: row.release_date ?? undefined,
      }),
});

const fetchList = async (listType: ListType): Promise<MediaItem[]> => {
  const { data, error } = await supabase
    .from(TABLE)
    .select(COLUMNS)
    .eq("list_type", listType)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return ((data as SavedRow[]) ?? []).map(rowToMediaItem);
};

/** The signed-in user's full favorites list (newest first). */
export const fetchFavorites = () => fetchList("favorite");

/** The signed-in user's full watch-later list (newest first). */
export const fetchWatchlist = () => fetchList("watchlist");

/**
 * Add a title to a list. `user_id` is intentionally omitted — the column
 * defaults to `auth.uid()`, which is exactly what the RLS insert check expects.
 */
export const addSaved = async (
  listType: ListType,
  mediaType: MediaType,
  mediaId: number,
  meta: SavedMeta,
): Promise<void> => {
  const { error } = await supabase.from(TABLE).insert({
    list_type: listType,
    media_type: mediaType,
    media_id: mediaId,
    title: meta.title ?? null,
    poster_path: meta.poster_path ?? null,
    release_date: meta.release_date ?? null,
    vote_average: meta.vote_average ?? null,
  });
  if (error) throw error;
};

/** Remove a title from a list. RLS scopes the delete to the current user. */
export const removeSaved = async (
  listType: ListType,
  mediaType: MediaType,
  mediaId: number,
): Promise<void> => {
  const { error } = await supabase
    .from(TABLE)
    .delete()
    .eq("list_type", listType)
    .eq("media_type", mediaType)
    .eq("media_id", mediaId);
  if (error) throw error;
};
