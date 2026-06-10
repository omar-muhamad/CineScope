import { tmdb, type MediaType } from "@/lib/tmdb";
import type {
  DetailsData,
  Episode,
  MediaItem,
  MediaSummary,
  Paginated,
} from "@/types";

export type { MediaType };

export type AccountStates = {
  favorite: boolean;
  watchlist: boolean;
};

/* -------------------------------------------------------------------------- */
/* Catalog reads (no auth required)                                           */
/* -------------------------------------------------------------------------- */

/** Trending titles this week — `all` (mixed), `movie`, or `tv`. */
export const fetchTrending = async (
  scope: "all" | "movie" | "tv",
): Promise<MediaSummary[]> => {
  const { data } = await tmdb.get(`/trending/${scope}/week`, {
    params: { language: "en-US" },
  });
  return data.results;
};

/** A page of popular movies or TV shows. */
export const fetchPopular = async (
  mediaType: MediaType,
  page: number,
): Promise<Paginated<MediaSummary>> => {
  const { data } = await tmdb.get(`/${mediaType}/popular`, {
    params: { page },
  });
  const { page: resultPage, results, total_pages } = data;
  return { page: resultPage, results, total_pages };
};

/** Multi-type search (movies, TV, people) — caller filters out people. */
export const searchMulti = async (
  query: string,
  page: number,
): Promise<Paginated<MediaSummary>> => {
  const { data } = await tmdb.get("/search/multi", { params: { query, page } });
  const { page: resultPage, results, total_pages } = data;
  return { page: resultPage, results, total_pages };
};

/** Full details for a title, with videos / certifications / external ids. */
export const fetchDetails = async (
  mediaType: string | undefined,
  id: string | undefined,
): Promise<DetailsData> => {
  const { data } = await tmdb.get(`/${mediaType}/${id}`, {
    params: {
      append_to_response:
        mediaType === "tv"
          ? "content_ratings,videos,external_ids"
          : "release_dates,videos,external_ids",
    },
  });
  return data;
};

/** Recommendations for a given title. */
export const fetchRecommendations = async (
  mediaType: string | undefined,
  id: number | string | undefined,
): Promise<MediaSummary[]> => {
  const { data } = await tmdb.get(`/${mediaType}/${id}/recommendations`);
  return data.results;
};

/** Episodes for a single season of a TV show. */
export const fetchSeasonEpisodes = async (
  id: string | undefined,
  seasonNumber: number,
): Promise<Episode[]> => {
  const { data } = await tmdb.get(`/tv/${id}/season/${seasonNumber}`);
  return data.episodes;
};

/* -------------------------------------------------------------------------- */
/* Account reads/writes (require a TMDB session)                              */
/* -------------------------------------------------------------------------- */

/**
 * Whether the signed-in TMDB user has favorited / watchlisted a given title.
 * (No manual request dedup needed — TanStack Query dedupes by query key.)
 */
export const getAccountStates = async (
  mediaType: MediaType,
  id: number,
  sessionId: string,
): Promise<AccountStates> => {
  const { data } = await tmdb.get(`/${mediaType}/${id}/account_states`, {
    params: { session_id: sessionId },
  });
  return {
    favorite: Boolean(data.favorite),
    watchlist: Boolean(data.watchlist),
  };
};

export const setFavorite = async (
  accountId: number,
  sessionId: string,
  mediaType: MediaType,
  mediaId: number,
  favorite: boolean,
) => {
  const { data } = await tmdb.post(
    `/account/${accountId}/favorite`,
    { media_type: mediaType, media_id: mediaId, favorite },
    { params: { session_id: sessionId } },
  );
  return data;
};

export const setWatchlist = async (
  accountId: number,
  sessionId: string,
  mediaType: MediaType,
  mediaId: number,
  watchlist: boolean,
) => {
  const { data } = await tmdb.post(
    `/account/${accountId}/watchlist`,
    { media_type: mediaType, media_id: mediaId, watchlist },
    { params: { session_id: sessionId } },
  );
  return data;
};

/**
 * The favorite/watchlist list endpoints are split by media type and do not
 * include a `media_type` field, so we tag each result for downstream filtering.
 */
const tagMediaType = (results: unknown[], mediaType: MediaType): MediaItem[] =>
  (results ?? []).map((item) => ({
    ...(item as object),
    media_type: mediaType,
  })) as MediaItem[];

/**
 * Fetch every page of a paginated TMDB account list (each page holds 20 items).
 * Page 1 is fetched first to learn `total_pages`, then the rest in parallel, so
 * the full list is available for client-side filtering and pagination.
 */
const fetchAllPages = async (path: string, sessionId: string) => {
  const params = { session_id: sessionId, sort_by: "created_at.desc", page: 1 };
  const first = await tmdb.get(path, { params });

  const totalPages: number = first.data.total_pages ?? 1;
  let results: unknown[] = first.data.results ?? [];

  if (totalPages > 1) {
    const rest = await Promise.all(
      Array.from({ length: totalPages - 1 }, (_, i) =>
        tmdb.get(path, { params: { ...params, page: i + 2 } }),
      ),
    );
    results = rest.reduce<unknown[]>(
      (acc, res) => acc.concat(res.data.results ?? []),
      results,
    );
  }
  return results;
};

const fetchAccountList = async (
  kind: "favorite" | "watchlist",
  accountId: number,
  sessionId: string,
): Promise<MediaItem[]> => {
  const [movies, tv] = await Promise.all([
    fetchAllPages(`/account/${accountId}/${kind}/movies`, sessionId),
    fetchAllPages(`/account/${accountId}/${kind}/tv`, sessionId),
  ]);
  return [...tagMediaType(movies, "movie"), ...tagMediaType(tv, "tv")];
};

export const fetchFavorites = (accountId: number, sessionId: string) =>
  fetchAccountList("favorite", accountId, sessionId);

export const fetchWatchlist = (accountId: number, sessionId: string) =>
  fetchAccountList("watchlist", accountId, sessionId);
