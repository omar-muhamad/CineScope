import { useQuery } from "@tanstack/react-query";

import { fetchSeasonEpisodes } from "@/api/tmdb";
import { queryKeys } from "@/lib/queryKeys";

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
