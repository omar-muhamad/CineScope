import { FC, useState } from "react";

import PageLayout from "@/components/layout/PageLayout";
import ItemCard from "@/components/ui/ItemCard";
import GridLayout from "@/components/layout/GridLayout";
import Heading from "@/components/ui/Heading";
import { useMediaList } from "@/queries/useMediaList";
import ReactPagination from "@/components/common/ReactPagination";
import Skeleton from "@/components/skeletons/Skeleton";
import SkeletonGrid from "@/components/skeletons/SkeletonGrid";
import type { MediaCategory, MediaType } from "@/api/tmdb";

type MediaListProps = {
  mediaType: MediaType;
  category: MediaCategory;
  /** Heading shown above the grid, e.g. "Trending Movies", "On TV". */
  title: string;
};

/**
 * Generic, paginated browse page shared by every navbar dropdown category
 * (trending / now playing / upcoming / top rated / on the air). Modeled on the
 * existing Popular pages; the field picked off each result depends on media
 * type — movies expose `title`/`release_date`, TV exposes `name`/`first_air_date`.
 */
const MediaList: FC<MediaListProps> = ({ mediaType, category, title }) => {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useMediaList(mediaType, category, page);

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
        {title}
      </Heading>
      <GridLayout>
        {!loading && currentItems && currentItems.length !== 0
          ? currentItems.map((item) => (
              <ItemCard
                key={item.id}
                id={item.id}
                imgSrc={item.poster_path}
                releaseDate={(mediaType === "movie"
                  ? item.release_date
                  : item.first_air_date
                )?.substring(0, 4)}
                media_type={mediaType}
                rating={item.vote_average}
                title={mediaType === "movie" ? item.title : item.name}
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

export default MediaList;
