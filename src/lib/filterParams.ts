import { MEDIA_SORTS, type DiscoverFilters, type MediaSort } from "@/api/tmdb";

const PARAM_KEYS = {
  year: "year",
  minRating: "rating",
  genreId: "genre",
  sort: "sort",
} as const;

/**
 * Bounds of the option lists MediaFilters renders. URL values outside them
 * are dropped — otherwise a pasted `?year=1940` would filter the grid while
 * the pill still shows the unselected placeholder.
 */
export const FILTER_YEAR_MIN = 1950;
export const FILTER_RATING_MIN = 5;
export const FILTER_RATING_MAX = 9;

const readInt = (
  params: URLSearchParams,
  key: string,
  min: number,
  max: number,
): number | undefined => {
  const raw = params.get(key);
  if (raw === null) return undefined;
  const value = Number(raw);
  return Number.isInteger(value) && value >= min && value <= max
    ? value
    : undefined;
};

const readSort = (params: URLSearchParams): MediaSort | undefined => {
  const raw = params.get(PARAM_KEYS.sort);
  return MEDIA_SORTS.includes(raw as MediaSort)
    ? (raw as MediaSort)
    : undefined;
};

/**
 * Parse browse filters out of URL query params
 * (`year`, `rating`, `genre`, `sort`).
 */
export const filtersFromParams = (
  params: URLSearchParams,
): DiscoverFilters => ({
  year: readInt(
    params,
    PARAM_KEYS.year,
    FILTER_YEAR_MIN,
    new Date().getFullYear(),
  ),
  minRating: readInt(
    params,
    PARAM_KEYS.minRating,
    FILTER_RATING_MIN,
    FILTER_RATING_MAX,
  ),
  // TMDB genre ids are positive integers; membership in the fetched genre
  // list is the API's concern, not parseable here.
  genreId: readInt(params, PARAM_KEYS.genreId, 1, Number.MAX_SAFE_INTEGER),
  sort: readSort(params),
});

/**
 * A copy of `params` with the filter params set (or removed when unset).
 * Unrelated params — e.g. the search page's `search` — are preserved.
 */
export const paramsWithFilters = (
  params: URLSearchParams,
  filters: DiscoverFilters,
): URLSearchParams => {
  const next = new URLSearchParams(params);
  for (const [field, key] of Object.entries(PARAM_KEYS)) {
    const value = filters[field as keyof DiscoverFilters];
    if (value === undefined) next.delete(key);
    else next.set(key, String(value));
  }
  return next;
};

/** Stable primitive key for change detection (state resets, effect deps). */
export const filtersKey = (filters: DiscoverFilters): string =>
  `${filters.year ?? ""}|${filters.minRating ?? ""}|${filters.genreId ?? ""}|${filters.sort ?? ""}`;
