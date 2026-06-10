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

/**
 * Whether the signed-in TMDB user has favorited / watchlisted a given title.
 * Replaces the old shared-list `item_status` check.
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
const tagMediaType = (results: unknown[], mediaType: MediaType) =>
  (results ?? []).map((item) => ({
    ...(item as object),
    media_type: mediaType,
  }));

const fetchAccountList = async (
  kind: "favorite" | "watchlist",
  accountId: number,
  sessionId: string,
) => {
  const [movies, tv] = await Promise.all([
    tmdb.get(`/account/${accountId}/${kind}/movies`, {
      params: { session_id: sessionId, sort_by: "created_at.desc" },
    }),
    tmdb.get(`/account/${accountId}/${kind}/tv`, {
      params: { session_id: sessionId, sort_by: "created_at.desc" },
    }),
  ]);
  return [
    ...tagMediaType(movies.data.results, "movie"),
    ...tagMediaType(tv.data.results, "tv"),
  ];
};

export const fetchFavorites = (accountId: number, sessionId: string) =>
  fetchAccountList("favorite", accountId, sessionId);

export const fetchWatchlist = (accountId: number, sessionId: string) =>
  fetchAccountList("watchlist", accountId, sessionId);
