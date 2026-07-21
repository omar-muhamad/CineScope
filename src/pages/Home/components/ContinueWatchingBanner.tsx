import { FC } from "react";
import { NavLink } from "react-router-dom";
import { IoPlay } from "react-icons/io5";

import Text from "@/components/ui/Text";
import LazyImage from "@/components/ui/LazyImage";
import PosterFallback from "@/components/ui/PosterFallback";
import type { ContinueWatchingEntry } from "@/queries/useWatchHistory";

/** Shared with the section skeleton so the swap doesn't shift layout. */
export const BANNER_ASPECT = "aspect-video md:aspect-[21/9]";

type ContinueWatchingBannerProps = ContinueWatchingEntry & {
  /** Wide TMDB backdrop, fetched by the section; the poster is the fallback. */
  backdropPath?: string;
  /** Only the visible slide is interactive and exposed to assistive tech. */
  active: boolean;
};

/**
 * One full-width slide of the continue-watching banner. TV links stay bare
 * (/watch/tv/:id) so the watch page's resume redirect picks the episode;
 * the label still names it so users know where they left off.
 */
const ContinueWatchingBanner: FC<ContinueWatchingBannerProps> = ({
  item,
  season,
  episode,
  backdropPath,
  active,
}) => {
  const movie = item.media_type === "movie";
  const title = (movie ? item.title : item.name) ?? "";
  const imgSrc = backdropPath
    ? `https://image.tmdb.org/t/p/w1280/${backdropPath}`
    : item.poster_path
      ? `https://image.tmdb.org/t/p/w780/${item.poster_path}`
      : null;

  return (
    <li aria-hidden={!active} className="relative w-full shrink-0">
      <NavLink
        className="group/banner relative block"
        to={`/watch/${item.media_type}/${item.id}`}
        tabIndex={active ? undefined : -1}
      >
        {imgSrc ? (
          <LazyImage
            className={`w-full ${BANNER_ASPECT} object-cover rounded-lg`}
            src={imgSrc}
            alt={`${title} backdrop`}
          />
        ) : (
          <PosterFallback
            media_type={item.media_type}
            className={`w-full ${BANNER_ASPECT} rounded-lg`}
          />
        )}

        {/* Gradient overlay for readability over the backdrop */}
        <div className="absolute inset-0 rounded-lg bg-linear-to-t from-black/90 via-black/40 to-transparent" />
        <div className="absolute inset-0 p-4 md:p-8 flex flex-col justify-end">
          {/* Season 0 is the movie / show-level sentinel — no episode to name. */}
          {season > 0 && (
            <Text size="sm" className="text-orange">
              S{season} · E{episode}
            </Text>
          )}
          <h3 className="font-outfitMedium text-xl md:text-3xl truncate text-ellipsis">
            {title}
          </h3>
          <span className="mt-2 md:mt-4 flex items-center gap-2 self-start bg-orange text-black font-outfitMedium text-sm md:text-base py-2 px-4 rounded-full transition-colors group-hover/banner:bg-white">
            <IoPlay />
            Resume
          </span>
        </div>
      </NavLink>
    </li>
  );
};
export default ContinueWatchingBanner;
