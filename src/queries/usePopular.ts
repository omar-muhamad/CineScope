import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { fetchPopular, type MediaType } from "@/api/tmdb";
import { queryKeys } from "@/lib/queryKeys";

/**
 * A page of popular movies or TV shows. `placeholderData: keepPreviousData`
 * keeps the current grid visible while the next page loads.
 */
export const usePopular = (mediaType: MediaType, page: number) =>
  useQuery({
    queryKey: queryKeys.popular(mediaType, page),
    queryFn: () => fetchPopular(mediaType, page),
    placeholderData: keepPreviousData,
  });
