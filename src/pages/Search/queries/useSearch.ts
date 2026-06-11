import { useSuspenseQuery } from "@tanstack/react-query";

import { searchMulti } from "@/api/tmdb";
import { queryKeys } from "@/lib/queryKeys";

/**
 * Multi-type search results for a query + page. Only mount this (via the parent
 * guard) when the query is non-empty — `useSuspenseQuery` has no `enabled`. The
 * page page-state update is wrapped in `useTransition` so paging keeps the
 * current results visible instead of flashing the skeleton.
 */
export const useSearch = (query: string, page: number) =>
  useSuspenseQuery({
    queryKey: queryKeys.search(query, page),
    queryFn: () => searchMulti(query, page),
  });
