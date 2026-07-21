import { FC } from "react";

import { useRecommendations, useSimilar } from "@/queries/useDetails";
import MediaScrollSection from "./MediaScrollSection";

type RowProps = {
  mediaType: string;
  id: string | undefined;
  /** Section classes — must match the corresponding MediaRowSkeleton fallback. */
  className?: string;
};

/**
 * "Recommendations" row. Suspends on its own query (wrap in a QueryBoundary
 * with a MediaRowSkeleton fallback) and hides itself when there are no items.
 */
export const RecommendationsRow: FC<RowProps> = ({
  mediaType,
  id,
  className,
}) => {
  const { data } = useRecommendations(mediaType, id);
  return (
    <MediaScrollSection
      title="Recommendations"
      items={data}
      mediaType={mediaType}
      className={className}
    />
  );
};

/**
 * "More Like This" (similar titles) row. Suspends on its own query and hides
 * itself when there are no items.
 */
export const SimilarRow: FC<RowProps> = ({ mediaType, id, className }) => {
  const { data } = useSimilar(mediaType, id);
  return (
    <MediaScrollSection
      title="More Like This"
      items={data}
      mediaType={mediaType}
      className={className}
    />
  );
};
