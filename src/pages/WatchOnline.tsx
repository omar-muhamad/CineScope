import { FC, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import { IoChevronBackOutline, IoChevronForwardOutline } from "react-icons/io5";

import { AppDispatch, RootState } from "@/redux/store";
import {
  fetchDetails,
  fetchSeasonEpisodes,
} from "@/redux/details/detailsSlice";
import { fetchRecommendations } from "@/redux/home/homeSlice";
import GridLayout from "@/components/layout/GridLayout";
import ItemCard from "@/components/ui/ItemCard";
import Heading from "@/components/ui/Heading";
import Loading from "@/components/common/Loading";
import PlayerSelector from "@/components/watch/PlayerSelector";
import SeasonSelector from "@/components/watch/SeasonSelector";
import EpisodeList from "@/components/watch/EpisodeList";
import { providers } from "@/components/watch/providers";
import NotFound from "./NotFound";
import PageLayout from "@/components/layout/PageLayout";

const WatchOnline: FC = () => {
  const data = useSelector((state: RootState) => state.details);
  const dispatch = useDispatch<AppDispatch>();

  const { loading, details, recommendations, episodesLoading } = data;
  const episodes = Array.isArray(data.episodes) ? data.episodes : [];
  const { media_type, id } = useParams();

  const isValid =
    (media_type === "movie" || media_type === "tv") && !!id && /^\d+$/.test(id);

  const isTv = media_type === "tv";

  const [providerIndex, setProviderIndex] = useState(0);
  const [season, setSeason] = useState(1);
  const [episode, setEpisode] = useState(1);

  // Seasons worth showing: skip Specials (season 0) and empty seasons.
  const availableSeasons = useMemo(
    () =>
      (details?.seasons ?? []).filter(
        (s) => s.season_number > 0 && s.episode_count > 0,
      ),
    [details?.seasons],
  );

  useEffect(() => {
    if (!isValid) return;
    dispatch(fetchDetails({ media_type, id })).then((res) => {
      if (res.meta.requestStatus === "fulfilled" && res.payload?.id) {
        const { id } = res.payload;
        dispatch(fetchRecommendations({ id, media_type }));
      }
    });
  }, [dispatch, id, media_type, isValid]);

  // Reset to the first real season/episode whenever a new show loads.
  useEffect(() => {
    if (isTv && availableSeasons.length > 0) {
      setSeason(availableSeasons[0].season_number);
      setEpisode(1);
    }
  }, [availableSeasons, isTv]);

  // Fetch the selected season's episodes (TV only).
  useEffect(() => {
    if (isValid && isTv && id) {
      dispatch(fetchSeasonEpisodes({ id, season_number: season }));
    }
  }, [dispatch, id, isTv, season, isValid]);

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

  const goPrev = () => {
    if (!isFirst) setEpisode(episodes[currentIndex - 1].episode_number);
  };
  const goNext = () => {
    if (!isLast) setEpisode(episodes[currentIndex + 1].episode_number);
  };

  return (
    <main className="w-full pb-6">
      {loading ? (
        <Loading />
      ) : (
        <PageLayout loading={loading!}>
          <section>
            <Heading as="h1" className="text-orange font-bold">{movie ? details?.title : details?.name}</Heading>

            {/* Player module: toggle + nav on top, video below */}
            <div className="mt-8 rounded-xl overflow-hidden bg-secondary-dark p-4">
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
                      Prev
                    </button>
                    <button
                      onClick={goNext}
                      disabled={isLast}
                      aria-label="Next episode"
                      className="flex items-center gap-1 px-5 py-3 text-sm rounded-tr-lg text-gray hover:text-white hover:bg-white/5 transition-colors duration-200 disabled:opacity-40 disabled:hover:text-gray disabled:hover:bg-transparent"
                    >
                      Next
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
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                  allowFullScreen
                  referrerPolicy="no-referrer"
                ></iframe>
              </div>
            </div>

            {/* Season selector + episode list (TV only) */}
            {isTv && availableSeasons.length > 0 && (
              <div className="mt-6">
                <div>
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

          <section className="pl-6 md:pl-0 mt-16">
            <Heading as="h2" className="text-orange font-bold">Recommendations</Heading>
            <GridLayout>
              {recommendations && recommendations.length !== 0
                ? recommendations.map((item) => {
                    const isMovie = item.media_type === "movie";
                    return (
                      <ItemCard
                        key={item.id}
                        id={item.id}
                        imgSrc={item.poster_path}
                        releaseDate={
                          isMovie
                            ? item.release_date?.substring(0, 4)
                            : item.first_air_date?.substring(0, 4)
                        }
                        media_type={isMovie ? "movie" : "tv"}
                        ratings={item.adult ? "18+" : "PG"}
                        title={isMovie ? item.title : item.name}
                      />
                    );
                  })
                : null}
            </GridLayout>
          </section>
        </PageLayout>
      )}
    </main>
  );
};

export default WatchOnline;
