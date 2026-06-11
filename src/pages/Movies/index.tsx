import { FC, useState, useTransition } from "react";

import PageLayout from "@/components/layout/PageLayout";
import ItemCard from "@/components/ui/ItemCard";
import GridLayout from "@/components/layout/GridLayout";
import Heading from "@/components/ui/Heading";
import QueryBoundary from "@/components/common/QueryBoundary";
import { usePopular } from "@/queries/usePopular";
import ReactPagination from "@/components/common/ReactPagination";
import SkeletonGrid from "@/components/skeletons/SkeletonGrid";

type GridProps = {
  page: number;
  onPageChange: (event: { selected: number }) => void;
};

/** The popular-movies grid + pagination. Suspends on first load only. */
const PopularMoviesGrid: FC<GridProps> = ({ page, onPageChange }) => {
  const { data } = usePopular("movie", page);
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

const Movies: FC = () => {
  const [page, setPage] = useState(1);
  const [isPending, startTransition] = useTransition();

  // Page through inside a transition so the current grid stays visible while
  // the next page suspends, instead of flashing the skeleton fallback.
  const onPageChange = ({ selected }: { selected: number }) =>
    startTransition(() => setPage(selected + 1));

  return (
    <PageLayout>
      <Heading as="h1" className="text-orange font-bold max-md:text-xl">
        Popular Movies
      </Heading>
      <div className={isPending ? "opacity-60 transition-opacity" : undefined}>
        <QueryBoundary fallback={<SkeletonGrid count={20} />}>
          <PopularMoviesGrid page={page} onPageChange={onPageChange} />
        </QueryBoundary>
      </div>
    </PageLayout>
  );
};

export default Movies;
