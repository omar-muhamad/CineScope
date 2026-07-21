import { FC } from "react";
import {
  IoCheckmarkDone,
  IoCheckmarkOutline,
  IoPlay,
  IoTimeOutline,
} from "react-icons/io5";

import { Episode } from "@/types";
import PosterFallback from "@/components/ui/PosterFallback";
import Skeleton from "@/components/skeletons/Skeleton";
import Text from "@/components/ui/Text";

type EpisodeRailProps = {
  episodes: Episode[];
  activeEpisode: number;
  loading?: boolean;
  onSelect: (episode: number) => void;
  /** Episode numbers of the current season with watch history. */
  watchedEpisodes?: Set<number>;
  /** Manual un/mark; omitted when logged out (hides the per-row toggle). */
  onToggleWatched?: (episode: number, next: boolean) => void;
};

const formatShortDate = (date: string | null) =>
  date
    ? new Date(date).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "TBA";

/**
 * Compact, single-column episode list for the theater-layout sidebar rail.
 * Shares EpisodeList's props and behaviour but drops the wide thumbnail and
 * the right-hand meta column so a row fits a ~360px rail; the watched toggle
 * sits in the row's own trailing column (a sibling of the select button, so
 * no nested buttons) instead of overlaying the thumbnail.
 */
const EpisodeRail: FC<EpisodeRailProps> = ({
  episodes,
  activeEpisode,
  loading,
  onSelect,
  watchedEpisodes,
  onToggleWatched,
}) => {
  if (loading) {
    return (
      <ul className="flex flex-col gap-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <li
            key={i}
            data-testid="skeleton-rail-episode"
            className="flex gap-3 p-2 rounded-lg bg-secondary-dark/40"
          >
            <Skeleton className="w-24 shrink-0 aspect-video rounded-md" />
            <div className="grow min-w-0">
              <Skeleton className="h-3 w-10 rounded-sm" />
              <Skeleton className="h-4 w-2/3 rounded-sm mt-2" />
              <Skeleton className="h-3 w-1/2 rounded-sm mt-2" />
            </div>
          </li>
        ))}
      </ul>
    );
  }

  if (!episodes || episodes.length === 0) {
    return (
      <Text size="sm" className="text-gray py-4">
        No episodes available for this season.
      </Text>
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      {episodes.map((ep) => {
        const isPlaying = ep.episode_number === activeEpisode;
        const isWatched = watchedEpisodes?.has(ep.episode_number) ?? false;

        return (
          <li
            key={ep.id}
            className={`flex items-stretch gap-1 overflow-hidden rounded-lg border transition-colors duration-200 ${
              isPlaying
                ? "border-orange bg-secondary-dark"
                : "border-transparent hover:bg-main-dark"
            }`}
          >
            <button
              onClick={() => onSelect(ep.episode_number)}
              aria-pressed={isPlaying}
              className="group grow min-w-0 text-left flex gap-3 p-2"
            >
              <div className="relative w-24 shrink-0 aspect-video rounded-md overflow-hidden bg-main-dark">
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
                    className="absolute top-1 right-1 flex items-center justify-center rounded bg-black/70 px-1"
                  >
                    <IoCheckmarkDone className="text-xs text-orange" />
                  </span>
                )}
                <div
                  className={`absolute inset-0 flex items-center justify-center bg-black/40 transition-opacity ${
                    isPlaying
                      ? "opacity-100"
                      : "opacity-0 group-hover:opacity-100"
                  }`}
                >
                  <IoPlay className="text-2xl text-white" />
                </div>
              </div>

              <div className="grow min-w-0">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="px-1.5 py-0.5 rounded bg-main-dark text-xs shrink-0">
                    EP {ep.episode_number}
                  </span>
                  {isPlaying && (
                    <span className="px-1.5 py-0.5 rounded bg-orange text-white text-xs shrink-0">
                      Playing
                    </span>
                  )}
                  {isWatched && (
                    <span className="px-1.5 py-0.5 rounded bg-white/10 text-gray text-xs shrink-0">
                      Watched
                    </span>
                  )}
                </div>
                <h4 className="mt-1 truncate text-sm font-outfitMedium text-white">
                  {ep.name}
                </h4>
                <span className="mt-1 flex items-center gap-1 truncate text-xs text-gray">
                  {formatShortDate(ep.air_date)}
                  {ep.runtime ? (
                    <span className="flex items-center gap-1">
                      <span aria-hidden>·</span>
                      <IoTimeOutline />
                      {ep.runtime}m
                    </span>
                  ) : null}
                </span>
              </div>
            </button>

            {onToggleWatched && (
              <button
                type="button"
                onClick={() => onToggleWatched(ep.episode_number, !isWatched)}
                aria-pressed={isWatched}
                aria-label={
                  isWatched
                    ? `Remove episode ${ep.episode_number} from watch history`
                    : `Mark episode ${ep.episode_number} as watched`
                }
                title={isWatched ? "Watched" : "Mark as watched"}
                className={`shrink-0 flex w-10 items-center justify-center text-xl transition-colors hover:bg-white/5 ${
                  isWatched ? "text-orange" : "text-gray hover:text-white"
                }`}
              >
                {isWatched ? <IoCheckmarkDone /> : <IoCheckmarkOutline />}
              </button>
            )}
          </li>
        );
      })}
    </ul>
  );
};

export default EpisodeRail;
