import { FC } from "react";

type SkeletonProps = {
  className?: string;
};

/**
 * Base skeleton block: a muted box with an animated shimmer sweep.
 * Size/shape it via `className` (width, height, rounding, aspect ratio).
 * Falls back to a static block when the user prefers reduced motion.
 */
const Skeleton: FC<SkeletonProps> = ({ className = "" }) => {
  return (
    <div
      data-testid="skeleton"
      className={`relative overflow-hidden bg-secondary-dark ${className}`}
    >
      <div className="absolute inset-0 -translate-x-full bg-linear-to-r from-transparent via-white/10 to-transparent animate-shimmer motion-reduce:animate-none motion-reduce:translate-x-0" />
    </div>
  );
};
export default Skeleton;
