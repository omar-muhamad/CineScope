import { MEDIA_SORTS, type DiscoverFilters, type MediaSort } from "@/api/tmdb";

const PARAM_KEYS = {
  year: "year",
  minRating: "rating",
  genreId: "genre",
  sort: "sort",
} as const;

const readNumber = (
  params: URLSearchParams,
  key: string,
): number | undefined => {
  const raw = params.get(key);
  if (raw === null) return undefined;
  const value = Number(raw);
  return Number.isFinite(value) && value > 0 ? value : undefined;
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
  year: readNumber(params, PARAM_KEYS.year),
  minRating: readNumber(params, PARAM_KEYS.minRating),
  genreId: readNumber(params, PARAM_KEYS.genreId),
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
