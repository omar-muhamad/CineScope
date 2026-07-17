import { useSuspenseQuery } from "@tanstack/react-query";

import {
  fetchDiscover,
  fetchMediaList,
  hasDiscoverFilters,
  type DiscoverFilters,
  type MediaCategory,
  type MediaType,
} from "@/api/tmdb";
import { queryKeys } from "@/lib/queryKeys";

/**
 * A page of a browse category (popular, trending, now playing, upcoming, top
 * rated, on the air), optionally narrowed by year / rating / genre filters —
 * filtered pages come from the discover endpoint since the category endpoints
 * don't accept filters. Suspends on a page or filter change — callers wrap
 * their state update in `useTransition` so React keeps the current grid
 * visible instead of flashing the skeleton (useSuspenseQuery has no
 * `placeholderData`).
 */
export const useMediaList = (
  mediaType: MediaType,
  category: MediaCategory,
  page: number,
  filters: DiscoverFilters = {},
) =>
  useSuspenseQuery({
    queryKey: queryKeys.mediaList(mediaType, category, page, filters),
    queryFn: () =>
      hasDiscoverFilters(filters)
        ? fetchDiscover(mediaType, category, filters, page)
        : fetchMediaList(mediaType, category, page),
  });
