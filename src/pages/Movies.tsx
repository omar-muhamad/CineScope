import { FC, useState } from "react";

import PageLayout from "@/components/layout/PageLayout";
import ItemCard from "@/components/ui/ItemCard";
import GridLayout from "@/components/layout/GridLayout";
import Heading from "@/components/ui/Heading";
import { usePopular } from "@/queries/usePopular";
import ReactPagination from "@/components/common/ReactPagination";
import Skeleton from "@/components/skeletons/Skeleton";
import SkeletonGrid from "@/components/skeletons/SkeletonGrid";

const Movies: FC = () => {
  const [page, setPage] = useState(1);
  const { data, isLoading } = usePopular("movie", page);

  const loading = isLoading;
  const currentItems = data?.results;
  const totalPages = data?.total_pages ?? 0;
  const pageCount = totalPages > 100 ? 100 : totalPages;

  const handlePageClick = (event: { selected: number }) => {
    setPage(event.selected + 1);
  };

  return (
    <PageLayout
      loading={loading}
      skeleton={
        <>
          <Skeleton className="h-9 w-60 rounded-sm" />
          <SkeletonGrid count={20} />
        </>
      }
    >
      <Heading as="h1" className="text-orange font-bold max-md:text-xl">
        Popular Movies
      </Heading>
      <GridLayout>
        {!loading && currentItems && currentItems.length !== 0
          ? currentItems.map((movie) => (
              <ItemCard
                key={movie.id}
                id={movie.id}
                imgSrc={movie.poster_path}
                releaseDate={movie.release_date?.substring(0, 4)}
                media_type="movie"
                rating={movie.vote_average}
                title={movie.title}
              />
            ))
          : null}
      </GridLayout>
      <div className="pr-6 md:pr-0">
        <ReactPagination
          pageCount={pageCount}
          handlePageClick={handlePageClick}
          page={page}
        />
      </div>
    </PageLayout>
  );
};

export default Movies;
