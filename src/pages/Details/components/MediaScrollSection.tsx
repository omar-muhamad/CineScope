import { FC } from "react";

import type { MediaSummary } from "@/types";
import ItemCard from "@/components/ui/ItemCard";
import Heading from "@/components/ui/Heading";
import Skeleton from "@/components/skeletons/Skeleton";

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
};

/** Shared width so the real cards and the loading skeletons line up exactly. */
const CARD_WIDTH = "w-36 md:w-44 shrink-0";

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
}) => {
  const visible = (items ?? []).slice(0, count);
  if (!isLoading && visible.length === 0) return null;

  return (
    <section className="px-4 md:px-16 mt-6 md:mt-10">
      <Heading as="h2" className="text-orange font-bold max-md:text-xl">
        {title}
      </Heading>
      <ul className="mt-6 flex gap-4 overflow-x-auto pb-4">
        {isLoading
          ? Array.from({ length: count }).map((_, i) => (
              <li key={i} className={CARD_WIDTH}>
                <Skeleton className="w-full rounded-lg aspect-2/3" />
                <div className="mt-2">
                  <Skeleton className="h-3 w-2/3 rounded-sm" />
                  <Skeleton className="h-4 w-5/6 rounded-sm mt-2" />
                </div>
              </li>
            ))
          : visible.map((item) => {
              const movie = (item.media_type ?? mediaType) === "movie";
              return (
                <ItemCard
                  key={item.id}
                  className={CARD_WIDTH}
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
    </section>
  );
};
export default MediaScrollSection;
