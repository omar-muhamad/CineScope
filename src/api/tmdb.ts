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

/** Browse categories backed by a paginated TMDB list endpoint. */
export type MovieCategory =
  | "popular"
  | "trending"
  | "now_playing"
  | "upcoming"
  | "top_rated";
export type TvCategory = "popular" | "trending" | "on_the_air" | "top_rated";
export type MediaCategory = MovieCategory | TvCategory;

/**
 * A page of a browse category (popular / trending / now playing / upcoming /
 * top rated / on the air). `trending` hits `/trending/{mediaType}/week`; every
 * other category maps straight to `/{mediaType}/{category}`. All return the
 * same paginated shape as the other list endpoints.
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

/** User-selected sort key — field plus direction. */
export type MediaSort = "year.asc" | "year.desc" | "rating.asc" | "rating.desc";

export const MEDIA_SORTS: readonly MediaSort[] = [
  "year.asc",
  "year.desc",
  "rating.asc",
  "rating.desc",
];

/** Browse filters applied on top of a category via the discover endpoint. */
export type DiscoverFilters = {
  /** Release year (movies) / first-air year (TV). */
  year?: number;
  /** Minimum vote average, inclusive. */
  minRating?: number;
  /** TMDB genre id. */
  genreId?: number;
  /** Sort override; unset keeps the category's own order. */
  sort?: MediaSort;
};

export const hasDiscoverFilters = (filters: DiscoverFilters): boolean =>
  filters.year !== undefined ||
  filters.minRating !== undefined ||
  filters.genreId !== undefined ||
  filters.sort !== undefined;

/** A user sort mapped onto discover's `sort_by` — the year field differs per type. */
const discoverSortBy = (sort: MediaSort, mediaType: MediaType): string => {
  const [field, direction] = sort.split(".");
  if (field === "rating") return `vote_average.${direction}`;
  return mediaType === "movie"
    ? `primary_release_date.${direction}`
    : `first_air_date.${direction}`;
};

const isoDate = (date: Date): string => date.toISOString().slice(0, 10);

const daysFromNow = (days: number): Date => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
};

/**
 * Discover has no notion of now-playing / upcoming / on-the-air, so filtered
 * browsing re-creates each category's date window (approximating TMDB's own
 * definitions) — otherwise "Upcoming Movies" filtered by genre would happily
 * show the all-time catalog.
 */
const categoryDateWindow = (
  mediaType: MediaType,
  category: MediaCategory,
): Record<string, string> => {
  if (mediaType === "movie" && category === "now_playing") {
    return {
      "primary_release_date.gte": isoDate(daysFromNow(-35)),
      "primary_release_date.lte": isoDate(daysFromNow(0)),
    };
  }
  if (mediaType === "movie" && category === "upcoming") {
    return {
      "primary_release_date.gte": isoDate(daysFromNow(1)),
      "primary_release_date.lte": isoDate(daysFromNow(35)),
    };
  }
  if (mediaType === "tv" && category === "on_the_air") {
    return {
      "air_date.gte": isoDate(daysFromNow(0)),
      "air_date.lte": isoDate(daysFromNow(7)),
    };
  }
  return {};
};

/**
 * A filtered/sorted page of titles. The category list endpoints don't accept
 * filters, so filtered browsing goes through `/discover/{mediaType}` instead —
 * the category only picks the default sort order (discover has no notion of
 * trending or now-playing), and a user sort overrides it. Anything ordered by
 * vote average gets a vote floor so obscure titles don't dominate either end;
 * everything else defaults to popularity.
 */
export const fetchDiscover = async (
  mediaType: MediaType,
  category: MediaCategory,
  filters: DiscoverFilters,
  page: number,
): Promise<Paginated<MediaSummary>> => {
  const topRated = category === "top_rated";
  const ratingSorted = topRated || filters.sort?.startsWith("rating");
  const { data } = await tmdb.get(`/discover/${mediaType}`, {
    params: {
      page,
      language: "en-US",
      sort_by: filters.sort
        ? discoverSortBy(filters.sort, mediaType)
        : topRated
          ? "vote_average.desc"
          : "popularity.desc",
      ...(ratingSorted && { "vote_count.gte": 200 }),
      ...categoryDateWindow(mediaType, category),
      ...(filters.year !== undefined &&
        (mediaType === "movie"
          ? { primary_release_year: filters.year }
          : { first_air_date_year: filters.year })),
      ...(filters.minRating !== undefined && {
        "vote_average.gte": filters.minRating,
      }),
      ...(filters.genreId !== undefined && { with_genres: filters.genreId }),
    },
  });
  const { page: resultPage, results, total_pages } = data;
  return { page: resultPage, results, total_pages };
};

export type Genre = { id: number; name: string };

/**
 * The full genre list for a media type — feeds the browse filter dropdown.
 * `all` merges the movie and TV lists (deduped by id, sorted by name) for the
 * mixed-type search page.
 */
export const fetchGenres = async (
  mediaType: MediaType | "all",
): Promise<Genre[]> => {
  if (mediaType !== "all") {
    const { data } = await tmdb.get(`/genre/${mediaType}/list`, {
      params: { language: "en-US" },
    });
    return data.genres;
  }
  const [movie, tv] = await Promise.all([
    fetchGenres("movie"),
    fetchGenres("tv"),
  ]);
  const byId = new Map<number, Genre>();
  for (const genre of [...movie, ...tv]) byId.set(genre.id, genre);
  return [...byId.values()].sort((a, b) => a.name.localeCompare(b.name));
};

/**
 * Client-side filter check. The search endpoints accept no filter params, so
 * the search page narrows each page of results locally with the same filters
 * the browse pages send to discover.
 */
export const matchesDiscoverFilters = (
  item: MediaSummary,
  filters: DiscoverFilters,
): boolean => {
  if (
    filters.year !== undefined &&
    Number((item.release_date || item.first_air_date)?.substring(0, 4)) !==
      filters.year
  ) {
    return false;
  }
  if (
    filters.minRating !== undefined &&
    (item.vote_average ?? 0) < filters.minRating
  ) {
    return false;
  }
  if (
    filters.genreId !== undefined &&
    !item.genre_ids?.includes(filters.genreId)
  ) {
    return false;
  }
  return true;
};

/**
 * Client-side counterpart of the discover sort for the search page — search
 * accepts no sort params, so each fetched page is reordered locally. Items
 * missing the sorted field (no date, no votes) sink to the low end.
 */
export const sortMediaSummaries = (
  items: MediaSummary[],
  sort: MediaSort | undefined,
): MediaSummary[] => {
  if (!sort) return items;
  const [field, direction] = sort.split(".");
  const valueOf = (item: MediaSummary): number =>
    field === "rating"
      ? (item.vote_average ?? 0)
      : Number((item.release_date || item.first_air_date)?.substring(0, 4)) ||
        0;
  const factor = direction === "asc" ? 1 : -1;
  return [...items].sort((a, b) => (valueOf(a) - valueOf(b)) * factor);
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
