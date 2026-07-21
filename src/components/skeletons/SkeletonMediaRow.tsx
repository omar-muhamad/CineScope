import { FC } from "react";

import Skeleton from "./Skeleton";

/** Fixed card width shared with MediaScrollSection so cards and skeletons align. */
export const ROW_CARD_WIDTH = "w-36 md:w-44 shrink-0";

type SkeletonMediaRowProps = {
  /** How many placeholder cards to render. */
  count?: number;
};

/**
 * Placeholder for a horizontally scrolling media row (MediaScrollSection).
 * Mirrors the ItemCard geometry — fixed-width column, aspect-2/3 poster,
 * meta + title lines — so swapping in real cards causes no layout shift.
 */
const SkeletonMediaRow: FC<SkeletonMediaRowProps> = ({ count = 12 }) => {
  return (
    <ul className="mt-6 flex gap-4 overflow-x-auto pb-4">
      {Array.from({ length: count }).map((_, i) => (
        <li key={i} className={ROW_CARD_WIDTH}>
          <Skeleton className="w-full rounded-lg aspect-2/3" />
          <div className="mt-2">
            <Skeleton className="h-3 w-2/3 rounded-sm" />
            <Skeleton className="h-4 w-5/6 rounded-sm mt-2" />
          </div>
        </li>
      ))}
    </ul>
  );
};
export default SkeletonMediaRow;
