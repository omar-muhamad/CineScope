import { useQuery } from "@tanstack/react-query";

import { fetchImdbRating } from "../api/omdb";
import { queryKeys } from "@/lib/queryKeys";

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
