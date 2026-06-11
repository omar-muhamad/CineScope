import { useSuspenseQuery } from "@tanstack/react-query";

import { fetchMediaList, type MediaCategory, type MediaType } from "@/api/tmdb";
import { queryKeys } from "@/lib/queryKeys";

/**
 * A page of a browse category (trending, now playing, upcoming, top rated, on
 * the air). Suspends on a page change — callers wrap their page-state update in
 * `useTransition` so React keeps the current grid visible instead of flashing
 * the skeleton (useSuspenseQuery has no `placeholderData`).
 */
export const useMediaList = (
  mediaType: MediaType,
  category: MediaCategory,
  page: number,
) =>
  useSuspenseQuery({
    queryKey: queryKeys.mediaList(mediaType, category, page),
    queryFn: () => fetchMediaList(mediaType, category, page),
  });
