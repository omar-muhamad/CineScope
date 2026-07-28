import { useQueries } from "@tanstack/react-query";
import { FC, useState } from "react";
import { IoChevronBack, IoChevronForward } from "react-icons/io5";

import { fetchDetails } from "@/api/tmdb";
import Skeleton from "@/components/skeletons/Skeleton";
import { queryKeys } from "@/lib/queryKeys";
import { useContinueWatching } from "@/queries/useWatchHistory";
import ContinueWatchingBanner, {
  BANNER_HEIGHT,
} from "./ContinueWatchingBanner";

const arrowClasses =
  "absolute top-1/2 -translate-y-1/2 z-40 hidden sm:flex items-center justify-center w-10 h-10 rounded-full text-white text-2xl bg-orange/80 border border-white/10 backdrop-blur-xs shadow-lg transition-all duration-300 hover:bg-white hover:text-orange hover:scale-105";

/**
 * "Continue Watching" as a one-slide-at-a-time banner, page-width like the
 * trending grids (it lives inside PageLayout). Entries come from the shared
 * history cache; arrows/dots step the visible slide, wrapping at the ends.
 * Renders nothing when signed out (the history query never runs) or when
 * there's no history yet, so the home page is unchanged for those users.
 */
const ContinueWatchingSection: FC = () => {
  const { entries, isLoading } = useContinueWatching();
  const [index, setIndex] = useState(0);

  // History rows only persist the poster, so the wide banner art comes from
  // the details cache — same key as the Details page, so visits overlap.
  const details = useQueries({
    queries: entries.map(({ item }) => ({
      queryKey: queryKeys.details(item.media_type, String(item.id)),
      queryFn: () => fetchDetails(item.media_type, String(item.id)),
    })),
  });

  // isLoading is only ever true signed-in, so signed-out users skip straight
  // to the empty branch below. The skeleton mirrors the loaded layout —
  // including the dots row — so users WITH history (the common signed-in
  // case) get no shift; a user with empty history sees the section collapse
  // once the fetch settles, the accepted trade-off of reserving space.
  if (isLoading) {
    return (
      <section className="w-full mt-6">
        <Skeleton className={`w-full ${BANNER_HEIGHT} rounded-lg mt-6`} />
        <div className="mt-3 flex justify-center">
          <Skeleton className="h-2 w-24 rounded-full" />
        </div>
      </section>
    );
  }

  if (entries.length === 0) return null;

  const count = entries.length;
  // Clamp rather than reset so removing history rows can't strand the index.
  const active = Math.min(index, count - 1);
  const step = (delta: number) => setIndex((active + delta + count) % count);

  return (
    <section className="w-full mt-6">
      <div className="relative mt-6">
        <div className="overflow-hidden rounded-lg">
          <ul
            className="flex transition-transform duration-500 ease-out"
            style={{ transform: `translateX(-${active * 100}%)` }}
          >
            {entries.map((entry, i) => (
              <ContinueWatchingBanner
                key={`${entry.item.media_type}:${entry.item.id}`}
                {...entry}
                backdropPath={details[i]?.data?.backdrop_path}
                active={i === active}
              />
            ))}
          </ul>
        </div>

        {count > 1 && (
          <>
            <button
              type="button"
              aria-label="Previous"
              onClick={() => step(-1)}
              className={`${arrowClasses} left-2`}
            >
              <IoChevronBack />
            </button>
            <button
              type="button"
              aria-label="Next"
              onClick={() => step(1)}
              className={`${arrowClasses} right-2`}
            >
              <IoChevronForward />
            </button>
          </>
        )}
      </div>

      {count > 1 && (
        <div className="mt-3 flex justify-center gap-2">
          {entries.map((entry, i) => (
            <button
              key={`${entry.item.media_type}:${entry.item.id}`}
              type="button"
              aria-label={`Go to slide ${i + 1}`}
              aria-current={i === active}
              onClick={() => setIndex(i)}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === active
                  ? "w-6 bg-orange"
                  : "w-2 bg-white/20 hover:bg-white/40"
              }`}
            />
          ))}
        </div>
      )}
    </section>
  );
};
export default ContinueWatchingSection;
