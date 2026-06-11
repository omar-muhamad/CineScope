import { FC } from "react";
import {
  IoCalendarOutline,
  IoPlay,
  IoStar,
  IoTimeOutline,
} from "react-icons/io5";

import { Episode } from "@/types";
import poster from "@/assets/images/default-poster.png";
import Heading from "@/components/ui/Heading";
import Text from "@/components/ui/Text";
import SkeletonEpisode from "./SkeletonEpisode";

type EpisodeListProps = {
  episodes: Episode[];
  activeEpisode: number;
  loading?: boolean;
  onSelect: (episode: number) => void;
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
        const still = ep.still_path
          ? `https://image.tmdb.org/t/p/w300/${ep.still_path}`
          : poster;

        return (
          <li key={ep.id}>
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
                <img
                  src={still}
                  alt={ep.name}
                  loading="lazy"
                  className="w-full h-full object-cover"
                />
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
          </li>
        );
      })}
    </ul>
  );
};

export default EpisodeList;
