import { FC } from "react";

import GridLayout from "@/components/layout/GridLayout";
import PageLayout from "@/components/layout/PageLayout";
import Heading from "@/components/ui/Heading";
import ItemCard from "@/components/ui/ItemCard";
import type { SaveKind } from "@/components/ui/SaveToggle";
import Skeleton from "@/components/skeletons/Skeleton";
import SkeletonGrid from "@/components/skeletons/SkeletonGrid";
import type { MediaItem } from "@/redux/bookmarked/bookmarkSlice";

type SavedMediaPageProps = {
  /** Label used to build the section headings, e.g. "Bookmarked". */
  label: string;
  items: MediaItem[] | null;
  loading: boolean;
  /** Which TMDB list each card's toggle controls (so removal works here). */
  saveKind: SaveKind;
};

/** Shared layout for the favorites (bookmarked) and watchlist pages. */
const SavedMediaPage: FC<SavedMediaPageProps> = ({
  label,
  items,
  loading,
  saveKind,
}) => {
  const movies = items?.filter((item) => item.media_type === "movie");
  const tvShows = items?.filter((item) => item.media_type === "tv");

  return (
    <PageLayout
      loading={loading}
      skeleton={
        <>
          <section>
            <Skeleton className="h-8 w-56 rounded mt-6" />
            <SkeletonGrid count={7} />
          </section>
          <section>
            <Skeleton className="h-8 w-56 rounded mt-6" />
            <SkeletonGrid count={7} />
          </section>
        </>
      }
    >
      {!loading && (
        <>
          <section>
            <Heading as="h2" className="mt-6">
              {label} Movies
            </Heading>
            {movies && movies.length !== 0 ? (
              <GridLayout>
                {movies.map((movie) => (
                  <ItemCard
                    key={movie.id}
                    id={movie.id}
                    imgSrc={movie.poster_path ?? ""}
                    releaseDate={movie.release_date?.substring(0, 4) ?? ""}
                    media_type="movie"
                    rating={movie.vote_average ?? 0}
                    title={movie.title ?? ""}
                    saveKind={saveKind}
                  />
                ))}
              </GridLayout>
            ) : (
              <div>No {label} Movies...</div>
            )}
          </section>
          <section>
            <Heading as="h2" className="mt-6">
              {label} TV Shows
            </Heading>
            {tvShows && tvShows.length !== 0 ? (
              <GridLayout>
                {tvShows.map((tvShow) => (
                  <ItemCard
                    key={tvShow.id}
                    id={tvShow.id}
                    imgSrc={tvShow.poster_path ?? ""}
                    releaseDate={tvShow.first_air_date?.substring(0, 4) ?? ""}
                    media_type="tv"
                    rating={tvShow.vote_average ?? 0}
                    title={tvShow.name ?? ""}
                    saveKind={saveKind}
                  />
                ))}
              </GridLayout>
            ) : (
              <div>No {label} TV Shows...</div>
            )}
          </section>
        </>
      )}
    </PageLayout>
  );
};

export default SavedMediaPage;
