import { FC } from "react";
import { IoOpenOutline, IoStar, IoTimeOutline } from "react-icons/io5";

import type { DetailsData } from "@/types";
import type { SavedMeta } from "@/api/saved";
import { getCertification } from "@/pages/Details/lib/ratings";
import { getTrailerKey } from "@/pages/Details/lib/trailers";
import { useImdbInfo } from "@/pages/Details/queries/useImdbInfo";
import { useTrailerModal } from "@/pages/Details/components/useTrailerModal";
import PlayButton from "@/pages/Details/components/PlayButton";
import TrailerModal from "@/pages/Details/components/TrailerModal";
import BookMark from "@/components/ui/BookMark";
import WatchLater from "@/components/ui/WatchLater";
import WatchedToggle from "@/components/ui/WatchedToggle";
import Heading from "@/components/ui/Heading";
import Text from "@/components/ui/Text";

type MovieInfoPanelProps = {
  id: number;
  details: DetailsData;
  /** Card metadata persisted by the save/watched toggles. */
  saveMeta: SavedMeta;
};

const formatRuntime = (minutes: number | null | undefined) => {
  if (!minutes || minutes <= 0) return null;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
};

// OMDb returns votes as a comma-grouped string ("1,234,567"); show a compact
// form ("1.2M") so it fits beside the rating in the narrow rail.
const formatVotes = (votes: string | null | undefined) => {
  if (!votes) return null;
  const n = Number(votes.replace(/[^0-9]/g, ""));
  if (!Number.isFinite(n) || n <= 0) return null;
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(n);
};

/**
 * "About this movie" rail for the theater layout: ratings (TMDB, plus IMDb +
 * vote count when available), save/watched toggles, genres, quick facts
 * (runtime · year · certification), a scrollable synopsis, and Trailer / IMDb
 * actions. Fills its column height so the synopsis scrolls while the actions
 * stay pinned to the bottom. Reuses the Details page's certification/trailer
 * helpers, toggles and IMDb query (a non-blocking OMDb lookup) — no extra TMDB
 * fetches.
 */
const MovieInfoPanel: FC<MovieInfoPanelProps> = ({ id, details, saveMeta }) => {
  const trailerKey = getTrailerKey(details);
  const { trailerUrl, isOpen, openTrailer, closeTrailer } =
    useTrailerModal(trailerKey);

  const certification = getCertification(details, "movie");
  const runtime = formatRuntime(details.runtime);
  const year = details.release_date?.slice(0, 4);
  const imdbId = details.external_ids?.imdb_id ?? details.imdb_id ?? null;
  const { data: imdbInfo } = useImdbInfo(imdbId);
  const imdbVotes = formatVotes(imdbInfo?.votes);
  const topGenres = details.genres?.slice(0, 3) ?? [];

  return (
    <div className="flex h-full flex-col rounded-xl bg-secondary-dark p-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span
            title="TMDB rating"
            className="flex items-center gap-1 text-sm text-gray"
          >
            <IoStar className="text-orange" />
            {details.vote_average.toFixed(1)}
          </span>
          {imdbInfo?.rating && (
            <span
              title="IMDb rating"
              className="flex items-center gap-1 text-sm text-gray"
            >
              <IoStar className="text-[#F5C518]" />
              <span className="text-white">{imdbInfo.rating}</span>
              {imdbVotes && <span className="text-xs">({imdbVotes})</span>}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className="h-9 w-9">
            <BookMark
              id={id}
              media_type="movie"
              meta={saveMeta}
              className="w-full h-full"
            />
          </div>
          <div className="h-9 w-9">
            <WatchLater
              id={id}
              media_type="movie"
              meta={saveMeta}
              className="w-full h-full"
            />
          </div>
          <div className="h-9 w-9">
            <WatchedToggle
              id={id}
              media_type="movie"
              meta={saveMeta}
              className="w-full h-full"
            />
          </div>
        </div>
      </div>

      {topGenres.length > 0 && (
        <ul className="mt-4 flex flex-wrap gap-2">
          {topGenres.map((genre) => (
            <li
              key={genre.id}
              className="rounded-full bg-main-dark px-3 py-1 text-xs text-gray"
            >
              {genre.name}
            </li>
          ))}
        </ul>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gray">
        {runtime && (
          <span className="flex items-center gap-1">
            <IoTimeOutline />
            {runtime}
          </span>
        )}
        {year && <span>{year}</span>}
        {certification && (
          <span className="rounded-sm border border-white/40 px-1.5 text-xs leading-tight">
            {certification}
          </span>
        )}
      </div>

      <div className="mt-4 flex-1 min-h-0 overflow-y-auto pr-1">
        <Heading as="h2" size="sm" className="text-orange">
          Overview
        </Heading>
        <Text size="sm" className="mt-2 text-[#c3c4c7]">
          {details.overview || "No overview available."}
        </Text>
      </div>

      <div className="mt-4 flex items-center gap-2">
        <PlayButton className="h-10 flex-1" onClick={openTrailer}>
          Trailer
        </PlayButton>
        {imdbId && (
          <a
            href={`https://www.imdb.com/title/${imdbId}`}
            target="_blank"
            rel="noreferrer noopener"
            className="flex h-10 items-center gap-1 rounded-full bg-main-dark px-4 text-sm text-white transition-colors hover:bg-white/10"
          >
            IMDb
            <IoOpenOutline />
          </a>
        )}
      </div>

      {isOpen && (
        <TrailerModal trailerUrl={trailerUrl} onClose={closeTrailer} />
      )}
    </div>
  );
};

export default MovieInfoPanel;
