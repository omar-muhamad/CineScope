import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { searchMulti } from "@/api/tmdb";
import { queryKeys } from "@/lib/queryKeys";
import type { MediaSummary } from "@/types";

/** Minimum trimmed query length before suggestions are fetched. */
export const MIN_SUGGESTION_QUERY_LENGTH = 3;

const MAX_SUGGESTIONS = 5;

/**
 * Top movie/TV matches for the nav search type-ahead. Reuses the search
 * page's first-page cache key, so submitting the query afterwards is a cache
 * hit. Previous results are kept as placeholder data while a refined query
 * fetches, so the dropdown dims instead of flashing back to skeletons. Pass
 * an empty string to pause fetching (e.g. while the dropdown is closed).
 */
export const useSearchSuggestions = (query: string) =>
  useQuery({
    queryKey: queryKeys.search(query, 1),
    queryFn: () => searchMulti(query, 1),
    enabled: query.length >= MIN_SUGGESTION_QUERY_LENGTH,
    placeholderData: keepPreviousData,
    // search/multi also returns people — the app only shows movies and TV.
    select: (data): MediaSummary[] =>
      (data.results ?? [])
        .filter(
          (item) => item.media_type === "movie" || item.media_type === "tv",
        )
        .slice(0, MAX_SUGGESTIONS),
  });
