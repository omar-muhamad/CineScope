import { FC, useState, useTransition } from "react";

import PageLayout from "@/components/layout/PageLayout";
import ItemCard from "@/components/ui/ItemCard";
import GridLayout from "@/components/layout/GridLayout";
import Heading from "@/components/ui/Heading";
import QueryBoundary from "@/components/common/QueryBoundary";
import { useMediaList } from "@/queries/useMediaList";
import ReactPagination from "@/components/common/ReactPagination";
import SkeletonGrid from "@/components/skeletons/SkeletonGrid";
import type { MediaCategory, MediaType } from "@/api/tmdb";

type MediaListProps = {
  mediaType: MediaType;
  category: MediaCategory;
  /** Heading shown above the grid, e.g. "Trending Movies", "On TV". */
  title: string;
};

type GridProps = {
  mediaType: MediaType;
  category: MediaCategory;
  page: number;
  onPageChange: (event: { selected: number }) => void;
};

/** The browse-category grid + pagination. Suspends on first load only. */
const MediaListGrid: FC<GridProps> = ({
  mediaType,
  category,
  page,
  onPageChange,
}) => {
  const { data } = useMediaList(mediaType, category, page);
  const totalPages = data.total_pages ?? 0;
  const pageCount = totalPages > 100 ? 100 : totalPages;

  return (
    <>
      <GridLayout>
        {data.results.map((item) => (
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
 * Generic, paginated browse page shared by every navbar dropdown category
 * (trending / now playing / upcoming / top rated / on the air). The field
 * picked off each result depends on media type — movies expose
 * `title`/`release_date`, TV exposes `name`/`first_air_date`.
 */
const MediaList: FC<MediaListProps> = ({ mediaType, category, title }) => {
  const [page, setPage] = useState(1);
  const [isPending, startTransition] = useTransition();

  // Page through inside a transition so the current grid stays visible while
  // the next page suspends, instead of flashing the skeleton fallback.
  const onPageChange = ({ selected }: { selected: number }) =>
    startTransition(() => setPage(selected + 1));

  return (
    <PageLayout>
      <Heading as="h1" className="text-orange font-bold max-md:text-xl">
        {title}
      </Heading>
      <div className={isPending ? "opacity-60 transition-opacity" : undefined}>
        <QueryBoundary
          fallback={<SkeletonGrid count={20} />}
          resetKeys={[mediaType, category]}
        >
          <MediaListGrid
            mediaType={mediaType}
            category={category}
            page={page}
            onPageChange={onPageChange}
          />
        </QueryBoundary>
      </div>
    </PageLayout>
  );
};

export default MediaList;
