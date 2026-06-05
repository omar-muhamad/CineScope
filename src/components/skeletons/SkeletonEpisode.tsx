import { FC } from "react";

import Skeleton from "./Skeleton";

/**
 * Placeholder for an EpisodeList row: an aspect-video thumbnail beside stacked
 * text bars, inside the same padded/rounded container as a real row.
 */
const SkeletonEpisode: FC = () => {
  return (
    <li
      data-testid="skeleton-episode"
      className="flex gap-3 sm:gap-4 p-3 rounded-xl bg-secondary-dark/40"
    >
      <Skeleton className="w-28 sm:w-40 shrink-0 aspect-video rounded-lg" />
      <div className="grow min-w-0">
        <Skeleton className="h-4 w-16 rounded" />
        <Skeleton className="h-4 w-2/3 rounded mt-2" />
        <Skeleton className="h-3 w-full rounded mt-2" />
      </div>
    </li>
  );
};
export default SkeletonEpisode;
