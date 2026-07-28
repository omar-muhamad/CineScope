import { FC, useEffect, useMemo } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { IoChevronBackOutline, IoChevronForwardOutline } from "react-icons/io5";

import { useDetails } from "@/queries/useDetails";
import { useSeasonEpisodes } from "./queries/useSeasonEpisodes";
import { useAutoRecordWatch } from "./hooks/useAutoRecordWatch";
import {
  useLastWatchedEpisode,
  useRecordWatch,
  useRemoveEpisodeFromHistory,
  useWatchedEpisodes,
} from "@/queries/useWatchHistory";
import { useAuth } from "@/auth/useAuth";
import type { MediaType } from "@/lib/tmdb";
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
import EpisodeRail from "./components/EpisodeRail";
import MovieInfoPanel from "./components/MovieInfoPanel";
import { providers } from "./lib/providers";
import NotFound from "@/pages/NotFound";
import PageLayout from "@/components/layout/PageLayout";

type WatchContentProps = {
  mediaType: string;
  id: string;
  urlSeason?: number;
  urlEpisode?: number;
};

/**
 * Title + player + season/episode selector. Suspends on the details query;
 * episode data stays on `useQuery` so switching seasons never re-suspends
 * (which would unmount the playing iframe).
 */
const WatchDetailsContent: FC<WatchContentProps> = ({
  mediaType,
  id,
  urlSeason,
  urlEpisode,
}) => {
  const isTv = mediaType === "tv";
  const movie = mediaType === "movie";

  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // Player selection lives in the URL (?player=2 → "Player 2", 1-based) so a
  // shared/refreshed link keeps the chosen player; anything missing or out of
  // range falls back to the first provider.
  const playerParam = Number(searchParams.get("player"));
  const providerIndex =
    Number.isInteger(playerParam) &&
    playerParam >= 1 &&
    playerParam <= providers.length
      ? playerParam - 1
      : 0;

  // Replace instead of push so toggling players doesn't pile up in history.
  const onPlayerSelect = (index: number) => {
    const next = new URLSearchParams(searchParams);
    next.set("player", String(index + 1));
    setSearchParams(next, { replace: true });
  };

  const { data: details } = useDetails(mediaType, id);

  // Seasons worth showing: skip Specials (season 0) and empty seasons.
  const availableSeasons = useMemo(
    () =>
      (details.seasons ?? []).filter(
        (s) => s.season_number > 0 && s.episode_count > 0,
      ),
    [details.seasons],
  );

  // Season/episode live in the path (/watch/tv/:id/:season/:episode) so a
  // shared/refreshed link opens the exact episode; missing segments fall back
  // to the first real season, episode 1.
  const season = urlSeason ?? availableSeasons[0]?.season_number ?? 1;
  const episode = urlEpisode ?? 1;

  const { user, loading: authLoading } = useAuth();
  const mediaId = Number(id);

  // Resume point for bare URLs: the show's most recently watched episode.
  const { lastWatched, isPending: historyPending } =
    useLastWatchedEpisode(mediaId);

  const goToEpisode = (s: number, e: number, opts?: { replace?: boolean }) => {
    navigate(
      {
        pathname: `/watch/tv/${id}/${s}/${e}`,
        search: searchParams.toString(),
      },
      opts,
    );
  };

  // Canonicalize bare TV URLs (e.g. /watch/tv/123 from the details page) once
  // details load, replacing so back doesn't bounce through the bare URL.
  // Shows with watch history resume at the last watched episode. The redirect
  // holds until the resume point is knowable: on a hard load the session is
  // still resolving (the history query hasn't even started — checking only
  // the query would let the redirect win the race and canonicalize to S1E1),
  // and once signed in it waits for the history rows themselves. Signed-out
  // sessions resolve fast and fall straight through. An explicit season in
  // the URL is always kept — only the episode gets filled in.
  useEffect(() => {
    if (!isTv || (urlSeason !== undefined && urlEpisode !== undefined)) return;
    if (authLoading || (user && historyPending)) return;
    const target =
      urlSeason !== undefined
        ? {
            season: urlSeason,
            episode:
              lastWatched?.season === urlSeason ? lastWatched.episode : 1,
          }
        : {
            season: lastWatched?.season ?? season,
            episode: lastWatched?.episode ?? episode,
          };
    navigate(
      {
        pathname: `/watch/tv/${id}/${target.season}/${target.episode}`,
        search: searchParams.toString(),
      },
      { replace: true },
    );
  }, [
    isTv,
    urlSeason,
    urlEpisode,
    id,
    season,
    episode,
    lastWatched,
    authLoading,
    user,
    historyPending,
    navigate,
    searchParams,
  ]);

  const { data: episodesData, isLoading: episodesLoading } = useSeasonEpisodes(
    id,
    season,
    isTv,
  );
  const episodes = Array.isArray(episodesData) ? episodesData : [];

  const src = providers[providerIndex].build({
    media_type: mediaType,
    id,
    season,
    episode,
  });

  // Card metadata persisted with history rows (same shape the save toggles
  // use) so the history page renders without re-hitting TMDB.
  const saveMeta = {
    title: movie ? details.title : details.name,
    poster_path: details.poster_path,
    release_date: movie ? details.release_date : details.first_air_date,
    vote_average: details.vote_average,
  };

  // TV waits until the URL is canonical (so the pre-resume render of a bare
  // URL never records episode 1) and the selected episode exists in the
  // loaded season, so an empty/stale selection is never recorded.
  useAutoRecordWatch({
    mediaType: mediaType as MediaType,
    mediaId,
    season: isTv ? season : 0,
    episode: isTv ? episode : 0,
    meta: saveMeta,
    enabled:
      movie ||
      (urlSeason !== undefined &&
        urlEpisode !== undefined &&
        episodes.some((ep) => ep.episode_number === episode)),
  });

  // Watched episodes of this show, narrowed to the visible season as plain
  // episode numbers for the list's Set lookups.
  const watchedKeys = useWatchedEpisodes(mediaId);
  const watchedInSeason = useMemo(() => {
    const set = new Set<number>();
    for (const key of watchedKeys) {
      const [s, e] = key.split(":").map(Number);
      if (s === season) set.add(e);
    }
    return set;
  }, [watchedKeys, season]);

  const recordWatch = useRecordWatch();
  const removeEpisode = useRemoveEpisodeFromHistory();
  const handleToggleWatched = (episodeNumber: number, next: boolean) => {
    const key = {
      mediaType: "tv" as const,
      mediaId,
      season,
      episode: episodeNumber,
    };
    if (next) {
      recordWatch.mutate({ ...key, meta: saveMeta });
    } else {
      removeEpisode.mutate(key);
    }
  };

  const currentIndex = episodes.findIndex(
    (ep) => ep.episode_number === episode,
  );
  const isFirst = currentIndex <= 0;
  const isLast = currentIndex < 0 || currentIndex >= episodes.length - 1;

  const releaseYear = movie
    ? details.release_date?.slice(0, 4)
    : details.first_air_date?.slice(0, 4);

  const goPrev = () => {
    if (!isFirst)
      goToEpisode(season, episodes[currentIndex - 1].episode_number);
  };
  const goNext = () => {
    if (!isLast) goToEpisode(season, episodes[currentIndex + 1].episode_number);
  };

  // The rail only has content for movies (always) and for TV with real
  // seasons. Without it, the player takes the full width instead of leaving an
  // empty second column (e.g. a Specials-only / unreleased show).
  const hasSidebar = movie || availableSeasons.length > 0;

  return (
    <section>
      <Heading as="h1" className="text-orange font-bold max-md:text-xl">
        {movie ? details.title : details.name}
        {releaseYear && (
          <span className="ml-2 text-xl font-normal text-gray max-md:text-base">
            ({releaseYear})
          </span>
        )}
        {isTv && (
          <span className="ml-2 font-semibold text-lg text-white">
            S{season} - E{episode}
          </span>
        )}
      </Heading>

      {/* Theater layout: the player on the left, a context rail on the right —
          the episode list for TV, an "about" panel for movies. Below lg the
          rail is hidden and the full episode section drops beneath the player.
          The player module occupies the same slot for both media types and
          never moves between branches, so switching season/episode/player
          never remounts (and reloads) the iframe. */}
      <div
        className={`mt-6 ${
          hasSidebar
            ? "grid gap-4 lg:grid-cols-3 lg:items-stretch lg:gap-6"
            : ""
        }`}
      >
        {/* Player module: toggle + nav on top, video below */}
        <div className="min-w-0 lg:col-span-2 rounded-xl overflow-hidden bg-secondary-dark md:p-4">
          <div className="flex items-center justify-between gap-2 rounded-t-lg bg-main-dark">
            <PlayerSelector
              providers={providers}
              active={providerIndex}
              onSelect={onPlayerSelect}
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

        {/* Context rail (lg+). Absolutely positioned inside a stretched grid
            cell so its content never grows the row: the row height stays equal
            to the player, and the rail's own body scrolls to fit. Only rendered
            when there's something to show (see hasSidebar). */}
        {hasSidebar && (
          <aside className="hidden lg:block lg:relative">
            <div className="lg:absolute lg:inset-0">
              {isTv ? (
                <div className="flex h-full flex-col rounded-xl bg-secondary-dark p-4">
                  <SeasonSelector
                    fullWidth
                    seasons={availableSeasons}
                    season={season}
                    onSeasonChange={(s) => goToEpisode(s, 1)}
                  />
                  <div className="mt-4 flex-1 min-h-0 overflow-y-auto pr-1">
                    <EpisodeRail
                      episodes={episodes}
                      activeEpisode={episode}
                      loading={episodesLoading}
                      onSelect={(e) => goToEpisode(season, e)}
                      watchedEpisodes={watchedInSeason}
                      onToggleWatched={user ? handleToggleWatched : undefined}
                    />
                  </div>
                </div>
              ) : (
                <MovieInfoPanel
                  id={mediaId}
                  details={details}
                  saveMeta={saveMeta}
                />
              )}
            </div>
          </aside>
        )}
      </div>

      {/* Season selector + full episode list — full width beneath the player
          on small screens; the rail replaces this at lg. (TV only) */}
      {isTv && availableSeasons.length > 0 && (
        <div className="mt-6 lg:hidden">
          <div>
            <div className="flex items-center gap-2">
              <Heading as="h2">Seasons</Heading>
              <span className="px-2 py-0.5 rounded-full bg-secondary-dark text-sm text-gray">
                {availableSeasons.length}
              </span>
            </div>
            <SeasonSelector
              seasons={availableSeasons}
              season={season}
              onSeasonChange={(s) => goToEpisode(s, 1)}
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
              onSelect={(e) => goToEpisode(season, e)}
              watchedEpisodes={watchedInSeason}
              onToggleWatched={user ? handleToggleWatched : undefined}
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
    <div className="mt-8 grid gap-4 lg:grid-cols-[minmax(0,1fr)_clamp(320px,26vw,400px)] lg:gap-6">
      <div className="min-w-0 rounded-xl bg-secondary-dark p-4">
        <Skeleton className="h-12 w-full rounded-t-lg" />
        <Skeleton className="w-full aspect-video rounded-b-lg" />
      </div>
      <div className="hidden rounded-xl bg-secondary-dark p-4 lg:block">
        <Skeleton className="h-14 w-full rounded-lg" />
        <div className="mt-4 flex flex-col gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  </>
);

const WatchOnline: FC = () => {
  const { media_type, id, season, episode } = useParams();

  // Optional /:season/:episode segments are TV-only and must be 1-based
  // integers — season 0 (TMDB "Specials") is excluded from the season
  // selector and rejected by the history API, so a hand-edited /0/ URL
  // would render a season the UI can't otherwise represent.
  const validSegment = (v?: string) => v === undefined || /^[1-9]\d*$/.test(v);

  // Guard written as an early return on the negation so TS narrows `media_type`
  // to "movie" | "tv" and `id` to string for the children below.
  if (
    !(media_type === "movie" || media_type === "tv") ||
    !id ||
    !/^\d+$/.test(id) ||
    !validSegment(season) ||
    !validSegment(episode) ||
    (media_type === "movie" && season !== undefined)
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
          <WatchDetailsContent
            mediaType={media_type}
            id={id}
            urlSeason={season !== undefined ? Number(season) : undefined}
            urlEpisode={episode !== undefined ? Number(episode) : undefined}
          />
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
            className="mt-10"
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
