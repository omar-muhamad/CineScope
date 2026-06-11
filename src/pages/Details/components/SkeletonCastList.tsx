import { FC } from "react";

import Skeleton from "@/components/skeletons/Skeleton";

type SkeletonCastListProps = {
  /** How many placeholder cards to render. */
  count?: number;
};

/**
 * Placeholder row for CastList. Mirrors the CastCard geometry (fixed-width
 * column, aspect-2/3 headshot, name + character lines) so swapping in the real
 * cast causes no layout shift.
 */
const SkeletonCastList: FC<SkeletonCastListProps> = ({ count = 8 }) => {
  return (
    <ul className="mt-6 flex gap-4 overflow-x-auto pb-4">
      {Array.from({ length: count }).map((_, i) => (
        <li key={i} className="w-28 md:w-32 shrink-0">
          <Skeleton className="w-full rounded-lg aspect-2/3" />
          <Skeleton className="h-4 w-5/6 rounded-sm mt-2" />
          <Skeleton className="h-3 w-2/3 rounded-sm mt-2" />
        </li>
      ))}
    </ul>
  );
};
export default SkeletonCastList;
