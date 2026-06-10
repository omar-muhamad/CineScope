import axios from "axios";

export const TMDB_BASE_URL = "https://api.themoviedb.org/3";
export const TMDB_API_KEY = import.meta.env.VITE_APP_API_KEY as string;

export type MediaType = "movie" | "tv";

/**
 * Shared TMDB client. The v3 API key is attached to every request as a default
 * param; per-request calls add `session_id` when a user-scoped action is needed.
 */
export const tmdb = axios.create({
  baseURL: TMDB_BASE_URL,
  params: { api_key: TMDB_API_KEY },
});

export type AccountStates = {
  favorite: boolean;
  watchlist: boolean;
};

// Dedupe concurrent identical lookups so the favorite + watchlist toggles on a
// single card share one request (account_states returns both flags at once).
// Entries are cleared once settled, so reads after a navigation are always fresh.
const inFlightStates = new Map<string, Promise<AccountStates>>();

/**
 * Whether the signed-in TMDB user has favorited / watchlisted a given title.
 * Replaces the old shared-list `item_status` check.
 */
export const getAccountStates = (
  mediaType: MediaType,
  id: number,
  sessionId: string,
): Promise<AccountStates> => {
  const key = `${mediaType}:${id}:${sessionId}`;
  const pending = inFlightStates.get(key);
  if (pending) return pending;

  const request = tmdb
    .get(`/${mediaType}/${id}/account_states`, {
      params: { session_id: sessionId },
    })
    .then((res) => ({
      favorite: Boolean(res.data.favorite),
      watchlist: Boolean(res.data.watchlist),
    }))
    .finally(() => inFlightStates.delete(key));

  inFlightStates.set(key, request);
  return request;
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
const tagMediaType = (results: unknown[], mediaType: MediaType) =>
  (results ?? []).map((item) => ({
    ...(item as object),
    media_type: mediaType,
  }));

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
) => {
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
