import axios from "axios";

export const TMDB_BASE_URL = "https://api.themoviedb.org/3";

export type MediaType = "movie" | "tv";

/**
 * Shared TMDB client. Authenticates with a v4 API Read Access Token sent as a
 * Bearer header (the v3 `?api_key=` query param is no longer used). Only public
 * catalog endpoints are called now — favorites / watch-later live in our own
 * Supabase database, not on a TMDB account. Data-fetching helpers built on top
 * of this client live in `@/api/tmdb`.
 */
export const tmdb = axios.create({
  baseURL: TMDB_BASE_URL,
  headers: {
    Authorization: `Bearer ${import.meta.env.VITE_TMDB_READ_TOKEN as string}`,
  },
});
