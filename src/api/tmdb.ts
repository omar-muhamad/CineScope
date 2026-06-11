import { tmdb, type MediaType } from "@/lib/tmdb";
import type { DetailsData, Episode, MediaSummary, Paginated } from "@/types";

export type { MediaType };

/* -------------------------------------------------------------------------- */
/* Catalog reads (public — favorites / watch-later live in Supabase now)      */
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

/** Browse categories backed by a paginated TMDB list endpoint. */
export type MovieCategory =
  | "trending"
  | "now_playing"
  | "upcoming"
  | "top_rated";
export type TvCategory = "trending" | "on_the_air" | "top_rated";
export type MediaCategory = MovieCategory | TvCategory;

/**
 * A page of a browse category (trending / now playing / upcoming / top rated /
 * on the air). `trending` hits `/trending/{mediaType}/week`; every other
 * category maps straight to `/{mediaType}/{category}`. All return the same
 * paginated shape as the other list endpoints.
 */
export const fetchMediaList = async (
  mediaType: MediaType,
  category: MediaCategory,
  page: number,
): Promise<Paginated<MediaSummary>> => {
  const path =
    category === "trending"
      ? `/trending/${mediaType}/week`
      : `/${mediaType}/${category}`;
  const { data } = await tmdb.get(path, {
    params: { page, language: "en-US" },
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

/** Full details for a title, with videos / certifications / external ids / cast. */
export const fetchDetails = async (
  mediaType: string | undefined,
  id: string | undefined,
): Promise<DetailsData> => {
  const { data } = await tmdb.get(`/${mediaType}/${id}`, {
    params: {
      append_to_response:
        mediaType === "tv"
          ? "content_ratings,videos,external_ids,credits"
          : "release_dates,videos,external_ids,credits",
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

/**
 * Similar titles for a given title (TMDB matches on genres and keywords).
 * Results are always the same media type as the source, so they omit the
 * `media_type` field — callers should treat them as `mediaType`.
 */
export const fetchSimilar = async (
  mediaType: string | undefined,
  id: number | string | undefined,
): Promise<MediaSummary[]> => {
  const { data } = await tmdb.get(`/${mediaType}/${id}/similar`);
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
