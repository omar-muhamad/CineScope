import { FC } from "react";

import Skeleton from "@/components/skeletons/Skeleton";

/**
 * Placeholder for the DetailsHeader hero. Matches its `h-[25vh] md:h-[450px]`
 * section, the hidden-on-mobile poster column, and the stacked title/meta/
 * buttons/overview bars within the same `px-16` flex layout.
 */
const SkeletonDetailsHeader: FC = () => {
  return (
    <section className="relative w-full h-[25vh] md:h-[450px]">
      <div className="absolute w-full z-10 top-0 px-16 md:py-5 h-full flex gap-6">
        <div className="h-full hidden md:block">
          <Skeleton className="h-full aspect-2/3 rounded-xl" />
        </div>

        <div className="h-full md:mt-5 grow">
          <Skeleton className="h-8 md:h-10 w-2/3 max-w-md rounded-sm mt-6" />
          <Skeleton className="h-4 w-1/3 max-w-xs rounded-sm mt-4" />
          <Skeleton className="h-4 w-1/4 max-w-48 rounded-sm mt-3" />

          <div className="mt-3 flex gap-2">
            <Skeleton className="h-10 w-10 rounded-full" />
            <Skeleton className="h-10 w-10 rounded-md" />
            <Skeleton className="h-10 w-28 rounded-full" />
          </div>
          <Skeleton className="h-10 w-full max-w-sm rounded-full mt-3" />

          <div className="hidden md:block mt-4 max-w-[50vw]">
            <Skeleton className="h-4 w-24 rounded-sm" />
            <Skeleton className="h-3 w-full rounded-sm mt-3" />
            <Skeleton className="h-3 w-11/12 rounded-sm mt-2" />
            <Skeleton className="h-3 w-4/5 rounded-sm mt-2" />
          </div>
        </div>
      </div>
    </section>
  );
};
export default SkeletonDetailsHeader;
