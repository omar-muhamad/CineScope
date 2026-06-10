import { FC } from "react";

import Skeleton from "./Skeleton";

/**
 * Placeholder for a TrendingCard. Mirrors its `<li>` responsive widths and the
 * aspect-2/3 poster so the carousel keeps its geometry while loading.
 */
const SkeletonTrendingCard: FC = () => {
  return (
    <li
      data-testid="skeleton-trending-card"
      className="relative shrink-0 w-[42vw] sm:w-[28vw] md:w-[20vw] lg:w-[16vw]"
    >
      <Skeleton className="w-full rounded-lg aspect-2/3" />
    </li>
  );
};
export default SkeletonTrendingCard;
