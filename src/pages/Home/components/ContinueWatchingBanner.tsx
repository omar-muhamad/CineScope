import { FC } from "react";
import { NavLink } from "react-router-dom";
import { IoPlay } from "react-icons/io5";

import Text from "@/components/ui/Text";
import LazyImage from "@/components/ui/LazyImage";
import PosterFallback from "@/components/ui/PosterFallback";
import type { ContinueWatchingEntry } from "@/queries/useWatchHistory";
import Heading from "@/components/ui/Heading";

/** Fixed slide height, shared with the section skeleton. */
export const BANNER_HEIGHT = "h-40 sm:h-48 md:h-60";

type ContinueWatchingBannerProps = ContinueWatchingEntry & {
  /** Wide TMDB backdrop, fetched by the section; the poster is the fallback. */
  backdropPath?: string;
  /** Only the visible slide is interactive and exposed to assistive tech. */
  active: boolean;
};

/**
 * One slide of the continue-watching banner: backdrop on the left, title /
 * episode / Resume on the right over the theme card background. TV links stay
 * bare (/watch/tv/:id) so the watch page's resume redirect picks the episode;
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
        className={`group/banner flex overflow-hidden rounded-lg bg-secondary-dark ${BANNER_HEIGHT}`}
        to={`/watch/${item.media_type}/${item.id}`}
        tabIndex={active ? undefined : -1}
      >
        <div className="relative w-2/5 sm:w-1/2 lg:w-2/5 shrink-0">
          {imgSrc ? (
            <LazyImage
              className="absolute inset-0 h-full w-full object-cover"
              src={imgSrc}
              alt={`${title} backdrop`}
            />
          ) : (
            <PosterFallback
              media_type={item.media_type}
              className="absolute inset-0 h-full w-full"
            />
          )}
          {/* Fade the backdrop's edge into the card background */}
          <div className="absolute inset-0 bg-linear-to-r from-transparent via-transparent to-secondary-dark" />
        </div>
        <div className="flex-1 flex pl-10 md:pl-16">
          <div className="flex flex-col min-w-0 items-start justify-center gap-1 px-4 sm:px-6 md:px-8">
            <Heading as="h2" className="text-orange font-bold max-md:text-xl">
              Continue Watching
            </Heading>
            {/* Season 0 is the movie / show-level sentinel — no episode to name. */}
            <h3 className="w-full mt-2 md:mt-4 font-outfitMedium text-xl sm:text-2xl md:text-4xl line-clamp-2 text-ellipsis">
              {title}
            </h3>
            {season > 0 && (
              <Text size="base" className="-mt-1 text-orange md:text-lg">
                S{season} · E{episode}
              </Text>
            )}
            <span className="mt-2 md:mt-4 flex items-center gap-2 bg-orange text-black font-outfitMedium text-sm sm:text-base md:text-lg py-2 px-4 md:py-2.5 md:px-6 rounded-full transition-colors group-hover/banner:bg-white">
              <IoPlay />
              Resume
            </span>
          </div>
        </div>
      </NavLink>
    </li>
  );
};
export default ContinueWatchingBanner;
