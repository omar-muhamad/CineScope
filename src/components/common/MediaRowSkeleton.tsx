import { FC } from "react";

import Heading from "@/components/ui/Heading";
import SkeletonMediaRow from "@/components/skeletons/SkeletonMediaRow";

type MediaRowSkeletonProps = {
  /** Heading shown above the placeholder row, matching the real section. */
  title: string;
  count?: number;
  /** Section classes — must match the corresponding MediaScrollSection. */
  className?: string;
};

/**
 * Suspense fallback for a MediaScrollSection: the section heading plus a
 * placeholder row, in the same `<section>` geometry so content swaps in
 * without layout shift.
 */
const MediaRowSkeleton: FC<MediaRowSkeletonProps> = ({
  title,
  count = 12,
  className = "px-4 md:px-16 mt-6 md:mt-10",
}) => (
  <section className={className}>
    <Heading as="h2" className="text-orange font-bold max-md:text-xl">
      {title}
    </Heading>
    <SkeletonMediaRow count={count} />
  </section>
);
export default MediaRowSkeleton;
