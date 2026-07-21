import { FC } from "react";
import {
  IoCalendarOutline,
  IoCheckmarkCircle,
  IoCheckmarkCircleOutline,
  IoCheckmarkSharp,
  IoPlay,
  IoStar,
  IoTimeOutline,
} from "react-icons/io5";

import { Episode } from "@/types";
import PosterFallback from "@/components/ui/PosterFallback";
import Heading from "@/components/ui/Heading";
import Text from "@/components/ui/Text";
import SkeletonEpisode from "./SkeletonEpisode";

type EpisodeListProps = {
  episodes: Episode[];
  activeEpisode: number;
  loading?: boolean;
  onSelect: (episode: number) => void;
  /** Episode numbers of the current season with watch history. */
  watchedEpisodes?: Set<number>;
  /** Manual un/mark; omitted when logged out (hides the per-row toggle). */
  onToggleWatched?: (episode: number, next: boolean) => void;
};

const formatDate = (date: string | null) =>
  date
    ? new Date(date).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "TBA";

const EpisodeList: FC<EpisodeListProps> = ({
  episodes,
  activeEpisode,
  loading,
  onSelect,
  watchedEpisodes,
  onToggleWatched,
}) => {
  if (loading) {
    return (
      <ul className="flex flex-col gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonEpisode key={i} />
        ))}
      </ul>
    );
  }

  if (!episodes || episodes.length === 0) {
    return (
      <Text size="sm" className="text-gray py-6">
        No episodes available for this season.
      </Text>
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {episodes.map((ep) => {
        const isPlaying = ep.episode_number === activeEpisode;
        const isWatched = watchedEpisodes?.has(ep.episode_number) ?? false;

        return (
          // Relative so the watched toggle can sit inside the row visually
          // while staying a sibling of the row <button> (nested buttons are
          // invalid HTML).
          <li key={ep.id} className="relative">
            <button
              onClick={() => onSelect(ep.episode_number)}
              aria-pressed={isPlaying}
              className={`group w-full text-left flex gap-3 sm:gap-4 p-3 rounded-xl border transition-colors duration-200 ${
                isPlaying
                  ? "border-orange bg-secondary-dark"
                  : "border-transparent bg-secondary-dark/40 hover:bg-secondary-dark"
              }`}
            >
              <div className="relative w-28 sm:w-40 shrink-0 aspect-video rounded-lg overflow-hidden bg-main-dark">
                {ep.still_path ? (
                  <img
                    src={`https://image.tmdb.org/t/p/w300/${ep.still_path}`}
                    alt={ep.name}
                    loading="lazy"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <PosterFallback media_type="tv" className="w-full h-full" />
                )}
                {isWatched && !onToggleWatched && (
                  <span
                    aria-hidden
                    className="absolute top-1 right-1 flex size-5 items-center justify-center rounded-full bg-black/60"
                  >
                    <IoCheckmarkSharp className="text-xs text-orange" />
                  </span>
                )}
                <div
                  className={`absolute inset-0 flex items-center justify-center bg-black/40 transition-opacity ${
                    isPlaying
                      ? "opacity-100"
                      : "opacity-0 group-hover:opacity-100"
                  }`}
                >
                  <IoPlay className="text-3xl text-white" />
                </div>
              </div>

              <div className="grow min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2 py-0.5 rounded-md bg-main-dark text-xs">
                    EP {ep.episode_number}
                  </span>
                  {isPlaying && (
                    <span className="px-2 py-0.5 rounded-md bg-orange text-white text-xs">
                      Playing
                    </span>
                  )}
                  {isWatched && (
                    <span className="px-2 py-0.5 rounded-md bg-white/10 text-gray text-xs">
                      Watched
                    </span>
                  )}
                </div>
                <Heading as="h3" size="sm" className="mt-1 truncate">
                  {ep.name}
                </Heading>
                <Text size="sm" className="text-gray line-clamp-2 mt-1">
                  {ep.overview}
                </Text>
              </div>

              <div className="hidden sm:flex flex-col items-end gap-1 shrink-0 text-gray text-sm">
                <span className="flex items-center gap-1 whitespace-nowrap">
                  <IoCalendarOutline />
                  {formatDate(ep.air_date)}
                </span>
                {ep.vote_average > 0 && (
                  <span className="flex items-center gap-1">
                    <IoStar className="text-orange" />
                    {ep.vote_average.toFixed(1)}
                  </span>
                )}
                {ep.runtime ? (
                  <span className="flex items-center gap-1">
                    <IoTimeOutline />
                    {ep.runtime}m
                  </span>
                ) : null}
              </div>
            </button>

            {onToggleWatched && (
              // Overlays the thumbnail's top-right corner. Offsets are tied to
              // the row's p-3 padding and the thumbnail width (w-28 / sm:w-40);
              // it must stay a sibling of the row <button>, not a child.
              <button
                type="button"
                onClick={() => onToggleWatched(ep.episode_number, !isWatched)}
                aria-pressed={isWatched}
                aria-label={
                  isWatched
                    ? `Remove episode ${ep.episode_number} from watch history`
                    : `Mark episode ${ep.episode_number} as watched`
                }
                className="absolute top-4 left-24 sm:left-36 flex size-6 cursor-pointer items-center justify-center rounded-full bg-black/60 text-lg transition-colors hover:bg-black/80"
              >
                {isWatched ? (
                  <IoCheckmarkCircle className="text-orange" />
                ) : (
                  <IoCheckmarkCircleOutline className="text-orange" />
                )}
              </button>
            )}
          </li>
        );
      })}
    </ul>
  );
};

export default EpisodeList;
