import { FC, useState, useTransition } from "react";

import PageLayout from "@/components/layout/PageLayout";
import ItemCard from "@/components/ui/ItemCard";
import GridLayout from "@/components/layout/GridLayout";
import Heading from "@/components/ui/Heading";
import QueryBoundary from "@/components/common/QueryBoundary";
import { useMediaList } from "@/queries/useMediaList";
import ReactPagination from "@/components/common/ReactPagination";
import SkeletonGrid from "@/components/skeletons/SkeletonGrid";
import type { MovieCategory } from "@/api/tmdb";

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
  page: number;
  onPageChange: (event: { selected: number }) => void;
};

/** The movies grid + pagination for one category. Suspends on first load only. */
const MoviesGrid: FC<GridProps> = ({ category, page, onPageChange }) => {
  const { data } = useMediaList("movie", category, page);
  const totalPages = data.total_pages ?? 0;
  const pageCount = totalPages > 100 ? 100 : totalPages;

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
 * a different `category` prop (defaults to popular).
 */
const Movies: FC<MoviesProps> = ({ category = "popular" }) => {
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
          <MoviesGrid
            page={page}
            category={category}
            onPageChange={onPageChange}
          />
        </QueryBoundary>
      </div>
    </PageLayout>
  );
};

export default Movies;
