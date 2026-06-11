import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { fetchMediaList, type MediaCategory, type MediaType } from "@/api/tmdb";
import { queryKeys } from "@/lib/queryKeys";

/**
 * A page of a browse category (trending, now playing, upcoming, top rated, on
 * the air). `placeholderData: keepPreviousData` keeps the current grid visible
 * while the next page loads.
 */
export const useMediaList = (
  mediaType: MediaType,
  category: MediaCategory,
  page: number,
) =>
  useQuery({
    queryKey: queryKeys.mediaList(mediaType, category, page),
    queryFn: () => fetchMediaList(mediaType, category, page),
    placeholderData: keepPreviousData,
  });
