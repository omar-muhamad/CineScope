import { useSuspenseQuery } from "@tanstack/react-query";

import { fetchPopular, type MediaType } from "@/api/tmdb";
import { queryKeys } from "@/lib/queryKeys";

/**
 * A page of popular movies or TV shows. Suspends on a page change — callers
 * wrap their page-state update in `useTransition` so React keeps the current
 * grid visible instead of flashing the skeleton (useSuspenseQuery has no
 * `placeholderData`).
 */
export const usePopular = (mediaType: MediaType, page: number) =>
  useSuspenseQuery({
    queryKey: queryKeys.popular(mediaType, page),
    queryFn: () => fetchPopular(mediaType, page),
  });
