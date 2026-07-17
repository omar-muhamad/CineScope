import { useQuery } from "@tanstack/react-query";

import { fetchGenres, type MediaType } from "@/api/tmdb";
import { queryKeys } from "@/lib/queryKeys";

/**
 * Genre list for the browse filters. Deliberately non-suspending — the filter
 * bar renders with just its "All Genres" option until this resolves. The list
 * never changes, so cache it for the whole session.
 */
export const useGenres = (mediaType: MediaType | "all") =>
  useQuery({
    queryKey: queryKeys.genres(mediaType),
    queryFn: () => fetchGenres(mediaType),
    staleTime: Infinity,
  });
