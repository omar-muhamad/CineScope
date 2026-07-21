import { useSuspenseQuery } from "@tanstack/react-query";

import { fetchDetails, fetchRecommendations, fetchSimilar } from "@/api/tmdb";
import { queryKeys } from "@/lib/queryKeys";

/**
 * Full details for a title. Suspends until loaded — mount the consuming child
 * only once `mediaType`/`id` are known (the parent guards invalid routes).
 */
export const useDetails = (
  mediaType: string | undefined,
  id: string | undefined,
) =>
  useSuspenseQuery({
    queryKey: queryKeys.details(mediaType, id),
    queryFn: () => fetchDetails(mediaType, id),
  });

/**
 * Recommendations for a title. Keyed on the route params so it fetches in
 * parallel with the details query rather than waterfalling behind it.
 */
export const useRecommendations = (
  mediaType: string | undefined,
  id: string | undefined,
) =>
  useSuspenseQuery({
    queryKey: queryKeys.recommendations(mediaType, id),
    queryFn: () => fetchRecommendations(mediaType, id),
  });

/**
 * Similar titles for a title (TMDB matches on genres and keywords). Keyed on
 * the route params so it fetches in parallel with the details query.
 */
export const useSimilar = (
  mediaType: string | undefined,
  id: string | undefined,
) =>
  useSuspenseQuery({
    queryKey: queryKeys.similar(mediaType, id),
    queryFn: () => fetchSimilar(mediaType, id),
  });
