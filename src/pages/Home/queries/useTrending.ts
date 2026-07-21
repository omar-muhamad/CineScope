import { useSuspenseQuery } from "@tanstack/react-query";

import { fetchTrending } from "@/api/tmdb";
import { queryKeys } from "@/lib/queryKeys";

/** Trending titles this week for the given scope (`all`, `movie`, or `tv`). */
export const useTrending = (scope: "all" | "movie" | "tv") =>
  useSuspenseQuery({
    queryKey: queryKeys.trending(scope),
    queryFn: () => fetchTrending(scope),
  });
