import { FC, useState, useTransition } from "react";
import { useSearchParams } from "react-router-dom";

import PageLayout from "@/components/layout/PageLayout";
import ItemCard from "@/components/ui/ItemCard";
import GridLayout from "@/components/layout/GridLayout";
import Heading from "@/components/ui/Heading";
import Text from "@/components/ui/Text";
import QueryBoundary from "@/components/common/QueryBoundary";
import MediaFilters from "@/components/common/MediaFilters";
import { useMediaList } from "@/queries/useMediaList";
import ReactPagination from "@/components/common/ReactPagination";
import SkeletonGrid from "@/components/skeletons/SkeletonGrid";
import {
  filtersFromParams,
  filtersKey,
  paramsWithFilters,
} from "@/lib/filterParams";
import type { DiscoverFilters, MovieCategory } from "@/api/tmdb";

const CATEGORY_TITLES: Record<MovieCategory, string> = {
  popular: "Popular Movies",
  trending: "Trending Movies",
  now_playing: "Now Playing",
  upcoming: "Upcoming Movies",
  top_rated: "Top Rated Movies",
};

type MoviesProps = {
  category?: MovieCategory;
};

type GridProps = {
  category: MovieCategory;
  filters: DiscoverFilters;
  page: number;
  onPageChange: (event: { selected: number }) => void;
};

/** The movies grid + pagination for one category. Suspends on first load only. */
const MoviesGrid: FC<GridProps> = ({
  category,
  filters,
  page,
  onPageChange,
}) => {
  const { data } = useMediaList("movie", category, page, filters);
  const totalPages = data.total_pages ?? 0;
  const pageCount = totalPages > 100 ? 100 : totalPages;

  if (data.results.length === 0) {
    return (
      <Text className="mt-6 text-lg text-gray">
        No movies match these filters.
      </Text>
    );
  }

  return (
    <>
      <GridLayout>
        {data.results.map((movie) => (
          <ItemCard
            key={movie.id}
            id={movie.id}
            imgSrc={movie.poster_path}
            releaseDate={movie.release_date?.substring(0, 4)}
            media_type="movie"
            rating={movie.vote_average}
            title={movie.title}
          />
        ))}
      </GridLayout>
      <div className="pr-6 md:pr-0">
        <ReactPagination
          pageCount={pageCount}
          handlePageClick={onPageChange}
          page={page}
        />
      </div>
    </>
  );
};

/**
 * Paginated movie browse page. Each navbar dropdown category routes here with
 * a different `category` prop (defaults to popular); the filter bar narrows
 * the list by year / rating / genre. Filters live in the URL query params
 * (`year` / `rating` / `genre`) so a filtered view survives reloads and can
 * be shared.
 */
const Movies: FC<MoviesProps> = ({ category = "popular" }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const filters = filtersFromParams(searchParams);
  const [page, setPage] = useState(1);
  const [isPending, startTransition] = useTransition();

  // Category routes all render this same component, so React keeps its state
  // across navigation — start over at page 1 whenever the category or the
  // URL-driven filters change (covers the filter bar, back/forward, and
  // pasted links alike).
  const resetKey = `${category}|${filtersKey(filters)}`;
  const [prevResetKey, setPrevResetKey] = useState(resetKey);
  if (prevResetKey !== resetKey) {
    setPrevResetKey(resetKey);
    setPage(1);
  }

  // Page and filter changes happen inside a transition so the current grid
  // stays visible while the next page suspends, instead of flashing the
  // skeleton fallback.
  const onPageChange = ({ selected }: { selected: number }) =>
    startTransition(() => setPage(selected + 1));

  // Replace instead of push so every tweak doesn't pile up in history.
  const onFiltersChange = (next: DiscoverFilters) =>
    startTransition(() =>
      setSearchParams(paramsWithFilters(searchParams, next), {
        replace: true,
      }),
    );

  return (
    <PageLayout>
      <Heading as="h1" className="text-orange font-bold max-md:text-xl">
        {CATEGORY_TITLES[category]}
      </Heading>
      <MediaFilters
        mediaType="movie"
        filters={filters}
        onChange={onFiltersChange}
      />
      <div className={isPending ? "opacity-60 transition-opacity" : undefined}>
        {/* resetKeys must be stable primitives — `filters` is a fresh object
            every render, which would reset an errored section in a loop. */}
        <QueryBoundary
          fallback={<SkeletonGrid count={20} />}
          resetKeys={[resetKey]}
        >
          <MoviesGrid
            page={page}
            category={category}
            filters={filters}
            onPageChange={onPageChange}
          />
        </QueryBoundary>
      </div>
    </PageLayout>
  );
};

export default Movies;
