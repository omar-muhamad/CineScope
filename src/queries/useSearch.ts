import { useQuery } from "@tanstack/react-query";

import { searchMulti } from "@/api/tmdb";
import { queryKeys } from "@/lib/queryKeys";

/** Multi-type search results for a query + page. Disabled when the query is empty. */
export const useSearch = (query: string, page: number) =>
  useQuery({
    queryKey: queryKeys.search(query, page),
    queryFn: () => searchMulti(query, page),
    enabled: query.length > 0,
  });
