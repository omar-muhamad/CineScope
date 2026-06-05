import { FC } from "react";

import GridLayout from "../layout/GridLayout";
import SkeletonCard from "./SkeletonCard";

type SkeletonGridProps = {
  /** How many placeholder cards to render. Defaults to two full rows. */
  count?: number;
};

/**
 * Fills the real GridLayout with placeholder cards so the loading grid shares
 * the exact responsive geometry of the loaded grid.
 */
const SkeletonGrid: FC<SkeletonGridProps> = ({ count = 14 }) => {
  return (
    <GridLayout>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </GridLayout>
  );
};
export default SkeletonGrid;
