import type { MediaType } from "@/lib/tmdb";

/**
 * Central factory for every query key. User-scoped keys include the Supabase
 * user id so a login or logout naturally swaps the cached data.
 */
export const queryKeys = {
  trending: (scope: "all" | "movie" | "tv") => ["trending", scope] as const,
  popular: (mediaType: MediaType, page: number) =>
    ["popular", mediaType, page] as const,
  search: (query: string, page: number) => ["search", query, page] as const,
  details: (mediaType: string | undefined, id: string | undefined) =>
    ["details", mediaType, id] as const,
  recommendations: (
    mediaType: string | undefined,
    id: number | string | undefined,
  ) => ["recommendations", mediaType, id] as const,
  imdbRating: (imdbId: string | null | undefined) =>
    ["imdbRating", imdbId] as const,
  episodes: (id: string | undefined, season: number) =>
    ["episodes", id, season] as const,
  favorites: (userId: string | undefined) => ["favorites", userId] as const,
  watchlist: (userId: string | undefined) => ["watchlist", userId] as const,
};
