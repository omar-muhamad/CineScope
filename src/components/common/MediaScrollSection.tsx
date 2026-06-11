import { FC } from "react";

import type { MediaSummary } from "@/types";
import ItemCard from "@/components/ui/ItemCard";
import Heading from "@/components/ui/Heading";
import SkeletonMediaRow, {
  ROW_CARD_WIDTH,
} from "@/components/skeletons/SkeletonMediaRow";

type MediaScrollSectionProps = {
  /** Section heading (e.g. "Recommendations", "More Like This"). */
  title: string;
  items: MediaSummary[] | undefined;
  /**
   * Fallback media type for results that omit `media_type` (the `/similar`
   * endpoint returns only the source's type and drops the field).
   */
  mediaType: string;
  isLoading?: boolean;
  /** Max items to surface in the row. */
  count?: number;
  /**
   * Classes for the wrapping `<section>`. Defaults to the standalone look
   * (own horizontal padding); pass margin-only when the parent already pads.
   */
  className?: string;
};

/**
 * A titled, horizontally scrolling row of media cards. Hides itself entirely
 * when finished loading with no items so an empty heading never lingers.
 */
const MediaScrollSection: FC<MediaScrollSectionProps> = ({
  title,
  items,
  mediaType,
  isLoading,
  count = 12,
  className = "px-4 md:px-16 mt-6 md:mt-10",
}) => {
  const visible = (items ?? []).slice(0, count);
  if (!isLoading && visible.length === 0) return null;

  return (
    <section className={className}>
      <Heading as="h2" className="text-orange font-bold max-md:text-xl">
        {title}
      </Heading>
      {isLoading ? (
        <SkeletonMediaRow count={count} />
      ) : (
        <ul className="mt-6 flex gap-4 overflow-x-auto pb-4">
          {visible.map((item) => {
            const movie = (item.media_type ?? mediaType) === "movie";
            return (
              <ItemCard
                key={item.id}
                className={ROW_CARD_WIDTH}
                id={item.id}
                imgSrc={item.poster_path}
                releaseDate={
                  movie
                    ? item.release_date?.substring(0, 4)
                    : item.first_air_date?.substring(0, 4)
                }
                media_type={movie ? "movie" : "tv"}
                rating={item.vote_average}
                title={movie ? item.title : item.name}
              />
            );
          })}
        </ul>
      )}
    </section>
  );
};
export default MediaScrollSection;
