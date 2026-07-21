import { useQuery } from "@tanstack/react-query";

import { fetchImdbInfo } from "../api/omdb";
import { queryKeys } from "@/lib/queryKeys";

/**
 * IMDb rating + vote count for a title. Dependent query — pass the IMDb id
 * derived from the loaded details; runs only once an id is available.
 */
export const useImdbInfo = (imdbId: string | null | undefined) =>
  useQuery({
    queryKey: queryKeys.imdbRating(imdbId),
    queryFn: () => fetchImdbInfo(imdbId),
    enabled: Boolean(imdbId),
  });
