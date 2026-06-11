import { FC, useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { IoChevronBackOutline, IoChevronForwardOutline } from "react-icons/io5";

import { useDetails } from "@/queries/useDetails";
import { useSeasonEpisodes } from "./queries/useSeasonEpisodes";
import QueryBoundary from "@/components/common/QueryBoundary";
import MediaRowSkeleton from "@/components/common/MediaRowSkeleton";
import {
  RecommendationsRow,
  SimilarRow,
} from "@/components/common/MediaRowSections";
import Heading from "@/components/ui/Heading";
import Skeleton from "@/components/skeletons/Skeleton";
import PlayerSelector from "./components/PlayerSelector";
import SeasonSelector from "./components/SeasonSelector";
import EpisodeList from "./components/EpisodeList";
import { providers } from "./lib/providers";
import NotFound from "@/pages/NotFound";
import PageLayout from "@/components/layout/PageLayout";

type WatchContentProps = {
  mediaType: string;
  id: string;
};

/**
 * Title + player + season/episode selector. Suspends on the details query;
 * episode data stays on `useQuery` so switching seasons never re-suspends
 * (which would unmount the playing iframe).
 */
const WatchDetailsContent: FC<WatchContentProps> = ({ mediaType, id }) => {
  const isTv = mediaType === "tv";
  const movie = mediaType === "movie";

  const [providerIndex, setProviderIndex] = useState(0);
  const [season, setSeason] = useState(1);
  const [episode, setEpisode] = useState(1);

  const { data: details } = useDetails(mediaType, id);

  const { data: episodesData, isLoading: episodesLoading } = useSeasonEpisodes(
    id,
    season,
    isTv,
  );
  const episodes = Array.isArray(episodesData) ? episodesData : [];

  // Seasons worth showing: skip Specials (season 0) and empty seasons.
  const availableSeasons = useMemo(
    () =>
      (details.seasons ?? []).filter(
        (s) => s.season_number > 0 && s.episode_count > 0,
      ),
    [details.seasons],
  );

  // Reset to the first real season/episode whenever a new show loads.
  useEffect(() => {
    if (isTv && availableSeasons.length > 0) {
      // Syncing local selection to async-loaded data; react-hooks 7's
      // set-state-in-effect rule flags this, but it's the intended behavior.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSeason(availableSeasons[0].season_number);
      setEpisode(1);
    }
  }, [availableSeasons, isTv]);

  const src = providers[providerIndex].build({
    media_type: mediaType,
    id,
    season,
    episode,
  });

  const currentIndex = episodes.findIndex(
    (ep) => ep.episode_number === episode,
  );
  const isFirst = currentIndex <= 0;
  const isLast = currentIndex < 0 || currentIndex >= episodes.length - 1;

  const currentEpisode = currentIndex >= 0 ? episodes[currentIndex] : undefined;
  const releaseYear = movie
    ? details.release_date?.slice(0, 4)
    : details.first_air_date?.slice(0, 4);

  const goPrev = () => {
    if (!isFirst) setEpisode(episodes[currentIndex - 1].episode_number);
  };
  const goNext = () => {
    if (!isLast) setEpisode(episodes[currentIndex + 1].episode_number);
  };

  return (
    <section>
      <Heading as="h1" className="text-orange font-bold max-md:text-xl">
        {movie ? details.title : details.name}
        {releaseYear && (
          <span className="ml-2 text-xl font-normal text-gray max-md:text-base">
            ({releaseYear})
          </span>
        )}
      </Heading>

      {isTv && (
        <p className="mt-2 text-gray max-md:text-sm">
          Now watching:{" "}
          <span className="font-semibold text-white">
            S{season} - E{episode}
          </span>
          {currentEpisode?.name && (
            <span className="ml-2">{currentEpisode.name}</span>
          )}
        </p>
      )}

      {/* Player module: toggle + nav on top, video below */}
      <div className="mt-8 rounded-xl overflow-hidden bg-secondary-dark md:p-4">
        <div className="flex items-center justify-between gap-2 rounded-t-lg bg-main-dark">
          <PlayerSelector
            providers={providers}
            active={providerIndex}
            onSelect={setProviderIndex}
          />

          {isTv && episodes.length > 0 && (
            <div className="flex">
              <button
                onClick={goPrev}
                disabled={isFirst}
                aria-label="Previous episode"
                className="flex items-center gap-1 px-5 py-3 text-sm text-gray hover:text-white hover:bg-white/5 transition-colors duration-200 disabled:opacity-40 disabled:hover:text-gray disabled:hover:bg-transparent"
              >
                <IoChevronBackOutline />
              </button>
              <button
                onClick={goNext}
                disabled={isLast}
                aria-label="Next episode"
                className="flex items-center gap-1 px-5 py-3 text-sm rounded-tr-lg text-gray hover:text-white hover:bg-white/5 transition-colors duration-200 disabled:opacity-40 disabled:hover:text-gray disabled:hover:bg-transparent"
              >
                <IoChevronForwardOutline />
              </button>
            </div>
          )}
        </div>

        <div className="w-full aspect-video bg-black rounded-b-lg">
          <iframe
            src={src}
            className="w-full h-full rounded-b-lg border-0"
            title="Video player"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen *"
            allowFullScreen
            referrerPolicy="no-referrer"
          ></iframe>
        </div>
      </div>

      {/* Season selector + episode list (TV only) */}
      {isTv && availableSeasons.length > 0 && (
        <div className="mt-6">
          <div>
            <div className="flex items-center gap-2 mt-6">
              <Heading as="h2">Seasons</Heading>
              {availableSeasons.length > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-secondary-dark text-sm text-gray">
                  {availableSeasons.length}
                </span>
              )}
            </div>
            <SeasonSelector
              seasons={availableSeasons}
              season={season}
              onSeasonChange={(s) => {
                setSeason(s);
                setEpisode(1);
              }}
            />
            <div className="flex items-center gap-2 mt-6">
              <Heading as="h2">Episodes</Heading>
              {episodes.length > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-secondary-dark text-sm text-gray">
                  {episodes.length}
                </span>
              )}
            </div>
          </div>

          <div className="mt-4">
            <EpisodeList
              episodes={episodes}
              activeEpisode={episode}
              loading={episodesLoading}
              onSelect={setEpisode}
            />
          </div>
        </div>
      )}
    </section>
  );
};

const WatchDetailsSkeleton: FC = () => (
  <>
    <Skeleton className="h-9 w-1/2 max-w-md rounded-sm" />
    <div className="mt-8 rounded-xl bg-secondary-dark p-4">
      <Skeleton className="h-12 w-full rounded-t-lg" />
      <Skeleton className="w-full aspect-video rounded-b-lg" />
    </div>
  </>
);

const WatchOnline: FC = () => {
  const { media_type, id } = useParams();

  // Guard written as an early return on the negation so TS narrows `media_type`
  // to "movie" | "tv" and `id` to string for the children below.
  if (
    !(media_type === "movie" || media_type === "tv") ||
    !id ||
    !/^\d+$/.test(id)
  ) {
    return <NotFound />;
  }

  const resetKeys = [media_type, id];

  return (
    <main className="w-full pb-6">
      <PageLayout>
        <QueryBoundary
          fallback={<WatchDetailsSkeleton />}
          resetKeys={resetKeys}
        >
          <WatchDetailsContent mediaType={media_type} id={id} />
        </QueryBoundary>

        <QueryBoundary
          fallback={
            <MediaRowSkeleton title="Recommendations" className="mt-16" />
          }
          resetKeys={resetKeys}
        >
          <RecommendationsRow
            mediaType={media_type}
            id={id}
            className="mt-16"
          />
        </QueryBoundary>

        <QueryBoundary
          fallback={
            <MediaRowSkeleton title="More Like This" className="mt-10" />
          }
          resetKeys={resetKeys}
        >
          <SimilarRow mediaType={media_type} id={id} className="mt-10" />
        </QueryBoundary>
      </PageLayout>
    </main>
  );
};

export default WatchOnline;
