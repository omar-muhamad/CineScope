import { FC } from "react";

type SkeletonProps = {
  className?: string;
};

/**
 * Base skeleton block: a muted box with a pulsing animation.
 * Size/shape it via `className` (width, height, rounding, aspect ratio).
 * Falls back to a static block when the user prefers reduced motion.
 */
const Skeleton: FC<SkeletonProps> = ({ className = "" }) => {
  return (
    <div
      data-testid="skeleton"
      className={`animate-pulse bg-secondary-dark motion-reduce:animate-none ${className}`}
    />
  );
};
export default Skeleton;
