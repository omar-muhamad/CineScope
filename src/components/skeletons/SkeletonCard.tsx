import { FC } from "react";

import Skeleton from "./Skeleton";

/**
 * Placeholder for an ItemCard. Matches its `<li>` poster box (aspect-[2/3],
 * rounded-lg) and `mt-2` meta block so swapping in real cards causes no shift.
 */
const SkeletonCard: FC = () => {
  return (
    <li data-testid="skeleton-card">
      <Skeleton className="w-full rounded-lg aspect-2/3" />
      <div className="mt-2">
        <Skeleton className="h-3 w-2/3 rounded-sm" />
        <Skeleton className="h-4 w-5/6 rounded-sm mt-2" />
      </div>
    </li>
  );
};
export default SkeletonCard;
