import { FC, useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { IoChevronBackOutline, IoChevronForwardOutline } from "react-icons/io5";

import {
  useDetails,
  useRecommendations,
  useSimilar,
} from "@/queries/useDetails";
import { useSeasonEpisodes } from "./queries/useSeasonEpisodes";
import MediaScrollSection from "@/components/common/MediaScrollSection";
import Heading from "@/components/ui/Heading";
import Skeleton from "@/components/skeletons/Skeleton";
import SkeletonMediaRow from "@/components/skeletons/SkeletonMediaRow";
import PlayerSelector from "./components/PlayerSelector";
import SeasonSelector from "./components/SeasonSelector";
import EpisodeList from "./components/EpisodeList";
import { providers } from "./lib/providers";
import NotFound from "@/pages/NotFound";
import PageLayout from "@/components/layout/PageLayout";

const WatchOnline: FC = () => {
  const { media_type, id } = useParams();

  const isValid =
    (media_type === "movie" || media_type === "tv") && !!id && /^\d+$/.test(id);

  const isTv = media_type === "tv";

  const [providerIndex, setProviderIndex] = useState(0);
  const [season, setSeason] = useState(1);
  const [episode, setEpisode] = useState(1);

  const { data: details, isLoading: loading } = useDetails(
    media_type,
    id,
    isValid,
  );

  const pageMediaType = media_type === "movie" ? "movie" : "tv";

  const { data: recommendations, isLoading: recommendationsLoading } =
    useRecommendations(media_type, details?.id, isValid && Boolean(details));

  const { data: similar, isLoading: similarLoading } = useSimilar(
    media_type,
    details?.id,
    isValid && Boolean(details),
  );

  const { data: episodesData, isLoading: episodesLoading } = useSeasonEpisodes(
    id,
    season,
    isValid && isTv,
  );
  const episodes = Array.isArray(episodesData) ? episodesData : [];

  // Seasons worth showing: skip Specials (season 0) and empty seasons.
  const availableSeasons = useMemo(
    () =>
      (details?.seasons ?? []).filter(
        (s) => s.season_number > 0 && s.episode_count > 0,
      ),
    [details?.seasons],
  );

  // Reset to the first real season/episode whenever a new show loads.
  useEffect(() => {
    if (isTv && availableSeasons.length > 0) {
      setSeason(availableSeasons[0].season_number);
      setEpisode(1);
    }
  }, [availableSeasons, isTv]);

  if (!isValid) return <NotFound />;

  const movie = media_type === "movie";
  const src = providers[providerIndex].build({
    media_type,
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
  const releaseYear =
    pageMediaType === "movie"
      ? details?.release_date?.slice(0, 4)
      : details?.first_air_date?.slice(0, 4);

  const goPrev = () => {
    if (!isFirst) setEpisode(episodes[currentIndex - 1].episode_number);
  };
  const goNext = () => {
    if (!isLast) setEpisode(episodes[currentIndex + 1].episode_number);
  };

  return (
    <main className="w-full pb-6">
      <PageLayout
        loading={loading}
        skeleton={
          <>
            <Skeleton className="h-9 w-1/2 max-w-md rounded-sm" />
            <div className="mt-8 rounded-xl bg-secondary-dark p-4">
              <Skeleton className="h-12 w-full rounded-t-lg" />
              <Skeleton className="w-full aspect-video rounded-b-lg" />
            </div>
            <Skeleton className="h-8 w-56 rounded-sm mt-16" />
            <SkeletonMediaRow />
          </>
        }
      >
        <section>
          <Heading as="h1" className="text-orange font-bold max-md:text-xl">
            {movie ? details?.title : details?.name}
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
                // sandbox="allow-scripts allow-same-origin allow-presentation"
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

        <MediaScrollSection
          title="Recommendations"
          items={recommendations}
          mediaType={pageMediaType}
          isLoading={recommendationsLoading}
          className="mt-16"
        />
        <MediaScrollSection
          title="More Like This"
          items={similar}
          mediaType={pageMediaType}
          isLoading={similarLoading}
          className="mt-10"
        />
      </PageLayout>
    </main>
  );
};

export default WatchOnline;
