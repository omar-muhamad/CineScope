import axios from "axios";

export const TMDB_BASE_URL = "https://api.themoviedb.org/3";
export const TMDB_API_KEY = import.meta.env.VITE_APP_API_KEY as string;

export type MediaType = "movie" | "tv";

/**
 * Shared TMDB client. The v3 API key is attached to every request as a default
 * param; per-request calls add `session_id` when a user-scoped action is needed.
 * Data-fetching helpers built on top of this client live in `@/api/tmdb`.
 */
export const tmdb = axios.create({
  baseURL: TMDB_BASE_URL,
  params: { api_key: TMDB_API_KEY },
});
