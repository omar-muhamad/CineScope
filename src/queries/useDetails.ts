import { useQuery } from "@tanstack/react-query";

import { fetchDetails, fetchRecommendations, fetchSimilar } from "@/api/tmdb";
import { queryKeys } from "@/lib/queryKeys";

/** Full details for a title. */
export const useDetails = (
  mediaType: string | undefined,
  id: string | undefined,
  enabled = true,
) =>
  useQuery({
    queryKey: queryKeys.details(mediaType, id),
    queryFn: () => fetchDetails(mediaType, id),
    enabled: enabled && Boolean(mediaType && id),
  });

/**
 * Recommendations for a title. Dependent query — pass `enabled` from whether
 * the details have loaded (and supply the resolved numeric id).
 */
export const useRecommendations = (
  mediaType: string | undefined,
  id: number | string | undefined,
  enabled = true,
) =>
  useQuery({
    queryKey: queryKeys.recommendations(mediaType, id),
    queryFn: () => fetchRecommendations(mediaType, id),
    enabled: enabled && Boolean(mediaType && id),
  });

/**
 * Similar titles for a title (TMDB matches on genres and keywords). Dependent
 * query — pass `enabled` from whether the details have loaded (and supply the
 * resolved numeric id).
 */
export const useSimilar = (
  mediaType: string | undefined,
  id: number | string | undefined,
  enabled = true,
) =>
  useQuery({
    queryKey: queryKeys.similar(mediaType, id),
    queryFn: () => fetchSimilar(mediaType, id),
    enabled: enabled && Boolean(mediaType && id),
  });
