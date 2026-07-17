import { FC, useState, useTransition } from "react";

import PageLayout from "@/components/layout/PageLayout";
import ItemCard from "@/components/ui/ItemCard";
import GridLayout from "@/components/layout/GridLayout";
import Heading from "@/components/ui/Heading";
import QueryBoundary from "@/components/common/QueryBoundary";
import { useMediaList } from "@/queries/useMediaList";
import ReactPagination from "@/components/common/ReactPagination";
import SkeletonGrid from "@/components/skeletons/SkeletonGrid";
import type { TvCategory } from "@/api/tmdb";

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
  page: number;
  onPageChange: (event: { selected: number }) => void;
};

/** The TV grid + pagination for one category. Suspends on first load only. */
const TvGrid: FC<GridProps> = ({ category, page, onPageChange }) => {
  const { data } = useMediaList("tv", category, page);
  const totalPages = data.total_pages ?? 0;
  const pageCount = totalPages > 100 ? 100 : totalPages;

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
 * different `category` prop (defaults to popular).
 */
const Tv: FC<TvProps> = ({ category = "popular" }) => {
  const [page, setPage] = useState(1);
  const [isPending, startTransition] = useTransition();

  // Category routes all render this same component, so React keeps its state
  // across navigation — restart from page 1 when the category changes.
  const [prevCategory, setPrevCategory] = useState(category);
  if (prevCategory !== category) {
    setPrevCategory(category);
    setPage(1);
  }

  // Page through inside a transition so the current grid stays visible while
  // the next page suspends, instead of flashing the skeleton fallback.
  const onPageChange = ({ selected }: { selected: number }) =>
    startTransition(() => setPage(selected + 1));

  return (
    <PageLayout>
      <Heading as="h1" className="text-orange font-bold max-md:text-xl">
        {CATEGORY_TITLES[category]}
      </Heading>
      <div className={isPending ? "opacity-60 transition-opacity" : undefined}>
        <QueryBoundary
          fallback={<SkeletonGrid count={20} />}
          resetKeys={[category]}
        >
          <TvGrid page={page} category={category} onPageChange={onPageChange} />
        </QueryBoundary>
      </div>
    </PageLayout>
  );
};

export default Tv;
