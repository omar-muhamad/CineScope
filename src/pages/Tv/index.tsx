import { FC, useState } from "react";

import PageLayout from "@/components/layout/PageLayout";
import ItemCard from "@/components/ui/ItemCard";
import GridLayout from "@/components/layout/GridLayout";
import { usePopular } from "@/queries/usePopular";
import Heading from "@/components/ui/Heading";
import ReactPagination from "@/components/common/ReactPagination";
import Skeleton from "@/components/skeletons/Skeleton";
import SkeletonGrid from "@/components/skeletons/SkeletonGrid";

const Tv: FC = () => {
  const [page, setPage] = useState(1);
  const { data, isLoading } = usePopular("tv", page);

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
        Popular TV Shows
      </Heading>
      <GridLayout>
        {!loading && currentItems && currentItems.length !== 0
          ? currentItems.map((tvShow) => (
              <ItemCard
                key={tvShow.id}
                id={tvShow.id}
                imgSrc={tvShow.poster_path}
                releaseDate={tvShow.first_air_date?.substring(0, 4)}
                media_type="tv"
                rating={tvShow.vote_average}
                title={tvShow.name}
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

export default Tv;
