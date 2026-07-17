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
import type { DiscoverFilters, TvCategory } from "@/api/tmdb";

const CATEGORY_TITLES: Record<TvCategory, string> = {
  popular: "Popular TV Shows",
  trending: "Trending TV Shows",
  on_the_air: "On TV",
  top_rated: "Top Rated TV Shows",
};

type TvProps = {
  category?: TvCategory;
};

type GridProps = {
  category: TvCategory;
  filters: DiscoverFilters;
  page: number;
  onPageChange: (event: { selected: number }) => void;
};

/** The TV grid + pagination for one category. Suspends on first load only. */
const TvGrid: FC<GridProps> = ({ category, filters, page, onPageChange }) => {
  const { data } = useMediaList("tv", category, page, filters);
  const totalPages = data.total_pages ?? 0;
  const pageCount = totalPages > 100 ? 100 : totalPages;

  if (data.results.length === 0) {
    return (
      <Text className="mt-6 text-lg text-gray">
        No TV shows match these filters.
      </Text>
    );
  }

  return (
    <>
      <GridLayout>
        {data.results.map((tvShow) => (
          <ItemCard
            key={tvShow.id}
            id={tvShow.id}
            imgSrc={tvShow.poster_path}
            releaseDate={tvShow.first_air_date?.substring(0, 4)}
            media_type="tv"
            rating={tvShow.vote_average}
            title={tvShow.name}
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
 * Paginated TV browse page. Each navbar dropdown category routes here with a
 * different `category` prop (defaults to popular); the filter bar narrows the
 * list by year / rating / genre. Filters live in the URL query params
 * (`year` / `rating` / `genre`) so a filtered view survives reloads and can
 * be shared.
 */
const Tv: FC<TvProps> = ({ category = "popular" }) => {
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
        mediaType="tv"
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
          <TvGrid
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

export default Tv;
