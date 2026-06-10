import { useQuery } from "@tanstack/react-query";

import {
  fetchDetails,
  fetchRecommendations,
  fetchSeasonEpisodes,
} from "@/api/tmdb";
import { fetchImdbRating } from "@/api/omdb";
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
 * IMDb rating for a title. Dependent query — pass the IMDb id derived from the
 * loaded details; runs only once an id is available.
 */
export const useImdbRating = (imdbId: string | null | undefined) =>
  useQuery({
    queryKey: queryKeys.imdbRating(imdbId),
    queryFn: () => fetchImdbRating(imdbId),
    enabled: Boolean(imdbId),
  });

/** Episodes for the selected season of a TV show. */
export const useSeasonEpisodes = (
  id: string | undefined,
  season: number,
  enabled = true,
) =>
  useQuery({
    queryKey: queryKeys.episodes(id, season),
    queryFn: () => fetchSeasonEpisodes(id, season),
    enabled: enabled && Boolean(id),
  });
